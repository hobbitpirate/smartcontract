const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
// const { ethers } = require("ethers");

const deployed = {
    token: null,
    oracle: null,
    nft: null,
    wrapper: null
}

async function deployTokenFirst() {
    const [owner] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("HobbitPirateToken");
    const token = await Token.deploy(
        ethers.utils.parseEther("100000000000"),
        owner.address,
        "Hobbit Pirate Token",
        "HPT"
    );

    return token;
}

async function deployWrapperFirst() {
    const Token = await ethers.getContractFactory("HobbitPirateWrapper");
    const token = await Token.deploy(
        "Hobbit Pirate Wrapper",
        "HPW"
    );

    return token;
}

async function deployNftOracleFirst() {
    const Oracle = await ethers.getContractFactory("nftOracle");
    const oracle = await Oracle.deploy(
        [38,49,42,46,33,23],
        [2,2,1,1,1,1]
    );

    return oracle;
}

async function deployNftFirst() {
    const [owner] = await ethers.getSigners();

    const Nft = await ethers.getContractFactory("HobbitPirate");
    const nft = await Nft.deploy(
        ethers.utils.parseEther("1"),
        ethers.BigNumber.from("50"),
        deployed.token,
        deployed.oracle,
        owner.address,
        "Hobbit Pirate Collectible",
        "HPC",
        "https://metadata-testt.herokuapp.com/"
    );

    return nft;
}

async function deployNftStake() {
    const [owner, otherAccount, anotherAccount] = await ethers.getSigners();

    const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
    const nftstake = await Nftstake.deploy();

    const Nftstakefactory = await ethers.getContractFactory("HobbitPirateNFTStakeFactory");
    const nftstakefactory = await Nftstakefactory.deploy(
        nftstake.address,
        deployed.nft,
        deployed.wrapper,
        owner.address
    );

    return { nftstake, nftstakefactory, owner, otherAccount, anotherAccount };
}

beforeEach(async function() {
    if(deployed.token === null){
        const token = await deployTokenFirst();
        deployed.token = token.address; 
    }

    if(deployed.oracle === null){
        const oracle = await deployNftOracleFirst();
        deployed.oracle = oracle.address;
    }

    if(deployed.nft === null){
        const nft = await deployNftFirst();
        deployed.nft = nft.address;
    }

    if(deployed.wrapper === null){
        const wrapper = await deployWrapperFirst();
        deployed.wrapper = wrapper.address;
    }
});

