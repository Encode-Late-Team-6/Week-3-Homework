import { ethers } from "ethers";
import * as dotenv from 'dotenv';
import { MyToken__factory } from "../typechain-types/factories/contracts";
dotenv.config();

async function main(){

    const provider = new ethers.providers.InfuraProvider(
        "goerli",
        process.env.INFURA_API_KEY);
    const privateKey = process.env.PRIVATE_KEY;
    
    if(!privateKey || privateKey.length<=0)
        throw new Error("Private Key Not Found");

    const wallet = new ethers.Wallet(privateKey);
    const signer = wallet.connect(provider);

    const tokenContractFactory = new MyToken__factory(signer);
    const gasLimit = 5000000;
    const tokenContract = await tokenContractFactory.deploy({gasLimit});

    const deploytx = await tokenContract.deployTransaction.wait()

    console.log(
        `the contract was deployed at address ${tokenContract.address} on blocknumber ${deploytx.blockNumber}`
        );

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });