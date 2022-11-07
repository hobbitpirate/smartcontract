// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const arg = require("../argument/token");

async function main() {
  const tokenArg = {
    totalSupply: hre.ethers.utils.parseEther(
      arg[0]
    ),
    manager: arg[3],
    name: arg[1],
    symbol: arg[2]
  };

  const Token = await hre.ethers.getContractFactory("HobbitPirateToken");
  const token = await Token.deploy(
    tokenArg.totalSupply,
    tokenArg.manager,
    tokenArg.name,
    tokenArg.symbol
  );

  await token.deployed();
  console.log("HobbitPirateToken deployed to:", token.address);

  console.log("Waiting block confirm...");
  setTimeout(async () => {
    if(hre.network.config.chainId !== undefined){
      console.log("Verifying Token Contract");
      await hre.run("verify:verify", {
        address: token.address,
        constructorArguments: [
          tokenArg.totalSupply,
          tokenArg.manager,
          tokenArg.name,
          tokenArg.symbol
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
