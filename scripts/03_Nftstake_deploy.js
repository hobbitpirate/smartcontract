// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const arg = require("../argument/nftstake");

async function main() {
    const Nftstake = await ethers.getContractFactory("HobbitPirateNFTStake");
    const nftstake = await Nftstake.deploy();

    await nftstake.deployed();
    console.log("HobbitPirateNFTStake deployed to:", nftstake.address);

    const Nftstakefactory = await ethers.getContractFactory("HobbitPirateNFTStakeFactory");
    const nftstakefactory = await Nftstakefactory.deploy(
        nftstake.address,
        arg[0],
        arg[1],
        arg[2]
    );

    await nftstakefactory.deployed();
    console.log("HobbitPirateNFTStakeFactory deployed to:", nftstakefactory.address);

    console.log("Waiting block confirm...");
    setTimeout(async () => {
        if(hre.network.config.chainId !== undefined){
            console.log("Verifying NFT Stake Contract");
            await hre.run("verify:verify", {
                address: nftstake.address,
                constructorArguments: [],
            });

            console.log("Verifying NFT Stake Factory Contract");
            await hre.run("verify:verify", {
                address: nftstakefactory.address,
                constructorArguments: [
                    nftstake.address,
                    arg[0],
                    arg[1],
                    arg[2]
                ],
            });
        }else{
            console.log("Skip because local deploy")
        }
    }, 5000);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
