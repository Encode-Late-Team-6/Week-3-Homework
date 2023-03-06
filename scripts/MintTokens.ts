import { ethers } from "hardhat";
import { MyToken__factory } from "../typechain-types";
import * as dotenv from "dotenv";
dotenv.config();

const MINT_VALUE = ethers.utils.parseEther("10");
async function main() {
    const args = process.argv.slice(2);
    const tokenAddress = "0x9a750a01629649975dc1f4e608ab203016f55180";
    const account = args[0];
  
    const provider = new ethers.providers.AlchemyProvider(
      "goerli",
      process.env.ALCHEMY_API_KEY
    );
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey || privateKey.length <= 0) {
      throw new Error("Private key missing");
    }
  
    const wallet = new ethers.Wallet(privateKey);
    console.log("Connected to the wallet address", wallet.address);
    const signer = wallet.connect(provider);
  
    const contractFactory = new MyToken__factory(signer);
  
    //Attach an address to the contract
    console.log("Attaching to ERC20TokenVotes contract at address", tokenAddress);
    const contract = await contractFactory.attach(tokenAddress);
    console.log("Successfully attached");
  
    //The deployer mint token for the account 1
    const mintTx = await contract.mint(account, MINT_VALUE);
    const mintTransactionReceipt = await mintTx.wait();
    console.log(`Minted ${MINT_VALUE.toString()} decimal units to account ${account} at block number ${mintTransactionReceipt.blockNumber}`);
  
    const tokenBalanceAccount1 = await contract.balanceOf(account);
    console.log(`Account 1 has a balance of ${tokenBalanceAccount1.toString()} vote tokens!`);
  }
  
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });