const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
// const { ethers } = require("ethers");

async function deployToken() {
    const [owner, otherAccount] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("HobbitPirateToken");
    const token = await Token.deploy(
        ethers.utils.parseEther("100000000000"),
        owner.address,
        "Hobbit Pirate Token",
        "HPT"
    );

    return { token, owner, otherAccount };
}

describe("HobbitPirateToken", function() {
    describe("Deployment", function () {
        it("Should set the right token name", async function () {
            const { token } = await loadFixture(deployToken);
    
            expect(await token.name()).to.equal("Hobbit Pirate Token");
        });
    
        it("Should set the right token symbol", async function () {
            const { token } = await loadFixture(deployToken);
      
            expect(await token.symbol()).to.equal("HPT");
        });

        it("Should set the right token decimals", async function () {
            const { token } = await loadFixture(deployToken);
    
            expect(await token.decimals()).to.equal(
                ethers.BigNumber.from("18")
            );
        });
    
        it("Should set the right token total supply", async function () {
            const { token } = await loadFixture(deployToken);
      
            expect(await token.totalSupply()).to.equal(
                ethers.utils.parseEther("100000000000")
            );
        });
    });

    describe("Action", function () {
        describe("Transfer", function () {
            it("Should success if transfer 1000 token", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.utils.parseEther("100000000000")
                );

                const tx = await token.transfer(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx.wait();

                expect(await token.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.utils.parseEther("99999999000")
                );
                expect(await token.balanceOf(
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );
            });

            it("Should error if send more than balance", async function () {
                const { token, otherAccount} = await loadFixture(deployToken);
        
                await expect(token.transfer(
                    otherAccount.address,
                    ethers.utils.parseEther("1000000000000")
                )).to.be.revertedWith(
                  "BEP20: transfer amount exceeds balance"
                );
            });

            it("Should error if send to zero address", async function () {
                const { token} = await loadFixture(deployToken);
        
                await expect(token.transfer(
                    ethers.constants.AddressZero,
                    ethers.utils.parseEther("100000000")
                )).to.be.revertedWith(
                  "BEP20: transfer to the zero address"
                );
            });
        });
        describe("Burn", function () {
            it("Should success if burn 1000 token", async function () {
                const { token, owner } = await loadFixture(deployToken);
        
                expect(await token.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.utils.parseEther("100000000000")
                );

                const tx = await token.burn(
                    ethers.utils.parseEther("1000")
                );
                await tx.wait();

                expect(await token.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.utils.parseEther("99999999000")
                );
            });

            it("Should error if burn more than balance", async function () {
                const { token} = await loadFixture(deployToken);
        
                await expect(token.burn(
                    ethers.utils.parseEther("1000000000000")
                )).to.be.revertedWith(
                  "BEP20: burn amount exceeds balance"
                );
            });
        });
        describe("Approval", function () {
            it("Should success if approve 1000 token", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );
            });

            it("Should success if approve 1000 token and increase 1000 approval token", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );

                const tx2 = await token.increaseAllowance(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx2.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("2000")
                );
            });

            it("Should success if approve 1000 token and decrease 100 approval token", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );

                const tx2 = await token.decreaseAllowance(
                    otherAccount.address,
                    ethers.utils.parseEther("100")
                );
                await tx2.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("900")
                );
            });

            it("Should error if approve to zero address", async function () {
                const { token } = await loadFixture(deployToken);
        
                await expect(token.transfer(
                    ethers.constants.AddressZero,
                    ethers.utils.parseEther("100000000")
                )).to.be.revertedWith(
                  "BEP20: transfer to the zero address"
                );
            });

            it("Should error if decrease approve to below zero", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const tx = await token.approve(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );

                await expect(token.decreaseAllowance(
                    otherAccount.address,
                    ethers.utils.parseEther("100000000")
                )).to.be.revertedWith(
                  "BEP20: decreased allowance below zero"
                );
            });
        });
        describe("TransferFrom", function () {
            it("Should success if transferFrom 1000 token", async function () {
                const { token, owner, otherAccount } = await loadFixture(deployToken);
        
                expect(await token.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.utils.parseEther("100000000000")
                );

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const txa = await token.approve(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await txa.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );

                const tx = await token.connect(otherAccount).transferFrom(
                    owner.address,
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await tx.wait();

                expect(await token.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.utils.parseEther("99999999000")
                );
                expect(await token.balanceOf(
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );
                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );
            });

            it("Should error if send more than allowance balance", async function () {
                const { token, owner, otherAccount} = await loadFixture(deployToken);
        
                expect(await token.balanceOf(
                    owner.address
                )).to.equal(
                    ethers.utils.parseEther("100000000000")
                );

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("0")
                );

                const txa = await token.approve(
                    otherAccount.address,
                    ethers.utils.parseEther("1000")
                );
                await txa.wait();

                expect(await token.allowance(
                    owner.address,
                    otherAccount.address
                )).to.equal(
                    ethers.utils.parseEther("1000")
                );

                await expect(token.connect(otherAccount).transferFrom(
                    owner.address,
                    otherAccount.address,
                    ethers.utils.parseEther("10000")
                )).to.be.revertedWith(
                  "BEP20: insufficient allowance"
                );
            });
        });
    });
});