describe("HobbitPirateNFTStake & HobbitPirateNFTStakeFactory", function() {
    describe("Deployment", function () {
        it("Should set the right implementation address", async function () {
            const { nftstakefactory, nftstake } = await loadFixture(deployNftStake);
    
            expect(await nftstakefactory.implementation()).to.equal(nftstake.address);
        });
    
        it("Should set the right wrapper", async function () {
            const { nftstakefactory } = await loadFixture(deployNftStake);
      
            expect(await nftstakefactory.wrapper()).to.equal(deployed.wrapper);
        });

        it("Should set the right owner", async function () {
            const { nftstakefactory, owner } = await loadFixture(deployNftStake);
      
            expect(await nftstakefactory.owner()).to.equal(owner.address);
        });
    });
    describe("Action", function () {
        describe("Create Pair", function () {
            it("Should success created pair nft with wrapper", async function () {
                const { nftstakefactory } = await loadFixture(deployNftStake);
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.wrapper
                );
                await tx.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nftstakefactory.getPair(
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
            });
            it("Should success created pair nft with token", async function () {
                const { nftstakefactory } = await loadFixture(deployNftStake);
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
            });
            it("Should error if create pair from not owner", async function () {
                const { nftstakefactory, otherAccount } = await loadFixture(deployNftStake);
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                await expect(nftstakefactory.connect(otherAccount).createStakePair(
                    deployed.token
                )).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                );
            });
        });
        describe("Create Reward Pool", function () {
            it("Should success created reward pool", async function () {
                const { nftstakefactory } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
            });
            it("Should error if create reward pool from not owner", async function () {
                const { nftstakefactory, otherAccount } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                await expect(pairContract.connect(otherAccount).createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                )).to.be.revertedWith(
                    "HobbitPirateNFTStake : Only owner allowed!"
                );
            });
        });
        describe("Add Reward Pool", function () {
            it("Should success Add reward pool", async function () {
                const { nftstakefactory } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const tx2 = await pairContract.refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);
            });
            it("Should error if Add reward pool from not owner", async function () {
                const { nftstakefactory, otherAccount } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                await expect(pairContract.connect(otherAccount).refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                )).to.be.revertedWith(
                    "HobbitPirateNFTStake : Only owner allowed!"
                );
            });
            it("Should error if Add reward pool to non exist pool", async function () {
                const { nftstakefactory, otherAccount } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                await expect(pairContract.refillRewardPool(
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1000")
                )).to.be.revertedWith(
                    "HobbitPirateNFTStake : inputted pool is not exist"
                );
            });
        });
        describe("Remove Reward Pool", function () {
            it("Should success Remove reward pool", async function () {
                const { nftstakefactory } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const tx2 = await pairContract.refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                const tx3 = await pairContract.takeRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("200")
                );
                await tx3.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("800"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("800")
                ]);
            });
            it("Should error if Remove reward pool from not owner", async function () {
                const { nftstakefactory, otherAccount } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                await expect(pairContract.connect(otherAccount).takeRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("200")
                )).to.be.revertedWith(
                    "HobbitPirateNFTStake : Only owner allowed!"
                );
            });
            it("Should error if Remove reward pool to non exist pool", async function () {
                const { nftstakefactory, otherAccount } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                await expect(pairContract.takeRewardPool(
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1000")
                )).to.be.revertedWith(
                    "HobbitPirateNFTStake : inputted pool is not exist"
                );
            });
        });
        describe("User Stake In", function () {
            it("Should success user stake in", async function () {
                const { nftstakefactory, owner } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const Nft = await ethers.getContractFactory("HobbitPirate");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();
                const approvenft = await tokenContract.approve(
                    deployed.nft,
                    ethers.utils.parseEther("1000")
                );
                await approvenft.wait();

                const nftContract = Nft.attach(
                    deployed.nft
                );

                const txBuy = await nftContract.buyNft();
                await txBuy.wait();

                const nftapprove = await nftContract.setApprovalForAll(
                    pairAddress,
                    true
                );
                await nftapprove.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const tx2 = await pairContract.refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                expect(await pairContract.userInfo(
                    owner.address
                )).to.deep.equal([
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("0")
                ]);

                const stakein = await pairContract.userStakeInNFT(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("1")
                );
                await stakein.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("999")
                ]);
            });
            it("Should error if user stake in with insufficient reward pool", async function () {
                const { nftstakefactory, owner } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const Nft = await ethers.getContractFactory("HobbitPirate");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();
                const approvenft = await tokenContract.approve(
                    deployed.nft,
                    ethers.utils.parseEther("1000")
                );
                await approvenft.wait();

                const nftContract = Nft.attach(
                    deployed.nft
                );

                const txBuy = await nftContract.buyNft();
                await txBuy.wait();

                const nftapprove = await nftContract.setApprovalForAll(
                    pairAddress,
                    true
                );
                await nftapprove.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await pairContract.userInfo(
                    owner.address
                )).to.deep.equal([
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("0")
                ]);

                await expect(pairContract.userStakeInNFT(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                    "HobbitPirateNFTStake : insufficient reward pool!"
                );
            });
            it("Should error if stake in to non exist pool", async function () {
                const { nftstakefactory } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Nft = await ethers.getContractFactory("HobbitPirate");
                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();
                const txapprove = await token.approve(
                    deployed.nft,
                    ethers.utils.parseEther("1")
                );
                await txapprove.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );
                const nftContract = Nft.attach(
                    deployed.nft
                );

                const txBuy = await nftContract.buyNft();
                await txBuy.wait();

                await expect(pairContract.userStakeInNFT(
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1")
                )).to.be.revertedWith(
                    "HobbitPirateNFTStake : This pool not available!"
                );
            });
            it("Should error if user stake in without approve nft", async function () {
                const { nftstakefactory, owner } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const Nft = await ethers.getContractFactory("HobbitPirate");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();
                const approvenft = await tokenContract.approve(
                    deployed.nft,
                    ethers.utils.parseEther("1000")
                );
                await approvenft.wait();

                const nftContract = Nft.attach(
                    deployed.nft
                );

                const txBuy = await nftContract.buyNft();
                await txBuy.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const tx2 = await pairContract.refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                expect(await pairContract.userInfo(
                    owner.address
                )).to.deep.equal([
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("0")
                ]);

                await expect(pairContract.userStakeInNFT(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                    "HobbitPirateNFTStake : Please grant 'isApprovedForAll' access to this address!"
                );
            });
            it("Should error if user stake in from operator", async function () {
                const { nftstakefactory, owner, otherAccount } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const Nft = await ethers.getContractFactory("HobbitPirate");

                const nftContract = Nft.attach(
                    deployed.nft
                );

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const nftapprove = await nftContract.setApprovalForAll(
                    otherAccount.address,
                    true
                );
                await nftapprove.wait();
                const nftapprove1 = await nftContract.connect(otherAccount).setApprovalForAll(
                    pairAddress,
                    true
                );
                await nftapprove1.wait();

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();
                const approvenft = await tokenContract.approve(
                    deployed.nft,
                    ethers.utils.parseEther("1000")
                );
                await approvenft.wait();

                const txBuy = await nftContract.buyNft();
                await txBuy.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const tx2 = await pairContract.refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                expect(await pairContract.userInfo(
                    owner.address
                )).to.deep.equal([
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("0")
                ]);

                await expect(pairContract.connect(otherAccount).userStakeInNFT(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                    "HobbitPirateNFTStake : This NFT assets is not yours!"
                );
            });
            it("Should error if user 2 nft stake in same pair", async function () {
                const { nftstakefactory, owner } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const Nft = await ethers.getContractFactory("HobbitPirate");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();
                const approvenft = await tokenContract.approve(
                    deployed.nft,
                    ethers.utils.parseEther("1000")
                );
                await approvenft.wait();

                const nftContract = Nft.attach(
                    deployed.nft
                );

                const txBuy = await nftContract.buyNft();
                await txBuy.wait();
                const txBuy1 = await nftContract.buyNft();
                await txBuy1.wait();

                const nftapprove = await nftContract.setApprovalForAll(
                    pairAddress,
                    true
                );
                await nftapprove.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const tx2 = await pairContract.refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                expect(await pairContract.userInfo(
                    owner.address
                )).to.deep.equal([
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("0")
                ]);

                const stakein = await pairContract.userStakeInNFT(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("1")
                );
                await stakein.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("999")
                ]);

                await expect(pairContract.userStakeInNFT(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("2")
                )).to.be.revertedWith(
                    "HobbitPirateNFTStake : You still active at other staking pools!"
                );
            });
        });
        describe("User Stake Out", function () {
            it("Should success user stake out before timeout", async function () {
                const { nftstakefactory, owner } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const Nft = await ethers.getContractFactory("HobbitPirate");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();
                const approvenft = await tokenContract.approve(
                    deployed.nft,
                    ethers.utils.parseEther("1000")
                );
                await approvenft.wait();

                const nftContract = Nft.attach(
                    deployed.nft
                );

                const txBuy = await nftContract.buyNft();
                await txBuy.wait();

                const nftapprove = await nftContract.setApprovalForAll(
                    pairAddress,
                    true
                );
                await nftapprove.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const tx2 = await pairContract.refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                expect(await pairContract.userInfo(
                    owner.address
                )).to.deep.equal([
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("0")
                ]);

                const stakein = await pairContract.userStakeInNFT(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("1")
                );
                await stakein.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("999")
                ]);

                const stakeout = await pairContract.userStakeOutNFT();
                await stakeout.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);
            });
            it("Should success user stake out after timeout", async function () {
                const { nftstakefactory, owner } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const Nft = await ethers.getContractFactory("HobbitPirate");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();
                const approvenft = await tokenContract.approve(
                    deployed.nft,
                    ethers.utils.parseEther("1000")
                );
                await approvenft.wait();

                const nftContract = Nft.attach(
                    deployed.nft
                );

                const txBuy = await nftContract.buyNft();
                await txBuy.wait();

                const nftapprove = await nftContract.setApprovalForAll(
                    pairAddress,
                    true
                );
                await nftapprove.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const tx2 = await pairContract.refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                expect(await pairContract.userInfo(
                    owner.address
                )).to.deep.equal([
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("0")
                ]);

                const stakein = await pairContract.userStakeInNFT(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("1")
                );
                await stakein.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("999")
                ]);

                await time.increase(4800);

                const stakeout = await pairContract.userStakeOutNFT();
                await stakeout.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("999")
                ]);
            });
            it("Should error if user stake out more than once", async function () {
                const { nftstakefactory, owner } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const Nft = await ethers.getContractFactory("HobbitPirate");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();
                const approvenft = await tokenContract.approve(
                    deployed.nft,
                    ethers.utils.parseEther("1000")
                );
                await approvenft.wait();

                const nftContract = Nft.attach(
                    deployed.nft
                );

                const txBuy = await nftContract.buyNft();
                await txBuy.wait();

                const nftapprove = await nftContract.setApprovalForAll(
                    pairAddress,
                    true
                );
                await nftapprove.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const tx2 = await pairContract.refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                expect(await pairContract.userInfo(
                    owner.address
                )).to.deep.equal([
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("0")
                ]);

                const stakein = await pairContract.userStakeInNFT(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("1")
                );
                await stakein.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("999")
                ]);

                const stakeout = await pairContract.userStakeOutNFT();
                await stakeout.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                await expect(pairContract.userStakeOutNFT()).to.be.revertedWith(
                    "HobbitPirateNFTStake : Not Meet Condition for do this action!"
                );
            });
            it("Should error if user stake out before do anything", async function () {
                const { nftstakefactory } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                await expect(pairContract.userStakeOutNFT()).to.be.revertedWith(
                    "HobbitPirateNFTStake : Not Meet Condition for do this action!"
                );
            });
        });
        describe("User Claim Out", function () {
            it("Should success user claim out (staked out before timeout)", async function () {
                const { nftstakefactory, owner } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const Nft = await ethers.getContractFactory("HobbitPirate");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();
                const approvenft = await tokenContract.approve(
                    deployed.nft,
                    ethers.utils.parseEther("1000")
                );
                await approvenft.wait();

                const nftContract = Nft.attach(
                    deployed.nft
                );

                const txBuy = await nftContract.buyNft();
                await txBuy.wait();

                const nftapprove = await nftContract.setApprovalForAll(
                    pairAddress,
                    true
                );
                await nftapprove.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const tx2 = await pairContract.refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                expect(await pairContract.userInfo(
                    owner.address
                )).to.deep.equal([
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("0")
                ]);

                const stakein = await pairContract.userStakeInNFT(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("1")
                );
                await stakein.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("999")
                ]);

                const stakeout = await pairContract.userStakeOutNFT();
                await stakeout.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                await time.increase(86500);

                const claimout = await pairContract.userClaimOutNFT();
                await claimout.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);
            });
            it("Should success user claim out (staked out after timeout)", async function () {
                const { nftstakefactory, owner } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const Nft = await ethers.getContractFactory("HobbitPirate");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();
                const approvenft = await tokenContract.approve(
                    deployed.nft,
                    ethers.utils.parseEther("1000")
                );
                await approvenft.wait();

                const nftContract = Nft.attach(
                    deployed.nft
                );

                const txBuy = await nftContract.buyNft();
                await txBuy.wait();

                const nftapprove = await nftContract.setApprovalForAll(
                    pairAddress,
                    true
                );
                await nftapprove.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const tx2 = await pairContract.refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                expect(await pairContract.userInfo(
                    owner.address
                )).to.deep.equal([
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("0")
                ]);

                const stakein = await pairContract.userStakeInNFT(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("1")
                );
                await stakein.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("999")
                ]);

                await time.increase(4800);

                const stakeout = await pairContract.userStakeOutNFT();
                await stakeout.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("999")
                ]);

                await time.increase(86500);

                const claimout = await pairContract.userClaimOutNFT();
                await claimout.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("999"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("999")
                ]);
            });
            it("Should error if user claim out before claimout timeout", async function () {
                const { nftstakefactory, owner } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const Nft = await ethers.getContractFactory("HobbitPirate");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();
                const approvenft = await tokenContract.approve(
                    deployed.nft,
                    ethers.utils.parseEther("1000")
                );
                await approvenft.wait();

                const nftContract = Nft.attach(
                    deployed.nft
                );

                const txBuy = await nftContract.buyNft();
                await txBuy.wait();

                const nftapprove = await nftContract.setApprovalForAll(
                    pairAddress,
                    true
                );
                await nftapprove.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const tx2 = await pairContract.refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                expect(await pairContract.userInfo(
                    owner.address
                )).to.deep.equal([
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("0")
                ]);

                const stakein = await pairContract.userStakeInNFT(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("1")
                );
                await stakein.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("999")
                ]);

                const stakeout = await pairContract.userStakeOutNFT();
                await stakeout.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                await expect(pairContract.userClaimOutNFT()).to.be.revertedWith(
                    "HobbitPirateNFTStake : Not Meet Condition for do this action!"
                );
            });
            it("Should error if user claim out more than once", async function () {
                const { nftstakefactory, owner } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const Nft = await ethers.getContractFactory("HobbitPirate");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                const approve = await tokenContract.approve(
                    pairAddress,
                    ethers.utils.parseEther("1000")
                );
                await approve.wait();
                const approvenft = await tokenContract.approve(
                    deployed.nft,
                    ethers.utils.parseEther("1000")
                );
                await approvenft.wait();

                const nftContract = Nft.attach(
                    deployed.nft
                );

                const txBuy = await nftContract.buyNft();
                await txBuy.wait();

                const nftapprove = await nftContract.setApprovalForAll(
                    pairAddress,
                    true
                );
                await nftapprove.wait();

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(pairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const tx1 = await pairContract.createPool(
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                );
                await tx1.wait();

                expect(await pairContract.totalCreatedPools()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await pairContract.poolInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    [
                        ethers.utils.parseEther("1"),
                        ethers.utils.parseEther("7"),
                        ethers.utils.parseEther("10")
                    ],
                    3600
                ]);
                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const tx2 = await pairContract.refillRewardPool(
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                expect(await pairContract.userInfo(
                    owner.address
                )).to.deep.equal([
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("0")
                ]);

                const stakein = await pairContract.userStakeInNFT(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("1")
                );
                await stakein.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("999")
                ]);

                const stakeout = await pairContract.userStakeOutNFT();
                await stakeout.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                await time.increase(86500);

                const claimout = await pairContract.userClaimOutNFT();
                await claimout.wait();

                expect(await pairContract.poolRewardInfo(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.utils.parseEther("1000"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("1000")
                ]);

                await expect(pairContract.userClaimOutNFT()).to.be.revertedWith(
                    "HobbitPirateNFTStake : Not Meet Condition for do this action!"
                );
            });
            it("Should error if user claim out before do anything", async function () {
                const { nftstakefactory } = await loadFixture(deployNftStake);
                const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nftstakefactory.getPair(
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await nftstakefactory.createStakePair(
                    deployed.token
                );
                await tx.wait();

                const pairAddress = await nftstakefactory.getPair(
                    deployed.token
                );
                const pairContract = Nftstake.attach(
                    pairAddress
                );

                expect(await nftstakefactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                await expect(pairContract.userClaimOutNFT()).to.be.revertedWith(
                    "HobbitPirateNFTStake : Not Meet Condition for do this action!"
                );
            });
        });
    });
});