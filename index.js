import { WebUploader } from "@irys/web-upload";
import { WebEthereum } from "@irys/web-upload-ethereum";
import { EthersV6Adapter } from "@irys/web-upload-ethereum-ethers-v6";
import { ethers } from "ethers";

window.InitSovereignIrys = async function(rawProvider) {
    try {
        const provider = new ethers.BrowserProvider(rawProvider);
        const irysUploader = await WebUploader(WebEthereum)
            .withAdapter(EthersV6Adapter(provider));
            
        return irysUploader;
    } catch (error) {
        console.error("[Irys Build] Initialization Failed:", error);
        throw error;
    }
};