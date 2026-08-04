import { WebUploader } from "@irys/web-upload";
import { WebEthereum } from "@irys/web-upload-ethereum";
import { EthersV6Adapter } from "@irys/web-upload-ethereum-ethers-v6";
import { ethers } from "ethers";

window.InitSovereignIrys = async function(rawProvider) {
    try {
        const provider = new ethers.BrowserProvider(rawProvider);
        
        // 🎯 ดึง Dedicated RPC (Alchemy Key 2)
        const dedicatedIrisRpc = "https://base-mainnet.g.alchemy.com/v2/wR5UgtUrkfPjKnqfMhm8k";

        const irysUploader = await WebUploader(WebEthereum)
            .withAdapter(EthersV6Adapter(provider))
            .withRpc(dedicatedIrisRpc)
            .withNetwork("mainnet") // ระบุ Irys Network ที่ต้องการเชื่อมต่อ (mainnet/devnet)
            .withToken("base-eth")  // เปลี่ยนเป็น base-eth เพื่อให้สอดคล้องกับ Base Network
            .build();               // ✅ เพิ่ม .build() เพื่อสร้าง Uploader Instance
            
        return irysUploader;
    } catch (error) {
        console.error("[Irys Build] Initialization Failed:", error);
        throw error;
    }
};