import { WebUploader } from "@irys/web-upload";
import { WebEthereum } from "@irys/web-upload-ethereum";
import { EthersV6Adapter } from "@irys/web-upload-ethereum-ethers-v6";
import { ethers } from "ethers";

window.InitSovereignIrys = async function(rawProvider) {
    try {
        const provider = new ethers.BrowserProvider(rawProvider);
        
        // ใช้ Modular SDK เชื่อมต่อกับ Base Mainnet
        // Irys ใช้คำว่า "ethereum" เป็นชื่อ Token สำหรับจ่ายค่าแก๊สบน L2 (Base)
        const irysUploader = await WebUploader(WebEthereum)
            .withAdapter(EthersV6Adapter(provider))
            .withRpc("https://mainnet.base.org") // บังคับชี้ไปที่ Base
            .withToken("ethereum"); 
            
        return irysUploader;
    } catch (error) {
        console.error("[Irys Build] Initialization Failed:", error);
        throw error;
    }
};