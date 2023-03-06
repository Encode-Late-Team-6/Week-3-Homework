import { ethers } from "hardhat";
import { MyToken__factory } from "../typechain-types";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const tokenAddress = "0x9a750a01629649975dc1f4e608ab203016f55180";
  const delegateAddress = args[0];

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

  //Deploy the contract
  const contractFactory = new MyToken__factory(signer);

  //Attach an address to the contract
  console.log("Attaching to ERC20TokenVotes contract at address", tokenAddress);
  const contract = await contractFactory.attach(tokenAddress);
  console.log("Successfully attached");

  //Check the voting power
  const votePower = await contract.getVotes(signer.address);
  console.log(`Voting power is ${ethers.utils.formatEther(votePower)}`);

  const tokenBalanceAccount1 = await contract.balanceOf(signer.address);
  console.log(`The signer has a balance of ${ethers.utils.formatEther(tokenBalanceAccount1)} voting tokens!`);

  //Set the self-delegate
  const delegateTx = await contract.delegate(signer.address);
  const delegateTxReceipt = await delegateTx.wait();
  console.log(`Token delegate to ${signer.address} at block number ${delegateTxReceipt.blockNumber}`);


  //Check the voting power
  const votePowerAccountAfterDelegate = await contract.getVotes(signer.address);
  console.log(`Account voting power is ${ethers.utils.formatEther(votePowerAccountAfterDelegate)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});