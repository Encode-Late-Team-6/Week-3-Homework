import { ethers } from "hardhat";
import { expect } from "chai";
import { MyToken, TokenizedBallot, MyToken__factory, TokenizedBallot__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const PROPOSALS = ['A', 'B', 'C'];
const MINT_VALUE = ethers.utils.parseEther('10');

describe('Unit tests for Tokenized Ballot', () => {
    let deployer : SignerWithAddress;
    let account1 : SignerWithAddress;
    let myTokenContract : MyToken;
    let tokenizedBallotContract : TokenizedBallot;

    const SECOND_PROPOSAL_ID = 1;

    // Initialization of the contracts and factories happen only once
    // So, no need for beforeEach function

    it('Should initialize the contracts', async () => {
        const signers = await ethers.getSigners();
        deployer = signers[0];
        account1 = signers[1];

        const myTokenFactory = new MyToken__factory(deployer);
        myTokenContract = await myTokenFactory.deploy();
        await myTokenContract.deployTransaction.wait();

        const tokenizedBallotFactory = new TokenizedBallot__factory(deployer);
        tokenizedBallotContract = await tokenizedBallotFactory.deploy(PROPOSALS.map((prop) => {
            return ethers.utils.formatBytes32String(prop);
        }), myTokenContract.address, 0)
        await tokenizedBallotContract.deployTransaction.wait();

        expect(myTokenContract.address).to.not.be.undefined;
        expect(tokenizedBallotContract.address).to.not.be.undefined;
    });

    it('Should give voting power to account1', async () => {
        const mintTx = await myTokenContract.mint(account1.address, MINT_VALUE);
        await mintTx.wait();

        const delegateTxn = await myTokenContract.connect(account1).delegate(account1.address);
        await delegateTxn.wait();

        const setTargetBlockTxn = await tokenizedBallotContract.setTargetBlockNumber(4);
        await setTargetBlockTxn.wait();

        const account1VotePower = await tokenizedBallotContract.votingPower(account1.address);
        console.log(`🚀 The account1 has ${ethers.utils.formatEther(account1VotePower)} vote power`);
        expect(account1VotePower).to.eq(MINT_VALUE);
    });

    it('Should give a vote to Proposal 2', async () => {
        const voteTxn = await tokenizedBallotContract
            .connect(account1)
            .vote(SECOND_PROPOSAL_ID, MINT_VALUE.div(2));
        await voteTxn.wait();

        const proposal2VoteCount = await tokenizedBallotContract
            .connect(account1)
            .proposals(SECOND_PROPOSAL_ID);

        console.log(`🚀 The proposal 2 has ${ethers.utils.formatEther(proposal2VoteCount.voteCount)} votes`);
        expect(proposal2VoteCount.voteCount).to.eq(MINT_VALUE.div(2));
    });

    it('Should point Proposal2 as a winning proposal', async () => { 
        const winningProposalId = await tokenizedBallotContract.winningProposal();
        console.log(`🚀 The winning proposal is ${winningProposalId}`);
        expect(winningProposalId).to.eq(1);
    });
});
