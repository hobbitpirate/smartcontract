const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
// const { ethers } = require("ethers");

const deployed = {
    token: null,
    oracle: null
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

async function deployNftOracleFirst() {
    const Oracle = await ethers.getContractFactory("nftOracle");
    const oracle = await Oracle.deploy(
        [38,49,42,46,33,23],
        [2,2,1,1,1,1]
    );

    return oracle;
}

async function deployNft() {
    const [owner, otherAccount, anotherAccount] = await ethers.getSigners();

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

    return { nft, owner, otherAccount, anotherAccount };
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
});

describe("HobbitPirate", function() {
    describe("Deployment", function () {
        it("Should set the right NFT name", async function () {
            const { nft } = await loadFixture(deployNft);
    
            expect(await nft.name()).to.equal("Hobbit Pirate Collectible");
        });
    
        it("Should set the right NFT symbol", async function () {
            const { nft } = await loadFixture(deployNft);
      
            expect(await nft.symbol()).to.equal("HPC");
        });

        it("Should set the right owner", async function () {
            const { nft, owner } = await loadFixture(deployNft);
      
            expect(await nft.owner()).to.equal(owner.address);
        });

        it("Should set the right max supply", async function () {
            const { nft } = await loadFixture(deployNft);
      
            expect(await nft.maxSupply()).to.equal(
                ethers.BigNumber.from("50")
            );
        });

        it("Should set the right sales info", async function () {
            const { nft } = await loadFixture(deployNft);
            const expected = [
                ethers.BigNumber.from("1"),
                ethers.utils.parseEther("1"),
                ethers.utils.getAddress(
                    deployed.token
                )
            ];
      
            expect(await nft.salesInfo()).to.deep.equal(expected);
        });
    });
    describe("Action", function () {
        describe("Buy NFT", function () {
            it("Should success buy 1 NFT", async function () {
                const { nft, owner } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );
            });
            it("Should success buy 10 NFT", async function () {
                const { nft, owner } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("10")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("10")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                for(let a = 0; a < 10; a++){
                    const txBuy = await nft.buyNft();
                    await txBuy.wait();
                }
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("10")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("10")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("10")
                );
            });
            it("Should error if buy with insufficient allowance", async function () {
                const { nft } = await loadFixture(deployNft);
        
                await expect(nft.buyNft()).to.be.revertedWith(
                  "BEP20: insufficient allowance"
                );
            });
            it("Should error if buy until exceed max supply", async function () {
                const { nft, owner } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("100")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("100")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.maxSupply()).to.equal(
                    ethers.BigNumber.from("50")
                );

                for(let a = 0; a < 50; a++){
                    const txBuy = await nft.buyNft();
                    await txBuy.wait();
                }

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("50")
                );
                expect(await nft.maxSupply()).to.equal(
                    ethers.BigNumber.from("50")
                );
        
                await expect(nft.buyNft()).to.be.revertedWith(
                  "HobbitPirate: Max supply reached!"
                );
            });
        });
        describe("Reset Sell NFT", function () {
            it("Should success reset sell", async function () {
                const { nft, owner } = await loadFixture(deployNft);
                const oracle = await deployNftOracleFirst();

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("50")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("50")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                for(let a = 0; a < 50; a++){
                    const txBuy = await nft.buyNft();
                    await txBuy.wait();
                }
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("50")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("50")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("50")
                );
                expect(await nft.maxSupply()).to.equal(
                    ethers.BigNumber.from("50")
                );

                const tx1 = await nft.resetSale(
                    ethers.utils.parseEther("1"),
                    ethers.BigNumber.from("50"),
                    deployed.token,
                    oracle.address
                );
                await tx1.wait();

                expect(await nft.maxSupply()).to.equal(
                    ethers.BigNumber.from("100")
                );
            });
            it("Should error if reset sell before sold out", async function () {
                const { nft } = await loadFixture(deployNft);
                const oracle = await deployNftOracleFirst();

                await expect(nft.resetSale(
                    ethers.utils.parseEther("1"),
                    ethers.BigNumber.from("50"),
                    deployed.token,
                    oracle.address
                )).to.be.revertedWith(
                    "HobbitPirate: Reset supply available after reach max supply"
                );
            });
            it("Should error if reset sell from non owner", async function () {
                const { nft, otherAccount } = await loadFixture(deployNft);
                const oracle = await deployNftOracleFirst();

                await expect(nft.connect(otherAccount).resetSale(
                    ethers.utils.parseEther("1"),
                    ethers.BigNumber.from("50"),
                    deployed.token,
                    oracle.address
                )).to.be.revertedWith(
                    "Ownable: caller is not the owner"
                );
            });
            it("Should error if reset sell with same oracle", async function () {
                const { nft, owner } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("50")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("50")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                for(let a = 0; a < 50; a++){
                    const txBuy = await nft.buyNft();
                    await txBuy.wait();
                }
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("50")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("50")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("50")
                );
                expect(await nft.maxSupply()).to.equal(
                    ethers.BigNumber.from("50")
                );

                await expect(nft.resetSale(
                    ethers.utils.parseEther("1"),
                    ethers.BigNumber.from("50"),
                    deployed.token,
                    deployed.oracle
                )).to.be.revertedWith(
                    "HobbitPirate: Please provide new nftOracle address"
                );
            });
        });
        describe("Approve NFT", function () {
            it("Should success approve nft id 1 to other account", async function () {
                const { nft, owner, otherAccount } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );
        
                const txApprove = await nft.approve(
                    otherAccount.address,
                    ethers.BigNumber.from("1")
                );
                await txApprove.wait();

                expect(await nft.getApproved(
                    ethers.BigNumber.from("1")
                )).to.equal(
                    otherAccount.address
                );
            });
            it("Should success setApprovalForAll to other account", async function () {
                const { nft, owner, otherAccount } = await loadFixture(deployNft);
        
                const tx = await nft.setApprovalForAll(
                    otherAccount.address,
                    true
                );
                await tx.wait();

                expect(await nft.isApprovedForAll(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    true
                );
            });
            it("Should success approve nft id 1 to another account from other account after setApprovalForAll from real owner", async function () {
                const { nft, owner, otherAccount, anotherAccount } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );

                const txSetAll = await nft.setApprovalForAll(
                    otherAccount.address,
                    true
                );
                await txSetAll.wait();

                expect(await nft.isApprovedForAll(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    true
                );
        
                const txApprove = await nft.connect(otherAccount).approve(
                    anotherAccount.address,
                    ethers.BigNumber.from("1")
                );
                await txApprove.wait();

                expect(await nft.getApproved(
                    ethers.BigNumber.from("1")
                )).to.equal(
                    anotherAccount.address
                );
            });
            it("Should error if approve non exist NFT", async function () {
                const { nft, owner } = await loadFixture(deployNft);
        
                await expect(nft.approve(
                    owner.address,
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                  "HobbitPirate: owner query for nonexistent token"
                );
            });
            it("Should error if approve nft id 1 to self", async function () {
                const { nft, owner } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );
        
                await expect(nft.approve(
                    owner.address,
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                  "HobbitPirate: approval to current owner"
                );
            });
            it("Should error if approve nft id 1 from other user before setApprovalForAll from real owner", async function () {
                const { nft, owner, otherAccount } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );
        
                await expect(nft.connect(otherAccount).approve(
                    otherAccount.address,
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                  "HobbitPirate: approve caller is not owner nor approved for all"
                );
            });
            it("Should error if setApprovalForAll to self", async function () {
                const { nft, owner } = await loadFixture(deployNft);
        
                await expect(nft.setApprovalForAll(
                    owner.address,
                    true
                )).to.be.revertedWith(
                  "HobbitPirate: approve to caller"
                );
            });
        });
        describe("Burn NFT", function () {
            it("Should success burn 1 NFT", async function () {
                const { nft, owner } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );

                const txBurn = await nft.burn(
                    ethers.BigNumber.from("1")
                );
                await txBurn.wait();

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );
            });
            it("Should success burn 1 NFT from other account after setApprovalForAll", async function () {
                const { nft, owner, otherAccount } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );

                const txSetAll = await nft.setApprovalForAll(
                    otherAccount.address,
                    true
                );
                await txSetAll.wait();

                expect(await nft.isApprovedForAll(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    true
                );

                const txBurn = await nft.connect(otherAccount).burn(
                    ethers.BigNumber.from("1")
                );
                await txBurn.wait();

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );
            });
            it("Should success burn 1 NFT from another account after setApprovalForAll for other account and other account set approve to another account", async function () {
                const { nft, owner, otherAccount, anotherAccount } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );

                const txSetAll = await nft.setApprovalForAll(
                    otherAccount.address,
                    true
                );
                await txSetAll.wait();

                expect(await nft.isApprovedForAll(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    true
                );

                const txApprove = await nft.connect(otherAccount).approve(
                    anotherAccount.address,
                    ethers.BigNumber.from("1")
                );
                await txApprove.wait();

                expect(await nft.getApproved(
                    ethers.BigNumber.from("1")
                )).to.equal(
                    anotherAccount.address
                );

                const txBurn = await nft.connect(anotherAccount).burn(
                    ethers.BigNumber.from("1")
                );
                await txBurn.wait();

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );
            });
            it("Should error if burn for non exist nft id", async function () {
                const { nft } = await loadFixture(deployNft);
        
                await expect(nft.burn(
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                  "HobbitPirate: operator query for nonexistent token"
                );
            });
            it("Should error if burn for not owner or not approved", async function () {
                const { nft, owner, otherAccount } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );

                await expect(nft.connect(otherAccount).burn(
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                    "HobbitPirate: caller is not owner nor approved"
                );
            });
        });
        describe("Transfer NFT", function () {
            it("Should success tranfer 1 NFT", async function () {
                const { nft, owner, otherAccount } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    otherAccount.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txTf = await nft.transferFrom(
                    owner.address,
                    otherAccount.address,
                    ethers.BigNumber.from("1")
                );
                await txTf.wait();

                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    otherAccount.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );
            });
            it("Should success tranfer 1 NFT from owner to another account by calling from other account", async function () {
                const { nft, owner, otherAccount, anotherAccount } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    otherAccount.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txApprove = await nft.setApprovalForAll(
                    otherAccount.address,
                    true
                );
                await txApprove.wait();

                expect(await nft.isApprovedForAll(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    true
                );

                const txTf = await nft.connect(otherAccount).transferFrom(
                    owner.address,
                    anotherAccount.address,
                    ethers.BigNumber.from("1")
                );
                await txTf.wait();

                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    anotherAccount.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );
            });
            it("Should error if transfer for non exist nft id", async function () {
                const { nft, owner, otherAccount } = await loadFixture(deployNft);
        
                await expect(nft.transferFrom(
                    owner.address,
                    otherAccount.address,
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                  "HobbitPirate: operator query for nonexistent token"
                );
            });
            it("Should error if transfer for not owner or not approved", async function () {
                const { nft, owner, otherAccount } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );

                await expect(nft.connect(otherAccount).transferFrom(
                    owner.address,
                    otherAccount.address,
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                    "HobbitPirate: transfer caller is not owner nor approved"
                );
            });
            it("Should error if transfer to zero address", async function () {
                const { nft, owner } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );

                await expect(nft.transferFrom(
                    owner.address,
                    ethers.constants.AddressZero,
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                    "HobbitPirate: transfer to the zero address"
                );
            });
            it("Should error if transfer with incorrect from", async function () {
                const { nft, owner, otherAccount, anotherAccount } = await loadFixture(deployNft);

                const Token = await ethers.getContractFactory("HobbitPirateToken");
                const token = Token.attach(
                    deployed.token
                );

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    nft.address,
                    ethers.utils.parseEther("1")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    nft.address
                )).to.equal(
                    ethers.utils.parseEther("1")
                );

                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("0")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("0")
                );

                const txBuy = await nft.buyNft();
                await txBuy.wait();
        
                expect(await nft.totalSupply()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.lastExistId()).to.equal(
                    ethers.BigNumber.from("1")
                );
                expect(await nft.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.BigNumber.from("1")
                );

                await expect(nft.transferFrom(
                    otherAccount.address,
                    anotherAccount.address,
                    ethers.BigNumber.from("1")
                )).to.be.revertedWith(
                    "HobbitPirate: transfer from incorrect owner"
                );
            });
        });
    });
});