import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { MyToken, TokenizedBallot, MyToken__factory, TokenizedBallot__factory } from "../typechain-types";
import * as dotenv from 'dotenv';
import { JsonRpcProvider, JsonRpcSigner } from "@ethersproject/providers";
dotenv.config();

const MINT_VALUE = ethers.utils.parseEther('0.00001');
const PROPOSALS = ['Proposal 1', 'Proposal 2', 'Proposal 3'];

async function main() {
    const account1 : JsonRpcSigner = new ethers.providers.JsonRpcProvider().getSigner(process.env.ACCOUNT1_PUBLIC_KEY);
    // Deploy the contract on TESTNET
    const provider = new ethers.providers.AlchemyProvider('goerli', process.env.ALCHEMY_API_KEY);
    const privateKey = process.env.PRIVATE_WALLET_KEY;
    if (!privateKey || privateKey.length <= 0) {
        throw new Error("No private key provided");
    }

    const wallet = new ethers.Wallet(privateKey); 
    const deployer = wallet.connect(provider);

    const bytes32Proposals = PROPOSALS.map((prop) => ethers.utils.formatBytes32String(prop));
    let myVotePower : BigNumber;

    const myTokenFactory = new MyToken__factory(deployer);
    const myTokenContract: MyToken = await myTokenFactory.deploy();
    await myTokenContract.deployTransaction.wait();

    const tokenizedBallotFactory = new TokenizedBallot__factory(deployer);
    const tokenizedBallotContract: TokenizedBallot = await tokenizedBallotFactory.deploy(bytes32Proposals, myTokenContract.address, 0);
    await tokenizedBallotContract.deployTransaction.wait();

    console.log(`🚀 The token contract address: ${myTokenContract.address}`);
    console.log(`🚀 The token contract address: ${tokenizedBallotContract.address}`);
    console.log(`🚀 The account1 address: ${account1.getAddress()}`);

    // Mint some tokens to account1
    const mintTxn = await myTokenContract.mint(account1.getAddress(), MINT_VALUE);
    await mintTxn.wait();

    const myTokenCoins = await myTokenContract.balanceOf(account1.getAddress());
    console.log(`🚀 The account1 address: ${account1.getAddress()}`);
    console.log(`🚀 The account1 token coins: ${ethers.utils.formatEther(myTokenCoins)}`);
    
    // Check the voting power through get Votes
    myVotePower = await myTokenContract.connect(account1).getVotes(account1.getAddress());
    console.log(`🚀 The account1 has vote power before delegation: ${ethers.utils.formatEther(myVotePower)}`);

    // Delegate the account1 tokens to itself to get the voting power
    const delegateTxn = await myTokenContract.connect(account1).delegate(account1.getAddress());
    await delegateTxn.wait();

    // Set the target block number to the latest (Block 4)
    const setTargetBlock = await tokenizedBallotContract.setTargetBlockNumber(4); // to pass correct block into getPastVotes inside the contract
    await setTargetBlock.wait();

    // Check the voting power, it should has MINT_VALUE
    myVotePower = await tokenizedBallotContract.connect(account1).votingPower(account1.getAddress()); // it accesses the getPastVotes function
    console.log(`🚀 The account1 has vote power after delegation: ${ethers.utils.formatEther(myVotePower)}`);

    // Vote for the second proposal
    const SECOND_PROPOSAL_ID = 1;
    const voteTxn = await tokenizedBallotContract.connect(account1).vote(SECOND_PROPOSAL_ID, MINT_VALUE);
    await voteTxn.wait();

    // Check the winning proposal, should be 2
    const winningProposal = await tokenizedBallotContract.winningProposal();
    console.log(`🚀 The winning proposal id is: ${winningProposal}.`);

    // Get the winner
    const winnerName = await tokenizedBallotContract.winnerName();
    console.log(`🚀 The winner name is: ${ethers.utils.parseBytes32String(winnerName)}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
