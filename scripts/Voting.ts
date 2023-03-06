import { ethers } from "ethers";
import * as dotenv from 'dotenv';
import { MyToken__factory,TokenizedBallot__factory  } from "../typechain-types";
dotenv.config();


async function main() {

    //Voting
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

    const ballotContractFactory = new TokenizedBallot__factory(signer);
    const ballotContract = ballotContractFactory.attach(ballotContarctAdd);

    const targetblock = await ballotContract.targetBlockNumber()

    const tokenContractFactory = new MyToken__factory(signer);
    const tokenContract = tokenContractFactory.attach(tokenContarctadd);
    
    let votepower = await tokenContract.getPastVotes(signer.address,targetblock);
    console.log(
        `The vote power of the account is ${ethers.utils.formatEther(votepower)}` 
    )
    const gasLimit =200000;
    const voteTx = await ballotContract.connect(signer).vote(1,votepower,{gasLimit});
    const voteTxreceipt = await voteTx.wait();

    console.log(`Successfully voted at blocknumber  ${voteTxreceipt.blockNumber}`);


    //Results


    const winner = await ballotContract.winnerName();

    console.log(`Winner of voting ${ethers.utils.parseBytes32String(winner)}`)
    
}


main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });


