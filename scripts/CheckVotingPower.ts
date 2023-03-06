import { TokenizedBallot__factory } from "./../typechain-types/factories/contracts/TokenizedBallot.sol/TokenizedBallot__factory";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const tokenizedBallotContractAddress =
  "0xD7B7419e9FaC3D687a206e0656Ec7938049aA9e2";

async function main() {
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

  //   Testing votingPower function
  try {
    const votingPower = await tokenizedBallotContract.votingPower(
      signer.address
    );

    console.log(
      `The voting power of the address ${signer.address} is: ${votingPower}`
    );
  } catch (error) {
    console.log("Failed to get voting power", error);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
