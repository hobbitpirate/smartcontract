// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const arg = require("../argument/farm");

async function main() {
    const Farm = await ethers.getContractFactory("HobbitPirateFarm");
    const farm = await Farm.deploy();

    await farm.deployed();
    console.log("HobbitPirateFarm deployed to:", farm.address);

    const Farmfactory = await ethers.getContractFactory("HobbitPirateFarmFactory");
    const farmfactory = await Farmfactory.deploy(
        farm.address,
        arg[0],
        arg[1]
    );

    await farmfactory.deployed();
    console.log("HobbitPirateFarmFactory deployed to:", farmfactory.address);

    console.log("Waiting block confirm...");
    setTimeout(async () => {
        if(hre.network.config.chainId !== undefined){
            console.log("Verifying Farm Contract");
            await hre.run("verify:verify", {
                address: farm.address,
                constructorArguments: [],
            });

            console.log("Verifying Farm Factory Contract");
            await hre.run("verify:verify", {
                address: farmfactory.address,
                constructorArguments: [
                    farm.address,
                    arg[0],
                    arg[1]
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
