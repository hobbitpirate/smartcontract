const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
// const { ethers } = require("ethers");

const deployed = {
    token: null,
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

async function deployFarm() {
    const [owner, otherAccount, anotherAccount] = await ethers.getSigners();

    const Farm = await ethers.getContractFactory("HobbitPirateFarm");
    const farm = await Farm.deploy();

    const Farmfactory = await ethers.getContractFactory("HobbitPirateFarmFactory");
    const farmfactory = await Farmfactory.deploy(
        farm.address,
        deployed.wrapper,
        owner.address
    );

    return { farm, farmfactory, owner, otherAccount, anotherAccount };
}

beforeEach(async function() {
    if(deployed.token === null){
        const token = await deployTokenFirst();
        deployed.token = token.address; 
    }

    if(deployed.wrapper === null){
        const wrapper = await deployWrapperFirst();
        deployed.wrapper = wrapper.address;
    }
});

describe("HobbitPirateFarm & HobbitPirateFarmFactory", function() {
    describe("Deployment", function () {
        it("Should set the right implementation address", async function () {
            const { farmfactory, farm } = await loadFixture(deployFarm);
    
            expect(await farmfactory.implementation()).to.equal(farm.address);
        });
    
        it("Should set the right wrapper", async function () {
            const { farmfactory } = await loadFixture(deployFarm);
      
            expect(await farmfactory.wrapper()).to.equal(deployed.wrapper);
        });

        it("Should set the right owner", async function () {
            const { farmfactory, owner } = await loadFixture(deployFarm);
      
            expect(await farmfactory.owner()).to.equal(owner.address);
        });
    });
    describe("Action", function () {
        describe("Create Pair", function () {
            it("Should success created stake pair with token", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.token
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
            });
            it("Should success created farm pair with token and wrapper", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
            });
            it("Should error if create pair from not owner", async function () {
                const { farmfactory, otherAccount } = await loadFixture(deployFarm);
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                await expect(farmfactory.connect(otherAccount).createFarmPair(
                    false,
                    deployed.token,
                    deployed.token
                )).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                );
            });
        });
        describe("Create Reward Pool", function () {
            it("Should success created reward pool", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.token
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.not.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );
            });
            it("Should error if create pool from not owner", async function () {
                const { farmfactory, otherAccount } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.token
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.not.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                await expect(farmContract.connect(otherAccount).createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                    "HobbitPirateFarm : You are not owner!"
                );
            });
        });
        describe("Edit Equality Reward Pool", function () {
            it("Should success edit equality reward pool", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.not.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const equal = await farmContract.editEqualityValue(
                    ethers.utils.parseEther("0.01")
                );
                await equal.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0.01"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);
            });
            it("Should error if edit reward equality from not owner", async function () {
                const { farmfactory, otherAccount } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                await expect(farmContract.connect(otherAccount).editEqualityValue(
                    ethers.utils.parseEther("0.01")
                )).to.be.revertedWith(
                    "HobbitPirateFarm : You are not owner!"
                );
            });
            it("Should error if edit reward equality on stake pair", async function () {
                const { farmfactory, otherAccount } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.token
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.not.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                await expect(farmContract.editEqualityValue(
                    ethers.utils.parseEther("0.01")
                )).to.be.revertedWith(
                    "HobbitPirateFarm : Farm in Stake Mode!"
                );
            });
        });
        describe("Edit Reward Pool", function () {
            it("Should success Edit reward pool", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.token
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.not.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmContract.poolOptionByIndex(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                ]);

                const txeditpool = await farmContract.editPool(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("2"),
                    ethers.BigNumber.from("1")
                );
                await txeditpool.wait();

                expect(await farmContract.poolOptionByIndex(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("2"),
                    ethers.BigNumber.from("1")
                ]);
            });
            it("Should error if edit pool from not owner", async function () {
                const { farmfactory, otherAccount } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.token
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.not.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                await expect(farmContract.connect(otherAccount).editPool(
                    ethers.BigNumber.from("0"),
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                    "HobbitPirateFarm : You are not owner!"
                );
            });
            it("Should error if edit pool on non exist pool", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.token
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.not.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmContract.poolOptionByIndex(
                    ethers.BigNumber.from("0")
                )).to.deep.equal([
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                ]);

                await expect(farmContract.editPool(
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("2"),
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                    "HobbitPirateFarm : This pool is not available!"
                );
            });
        });
        describe("Add Reward Pool", function () {
            it("Should success Add reward pool (Wrapper)", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);
            });
            it("Should success Add reward pool (Token)", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.token
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("1")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1")
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);
            });
            it("Should error if create pool from not owner", async function () {
                const { farmfactory, otherAccount } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.token
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.not.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                await expect(farmContract.connect(otherAccount).addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                )).to.be.revertedWith(
                    "HobbitPirateFarm : You are not owner!"
                );
            });
        });
        describe("Take Reward Pool", function () {
            it("Should success Take reward pool (Wrapper)", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                const txtakepool = await farmContract.removeReward(
                    ethers.utils.parseEther("1")
                );
                await txtakepool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);
            });
            it("Should success Take reward pool (Token)", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.token
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("1")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1")
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                const txtakepool = await farmContract.removeReward(
                    ethers.utils.parseEther("1")
                );
                await txtakepool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);
            });
            it("Should error if take reward pool from not owner", async function () {
                const { farmfactory, otherAccount } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.token
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.token
                )).to.not.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                await expect(farmContract.connect(otherAccount).removeReward(
                    ethers.utils.parseEther("1")
                )).to.be.revertedWith(
                    "HobbitPirateFarm : You are not owner!"
                );
            });
            it("Should error if take reward pool more than available", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                await expect(farmContract.removeReward(
                    ethers.utils.parseEther("10")
                )).to.be.revertedWith(
                    "HobbitPirateFarm : Pool reward has beed exceed!"
                );
            });
        });
        describe("User Stake / Farm In", function () {
            it("Should success user stake in / farm in", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const reward = await farmContract.rewardCalculator(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                const txstake = await farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                await txstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);
            });
            it("Should error if user stake / farm in with insufficient allowance or value", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                await expect(farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                )).to.be.revertedWith(
                    "HobbitPirateFarm : Insufficient allocation for this transaction!"
                );
            });
            it("Should error if user stake in / farm in with insufficient reward pool", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                await expect(farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("10000000")
                )).to.be.revertedWith(
                    "HobbitPirateFarm : Insufficient reward!"
                );
            });
            it("Should error if user already stake in / farm in", async function () {
                const { farmfactory } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const reward = await farmContract.rewardCalculator(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                const txstake = await farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                await txstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);

                await expect(farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                )).to.be.revertedWith(
                    "HobbitPirateFarm : You already have actived farm!"
                );
            });
        });
        describe("User Stop Stake / Farm", function () {
            it("Should success user stop stake / farm", async function () {
                const { farmfactory, owner } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const reward = await farmContract.rewardCalculator(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                const txstake = await farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                await txstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);

                const txstopstake = await farmContract.userWantStopfarm();
                await txstopstake.wait();

                const reward1 = await farmContract.userClaimableReward(
                    owner.address
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward1
                ]);
            });
            it("Should error if user stop stake / farm if already ended", async function () {
                const { farmfactory, owner } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const reward = await farmContract.rewardCalculator(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                const txstake = await farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                await txstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);

                await time.increase(4800);

                await expect(farmContract.userWantStopfarm()).to.be.revertedWith(
                    "HobbitPirateFarm : This action is not needed again!"
                );
            });
            it("Should error if user stop stake / farm before stake in", async function () {
                const { farmfactory, owner } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                await expect(farmContract.userWantStopfarm()).to.be.revertedWith(
                    "HobbitPirateFarm : You do not have active farm yet!"
                );
            });
            it("Should error if user stop stake / farm already stop", async function () {
                const { farmfactory, owner } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const reward = await farmContract.rewardCalculator(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                const txstake = await farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                await txstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);

                const txstopstake = await farmContract.userWantStopfarm();
                await txstopstake.wait();

                const reward1 = await farmContract.userClaimableReward(
                    owner.address
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward1
                ]);

                await expect(farmContract.userWantStopfarm()).to.be.revertedWith(
                    "HobbitPirateFarm : This action is not needed again!"
                );
            });
        });
        describe("User Claim Stake / Farm", function () {
            it("Should success user claim stake / farm (Still Running)", async function () {
                const { farmfactory, owner } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const reward = await farmContract.rewardCalculator(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                const txstake = await farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                await txstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);

                const txclaimstake = await farmContract.userWantClaim();
                await txclaimstake.wait();

                expect(await farmContract.poolInfo()).to.deep.not.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);
            });
            it("Should success user claim stake / farm (After ended)", async function () {
                const { farmfactory, owner } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const reward = await farmContract.rewardCalculator(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                const txstake = await farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                await txstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);

                await time.increase(4800);

                const txclaimstake = await farmContract.userWantClaim();
                await txclaimstake.wait();

                expect(await farmContract.poolInfo()).to.deep.not.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);
            });
            it("Should success user claim stake / farm (After stop)", async function () {
                const { farmfactory, owner } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const reward = await farmContract.rewardCalculator(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                const txstake = await farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                await txstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);

                const txstopstake = await farmContract.userWantStopfarm();
                await txstopstake.wait();

                const reward1 = await farmContract.userClaimableReward(
                    owner.address
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward1
                ]);

                const txclaimstake = await farmContract.userWantClaim();
                await txclaimstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1").sub(reward1),
                    ethers.BigNumber.from("0")
                ]);
            });
            it("Should error if user claim stake / farm before stake in", async function () {
                const { farmfactory, owner } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                await expect(farmContract.userWantClaim()).to.be.revertedWith(
                    "HobbitPirateFarm : You do not have active farm yet!"
                );
            });
            it("Should error if user claim stake / farm on insufficient reward", async function () {
                const { farmfactory, owner } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const reward = await farmContract.rewardCalculator(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                const txstake = await farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                await txstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);

                const txstopstake = await farmContract.userWantStopfarm();
                await txstopstake.wait();

                const reward1 = await farmContract.userClaimableReward(
                    owner.address
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward1
                ]);

                const txclaimstake = await farmContract.userWantClaim();
                await txclaimstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1").sub(reward1),
                    ethers.BigNumber.from("0")
                ]);

                await expect(farmContract.userWantClaim()).to.be.revertedWith(
                    "HobbitPirateFarm : You do not have any reward!"
                );
            });
        });
        describe("User Stake / Farm out", function () {
            it("Should success user stake out / farm out (After stop)", async function () {
                const { farmfactory, owner } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const reward = await farmContract.rewardCalculator(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                const txstake = await farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                await txstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);

                const txstopstake = await farmContract.userWantStopfarm();
                await txstopstake.wait();

                const reward1 = await farmContract.userClaimableReward(
                    owner.address
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward1
                ]);

                const txclaimstake = await farmContract.userWantClaim();
                await txclaimstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1").sub(reward1),
                    ethers.BigNumber.from("0")
                ]);

                const txstakeout = await farmContract.userWantfarmOut();
                await txstakeout.wait();
            });
            it("Should success user stake out / farm out (After ended)", async function () {
                const { farmfactory, owner } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const reward = await farmContract.rewardCalculator(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                const txstake = await farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                await txstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);

                const reward1 = await farmContract.userClaimableReward(
                    owner.address
                );

                await time.increase(4800);

                const txclaimstake = await farmContract.userWantClaim();
                await txclaimstake.wait();

                expect(await farmContract.poolInfo()).to.deep.not.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);

                const txstakeout = await farmContract.userWantfarmOut();
                await txstakeout.wait();
            });
            it("Should error if user stake out / farm out before stake in", async function () {
                const { farmfactory, owner } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                await expect(farmContract.userWantfarmOut()).to.be.revertedWith(
                    "HobbitPirateFarm : You do not have active farm yet!"
                );
            });
            it("Should error if user stake out / farm out before claim all reward", async function () {
                const { farmfactory, owner } = await loadFixture(deployFarm);
                const Farm = await ethers.getContractFactory("HobbitPirateFarm");
                const Token = await ethers.getContractFactory("HobbitPirateToken");

                const tokenContract = await Token.attach(
                    deployed.token
                );
        
                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.equal(
                    ethers.constants.AddressZero
                );

                const tx = await farmfactory.createFarmPair(
                    false,
                    deployed.token,
                    deployed.wrapper
                );
                await tx.wait();

                expect(await farmfactory.getTotalPair()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const getPairAddress = await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                );
                const farmContract = Farm.attach(
                    getPairAddress
                );

                const txapprov = await tokenContract.approve(
                    getPairAddress,
                    ethers.utils.parseEther("10000")
                );
                await txapprov.wait();

                expect(getPairAddress).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmfactory.FarmPair(
                    deployed.token,
                    deployed.wrapper
                )).to.not.equal(
                    ethers.constants.AddressZero
                );
                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0"),
                    ethers.utils.parseEther("0")
                ]);

                const txaddpool = await farmContract.addReward(
                    ethers.utils.parseEther("1"), { value: ethers.utils.parseEther("1") }
                );
                await txaddpool.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("0")
                ]);

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txcreatepool = await farmContract.createPool(
                    ethers.BigNumber.from("3600"),
                    ethers.BigNumber.from("1"),
                    ethers.BigNumber.from("1")
                );
                await txcreatepool.wait();

                expect(await farmContract.totalPool()).to.equal(
                    ethers.BigNumber.from("1")
                );

                const reward = await farmContract.rewardCalculator(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                const txstake = await farmContract.userWantfarmIn(
                    ethers.BigNumber.from("0"),
                    ethers.utils.parseEther("2")
                );
                await txstake.wait();

                expect(await farmContract.poolInfo()).to.deep.equal([
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    ethers.utils.parseEther("1"),
                    reward
                ]);

                await time.increase(4800);

                await expect(farmContract.userWantfarmOut()).to.be.revertedWith(
                    "HobbitPirateFarm : Claim all reward before farm out!"
                );
            });
        });
    });
});