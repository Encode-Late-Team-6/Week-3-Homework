import { ethers } from "ethers";
import * as dotenv from 'dotenv';
import { MyToken__factory, TokenizedBallot__factory} from "../typechain-types";
dotenv.config();

const MINT_VALUE = ethers.utils.parseEther("10");

async function main() {

    const ballotContarctAdd = "0xD7B7419e9FaC3D687a206e0656Ec7938049aA9e2"
    //const tokenContarctadd = "0xE7ad2a56486d5dF9BC3df688957740A7CeF71C52"
    const tokenContarctadd = "0x9A750A01629649975DC1F4e608aB203016F55180"
    const provider = new ethers.providers.InfuraProvider(
        "goerli",
        process.env.INFURA_API_KEY);
    const privateKey = process.env.PRIVATE_KEY;
    
    if(!privateKey || privateKey.length<=0)
        throw new Error("Private Key Not Found");

    const wallet = new ethers.Wallet(privateKey);
    const signer = wallet.connect(provider);

    //Minting tokens


    const tokenContractFactory = new MyToken__factory(signer);
    const tokenContract = tokenContractFactory.attach(tokenContarctadd);

    let tokenBal = await tokenContract.balanceOf(signer.address);
    console.log(
        `Number of tokens at the address before minting ${ethers.utils.formatEther(tokenBal)}`
        );

    const mintTx = await tokenContract.connect(signer).mint(signer.address,MINT_VALUE);
    const mintTxreceipt = await mintTx.wait()

    console.log(
        `Tokens were successfully minted to the address ${signer.address} at block number ${mintTxreceipt.blockNumber}`
    );

    //Delegating to self

    let votepower = await tokenContract.getVotes(signer.address);
    console.log(
        `The vote power of the account is ${votepower}` 
    )

    const delegatetx = await tokenContract.connect(signer).delegate(signer.address);

    const delegatetxreceipt = await delegatetx.wait();
    console.log(`The tokens were delegated by account to self in block number ${delegatetxreceipt.blockNumber}`);
    
    votepower = await tokenContract.getVotes(signer.address);
    console.log(
        `The vote power of account after self deledating ${ethers.utils.formatEther(votepower)}` 
    );

    //BallotContrct

    const ballotContractFactory = new TokenizedBallot__factory(signer);
    const ballotContract = ballotContractFactory.attach(ballotContarctAdd);

    //Set targetBlock

    const targetblock = delegatetxreceipt.blockNumber+1;

    const targetBlocktx = await ballotContract.connect(signer).setTargetBlockNumber(targetblock);

    console.log(`Successfully set target block to ${targetblock}`)


    
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });