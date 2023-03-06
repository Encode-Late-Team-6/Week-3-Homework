import { ethers } from "hardhat";
import { BigNumber } from "ethers";
import { MyToken, TokenizedBallot, MyToken__factory, TokenizedBallot__factory } from "../typechain-types";

const MINT_VALUE = ethers.utils.parseEther('10');
const PROPOSALS = ['Proposal 1', 'Proposal 2', 'Proposal 3'];

async function main() {
    // Deploy the contract
    const [deployer, account1] = await ethers.getSigners();
    const bytes32Proposals = PROPOSALS.map((prop) => ethers.utils.formatBytes32String(prop));
    let myVotePower : BigNumber;

    const myTokenFactory = new MyToken__factory(deployer);
    const myTokenContract: MyToken = await myTokenFactory.deploy();
    await myTokenContract.deployTransaction.wait();

    const tokenizedBallotFactory = new TokenizedBallot__factory(deployer);
    const tokenizedBallotContract: TokenizedBallot = await tokenizedBallotFactory.deploy(bytes32Proposals, myTokenContract.address, 0);
    await tokenizedBallotContract.deployTransaction.wait();

    // Mint some tokens to account1
    const mintTxn = await myTokenContract.mint(account1.address, MINT_VALUE);
    await mintTxn.wait();

    const myTokenCoins = await myTokenContract.balanceOf(account1.address);
    console.log(`🚀 The account1 address: ${account1.address}`);
    console.log(`🚀 The account1 token coins: ${ethers.utils.formatEther(myTokenCoins)}`);
    
    // Check the voting power through get Votes
    myVotePower = await myTokenContract.connect(account1).getVotes(account1.address);
    console.log(`🚀 The account1 has vote power before delegation: ${ethers.utils.formatEther(myVotePower)}`);

    // Delegate the account1 tokens to itself to get the voting power
    const delegateTxn = await myTokenContract.connect(account1).delegate(account1.address);
    await delegateTxn.wait();

    // Set the target block number to the latest (Block 4)
    const setTargetBlock = await tokenizedBallotContract.setTargetBlockNumber(4); // to pass correct block into getPastVotes inside the contract
    await setTargetBlock.wait();

    // Check the voting power, it should has MINT_VALUE
    myVotePower = await tokenizedBallotContract.connect(account1).votingPower(account1.address); // it accesses the getPastVotes function
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
