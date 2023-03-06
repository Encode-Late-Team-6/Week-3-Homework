import { MyToken__factory } from "./../typechain-types/factories/contracts/MyToken__factory";
import { TokenizedBallot__factory } from "./../typechain-types/factories/contracts/TokenizedBallot.sol/TokenizedBallot__factory";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const tokenizedBallotContractAddress =
  "0xD7B7419e9FaC3D687a206e0656Ec7938049aA9e2";
const tokenContractAddress = "0x9a750a01629649975dc1f4e608ab203016f55180";

async function main() {
  const args = process.argv.slice(2);
  console.log(args, "❌");
  const provider = new ethers.providers.AlchemyProvider(
    "goerli",
    process.env.ALCHEMY_API_KEY
  );
  const privateKey = process.env.PRIVATE_WALLET_KEY;
  if (!privateKey || privateKey.length <= 0) {
    throw new Error("No private key provided");
  }

  const wallet = new ethers.Wallet(privateKey);
  const signer = wallet.connect(provider);

  const lastBlock = await provider.getBlock("latest");
  console.log({ lastBlock });

  const tokenizedBallotContract = new TokenizedBallot__factory(signer).attach(
    tokenizedBallotContractAddress
  );

  const tokenContract = new MyToken__factory(signer).attach(
    tokenContractAddress
  );

  const targetBlock = await tokenizedBallotContract.targetBlockNumber();

  //   Testing vote function
  try {
    const votePower = await tokenContract.getPastVotes(
      signer.address,
      targetBlock
    );
    console.log(`The voting power is ${ethers.utils.formatEther(votePower)}`);

    const votingTx = await tokenizedBallotContract.vote(
      args[0] || 0,
      votePower
    );
    const votingTxReceipt = await votingTx.wait();

    console.log(
      `Vote added at block number: ${votingTxReceipt.blockNumber}!`,
      votingTx
    );
  } catch (error) {
    console.log("Failed to vote", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
