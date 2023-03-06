// import { ethers } from "hardhat";
import { ethers } from "ethers";
import * as dotenv from 'dotenv';
import { TokenizedBallot__factory, MyToken__factory } from "../typechain-types";
dotenv.config();

const convertStringArrayToBytes32Array = (stringArray: string[]) => {
  return stringArray.map(prop => ethers.utils.formatBytes32String(prop));
}

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];
const proposals = convertStringArrayToBytes32Array(PROPOSALS);

async function main() {
    
  //----WALLET + CONTRACT SETUP
  const provider = new ethers.providers.AlchemyProvider("goerli", process.env.ALCHEMY_API_KEY);
  // const provider = new ethers.providers.InfuraProvider('goerli', process.env.INFURA_API_KEY);
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey || privateKey.length <= 0) {throw new Error("No private key")}
    const wallet = new ethers.Wallet(privateKey); // using our actual metamask wallet
    const signer = wallet.connect(provider);

    const deployer = await signer.getAddress();

    console.log('The wallet address is: ', wallet.address);
    console.log('The wallet balance is: ', (await provider.getBalance(wallet.address)).toString());


    //----DEPLOYMENT OF MY OWN CONTRACTS
    const myTokenContractFactory = new MyToken__factory(signer);

    const tokenContract_failed1 = await myTokenContractFactory.deploy({gasLimit: 5000000});
    // ^^^ "UNABLE TO ESTIMATE GAS"
    
    const tokenContract_failed2 = await myTokenContractFactory.deploy({gasLimit: 10000000}); 
    // ^^^ "INSUFFICIENT FUNDS" -- so perhaps the issue was not enough gETH (0.07)) 
    // ^^^ I tried to top up twice today but got a variety of different HTTP errors

    const txReceiptToken = await tokenContract_failed1.deployTransaction.wait();
    console.log('The token contract was deployed at address: ', tokenContract_failed1.address);
    console.log('The transaction hash is: ', txReceiptToken.transactionHash);
    
    // deploy Tokenized Ballot contract
    const tokenizedBallotContractFactory = new TokenizedBallot__factory(signer);
    const tokenizedBallotContract = await tokenizedBallotContractFactory.deploy(proposals, tokenContract_failed1.address);
    const txReceipt = await tokenizedBallotContract.deployTransaction.wait();
    console.log('The ballot contract was deployed at address: ', tokenizedBallotContract.address);
    console.log('The transaction hash is: ', txReceipt.transactionHash);

    
    //----DEPLOYMENT OF MY OWN CONTRACTS

    // SHARED FROM TEAM 6
    const BALLOTCONTRACT = '0x9a750a01629649975dc1f4e608ab203016f55180';
    const TOKENCONTRACT = '0xd7b7419e9fac3d687a206e0656ec7938049aa9e2'

    // get the contract instance
    const tokenContract = new MyToken__factory(signer).attach(TOKENCONTRACT);
    const ballotContract = new TokenizedBallot__factory(signer).attach(BALLOTCONTRACT);
    
    console.log('The token contract:', tokenContract);
    console.log('The ballot contract:', tokenizedBallotContract);

    // //----INTERACTING WITH THE CONTRACT

    // check my allocated votes
    let myVotes = await ballotContract.votingPower(deployer);
    let myBalance = await tokenContract.balanceOf(deployer);
    console.log('My balance is is: ', myBalance.toString());
    console.log('My voting power is: ', myVotes.toString());
    
    // // mint me some tokens
    const mintTx = await tokenContract.mint(deployer, 10);
    console.log('My tokens have been minted at: ', mintTx.hash);
    
    // // delegate my tokens to votingPower
    const delegateTx = await tokenContract.delegate(deployer);
    
    // // check my allocated votes
    myVotes = await ballotContract.votingPower(deployer);
    myBalance = await tokenContract.balanceOf(deployer);
    console.log('My balance is is: ', myBalance.toString());
    console.log('My voting power is: ', myVotes.toString());

    // // cast my vote
    const p1Votes = myVotes.div(2);
    const p3Votes = myVotes.div(2);
    const p1Tx = await ballotContract.vote(0, p1Votes);
    const p3Tx = await ballotContract.vote(2, p3Votes);
    await p1Tx.wait();
    await p3Tx.wait();
    console.log('My votes have been cast at: ', p1Tx.hash, p3Tx.hash);

    // // check my allocated votes
    myVotes = await ballotContract.votingPower(deployer);
    myBalance = await tokenContract.balanceOf(deployer);
    console.log('My balance is is: ', myBalance.toString());
    console.log('My voting power is: ', myVotes.toString());

    // // check the results
    const winning = await ballotContract.winningProposal();
    console.log('The winning proposal is: ', PROPOSALS[winning.toNumber()]);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});


/* 
Develop and run scripts for “TokenizedBallot.sol” within your group to give voting tokens,
-- delegating voting power, 
-- casting votes, 
-- checking vote power, and 
-- querying results <-- what does this mean? Pull the contract Events?
*/