const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { ethers } = require('ethers');

const app = express();
app.use(cors());

// ==========================================
// ⚙️ CONFIGURATION
// ==========================================
const RPC_URL = "https://mainnet.base.org"; 
const CONTRACT_ADDRESS = "0xใส่ที่อยู่SmartContractของพี่ตรงนี้"; 
const ARWEAVE_GATEWAY = "https://arweave.net/"; // ใช้ Arweave เสิร์ฟ OpenSea ชัวร์สุด

const ABI = [
    "function getDeedData(uint256 t) external view returns (address owner, bool active, bool sanctified, string memory front, string memory back, string memory video, string memory dna, string memory hidden)"
];

const provider = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

// ฟังก์ชันพระเอก: เช็คว่าเป็น TX ID เพียวๆ หรือ URL แล้วประกอบร่างให้สมบูรณ์
function formatUrl(txIdOrUrl) {
    if (!txIdOrUrl || txIdOrUrl === "UNASSIGNED" || txIdOrUrl.trim() === "") return null;
    
    // ถ้าเป็น URL ของ Irys ให้แปลงเป็น Arweave (เพราะ OpenSea ชอบบล็อก Irys)
    if (txIdOrUrl.startsWith('http')) {
        return txIdOrUrl.replace('https://gateway.irys.xyz/', ARWEAVE_GATEWAY);
    }
    
    // ถ้ามาเป็น TX ID เพียวๆ (แบบ Back URI ในรูป) ให้เติม Gateway เข้าไป
    return `${ARWEAVE_GATEWAY}${txIdOrUrl}`;
}

app.get('/metadata/:tokenId', async (req, res) => {
    // 🚀 1. บังคับ Vercel Cache 1 วัน (ตอบกลับ OpenSea ใน 0.01 วิ)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=59');
    res.setHeader('Content-Type', 'application/json');

    // 🚀 2. ดักตัด .json ทิ้ง (กันบั๊ก)
    let tokenId = req.params.tokenId;
    if (tokenId.endsWith('.json')) tokenId = tokenId.replace('.json', '');
    if (isNaN(tokenId)) return res.status(400).json({ error: "Invalid Token ID" });

    try {
        // 🚀 3. ดึง Data สดๆ จาก Smart Contract
        const deedData = await contract.getDeedData(tokenId);
        
        const isSanctified = deedData[2];
        const frontTxId = deedData[3]; 
        const backTxId = deedData[4];  
        const videoTxId = deedData[5]; 
        const dnaTxId = deedData[6];   

        if (!frontTxId || frontTxId === "UNASSIGNED") {
            return res.status(404).json({ error: "Metadata not forged yet" });
        }

        // 🚀 4. แกะกล่อง Front URI (ดึง JSON ออกมา)
        const jsonUrl = formatUrl(frontTxId);
        const response = await axios.get(jsonUrl, { timeout: 5000 });
        const rawJson = response.data;

        // 🚀 5. แกะ TX ID ของรูปภาพที่ซ่อนอยู่ใน JSON แล้วประกอบเป็น URL เต็ม
        const imageUrl = formatUrl(rawJson.image);

        // 🚀 6. ประกอบร่าง URL ของฟิลด์อื่นๆ (เติม Gateway ให้ Back URI)
        const backUrl = formatUrl(backTxId);
        const videoUrl = formatUrl(videoTxId);
        const dnaUrl = formatUrl(dnaTxId);

        // 🚀 7. สร้าง JSON เสิร์ฟใส่ปาก OpenSea
        const finalMetadata = {
            name: rawJson.name || `THE IMPERIAL SOVEREIGN DEED #${tokenId}`,
            description: rawJson.description || "",
            image: imageUrl, // รูปหลัก
            attributes: rawJson.attributes || []
        };

        // เพิ่มสถานะ Sanctified ลงใน Properties
        finalMetadata.attributes.push({
            trait_type: "Sanctified (NOVA)",
            value: isSanctified ? "TRUE" : "FALSE"
        });

        // 🔥 ไฮไลท์: จัดการวิดีโอและหลังโฉนด (Back URI)
        // ถ้ามี Video ให้ใช้วิดีโอเป็น animation_url
        // แต่ถ้าไม่มี Video แต่มี Back URI ให้เอา Back URI ไปโชว์แทน!
        if (videoUrl) {
            finalMetadata.animation_url = videoUrl;
        } else if (backUrl) {
            finalMetadata.animation_url = backUrl; 
        }

        // ถ้ามี DNA ให้ใส่เป็น Properties
        if (dnaTxId && dnaTxId !== "UNASSIGNED") {
            finalMetadata.attributes.push({ trait_type: "Identity DNA", value: dnaTxId });
        }

        // ส่ง JSON ที่เคี้ยวเสร็จแล้วให้ OpenSea
        return res.status(200).json(finalMetadata);

    } catch (error) {
        console.error(`Error fetching token ${tokenId}:`, error.message);
        // ถ้า Arweave ล่มชั่วคราว ส่ง JSON สำรองไปกัน OpenSea แบน
        return res.status(200).json({
            name: `THE IMPERIAL SOVEREIGN DEED #${tokenId}`,
            description: "Metadata is currently syncing with the Imperial Archives...",
            image: "https://arweave.net/ใส่_TX_ID_รูปโลโก้โปรเจกต์ตรงนี้"
        });
    }
});

module.exports = app;