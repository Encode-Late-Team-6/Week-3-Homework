import { ethers } from "hardhat";
import { TokenizedBallot__factory } from "../typechain-types";
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
  const args = process.argv.slice(2);
  const tokenizedBallotAddress = "0x05fF20a286E183e3badFb178F1351aD4e251B844";
  const proposalIndex = args[0];

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
  const contractFactory = new TokenizedBallot__factory(signer);

  //Attach an address to the contract
  console.log("Attaching to ERC20TokenVotes contract at address", tokenizedBallotAddress);
  const contract = await contractFactory.attach(tokenizedBallotAddress);
  console.log("Successfully attached");

  //Get the voting power
  const votePower = await contract.votingPower(signer.address);
  console.log(`Voting power is ${ethers.utils.formatEther(votePower)}`);


  // Cast Votes
  const voteTx = await contract.vote(proposalIndex, votePower);
  const voteTxReceipt = await voteTx.wait();
  console.log(`You have succesfully voted for the porposal: ${proposalIndex}`);

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});