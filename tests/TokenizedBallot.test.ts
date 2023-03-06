import { expect } from "chai";
import { ethers } from "hardhat";
import { MyToken, TokenizedBallot } from "../typechain-types";

const convertStringArrayToBytes32Array = (stringArray: string[]) => {
  return stringArray.map(prop => ethers.utils.formatBytes32String(prop));
}

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];
const proposals = convertStringArrayToBytes32Array(PROPOSALS);

describe("NFT Shop", () => {
  let tokenContract: MyToken;
  let tokenizedBallot: TokenizedBallot;
    
  before(async () => {
    const myTokenContractFactory = await ethers.getContractFactory("MyToken");
    tokenContract = await myTokenContractFactory.deploy();
    console.log("Token contract deployed to:", tokenContract.address);
    const tokenizedBallotFactory = await ethers.getContractFactory("TokenizedBallot");
    tokenizedBallot = await tokenizedBallotFactory.deploy(
      proposals,
      tokenContract.address
      );
      console.log("TokenizedBallot contract deployed to:", tokenizedBallot.address);
  })
    
  describe("When the Shop contract is deployed", () => {
    it("deployer can mint themself tokens", async () => {
      const [deployer, user1, user2] = await ethers.getSigners();
      await tokenContract.mint(deployer.address, 10);
      expect(await tokenContract.balanceOf(deployer.address)).to.equal(10);
    });

    it("should revert if a user tries to mint tokens", async () => {
      const [deployer, user1, user2] = await ethers.getSigners();
      await expect(tokenContract.connect(user1).mint(user1.address, 10)).to.be.revertedWith("AccessControl: account 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 is missing role 0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6");
    });
    
    it("deployer can mint users tokens", async () => {
      const [deployer, user1, user2] = await ethers.getSigners();
      await tokenContract.mint(user1.address, 10);
      expect(await tokenContract.balanceOf(user1.address)).to.equal(10);
    });
    
    it("user1 can delegate their tokens to votingPower", async () => {
      const [deployer, user1, user2] = await ethers.getSigners();
      await tokenContract.connect(user1).delegate(user1.address);
      expect (await tokenizedBallot.votingPower(user1.address)).to.equal(10);
    });

    it("user1 can spend votingPower", async () => {
      const [deployer, user1, user2] = await ethers.getSigners();
      await tokenizedBallot.connect(user1).vote(0, 10);
      expect(await tokenContract.connect(user1).balanceOf(user1.address)).to.equal(0);
    });
  });
});