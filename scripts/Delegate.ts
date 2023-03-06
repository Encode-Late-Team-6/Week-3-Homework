import { MyToken__factory } from "./../typechain-types/factories/contracts/MyToken__factory";
import { ethers } from "hardhat";
import * as dotenv from "dotenv";
dotenv.config();

const tokenContractAddress = "0x9a750a01629649975dc1f4e608ab203016f55180";

async function main() {
  const args = process.argv.slice(2);
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

  const tokenContract = new MyToken__factory(signer).attach(
    tokenContractAddress
  );

  // Check voting power
  const votePower = await tokenContract.getVotes(signer.address);
  console.log(`The voting power is ${ethers.utils.formatEther(votePower)}`);

  const tokenBalanceAccount1 = await tokenContract.balanceOf(signer.address);
  console.log(
    `The signer balance is ${ethers.utils.formatEther(
      tokenBalanceAccount1
    )} tokens`
  );

  // Testing delegate function
  try {
    const delegateTx = await tokenContract.delegate(signer.address);
    const delegateTxReceipt = await delegateTx.wait();

    console.log(
      `Token delegated to ${signer.address} at block number: ${delegateTxReceipt.blockNumber}!`,
      delegateTx
    );
  } catch (error) {
    console.log("Failed to delegate", error);
  }

  // Recheck voting power
  const votingPowerAfterDelegation = await tokenContract.getVotes(
    signer.address
  );
  console.log(
    `The voting power is ${ethers.utils.formatEther(
      votingPowerAfterDelegation
    )}`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
