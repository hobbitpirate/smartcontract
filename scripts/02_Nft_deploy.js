// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const oracleArg = require("../argument/oraclenft");
const nftArg = require("../argument/nft");

async function main() {
  const Oracle = await hre.ethers.getContractFactory("nftOracle");
  const oracle = await Oracle.deploy(
    oracleArg[0],
    oracleArg[1]
  );

  await oracle.deployed();
  console.log("NFT Oracle deployed to:", oracle.address);

  const Nft = await hre.ethers.getContractFactory("HobbitPirate");
  const nft = await Nft.deploy(
    nftArg[0],
    nftArg[1],
    nftArg[2],
    oracle.address,
    nftArg[3],
    nftArg[4],
    nftArg[5],
    nftArg[6]
  );
  
  await nft.deployed();
  console.log("NFT deployed to:", nft.address);

  console.log("Waiting block confirm...");
  setTimeout(async () => {
    if(hre.network.config.chainId !== undefined){
      console.log("Verifying NFT Contract");
      await hre.run("verify:verify", {
        address: nft.address,
        constructorArguments: [
          nftArg[0],
          nftArg[1],
          nftArg[2],
          oracle.address,
          nftArg[3],
          nftArg[4],
          nftArg[5],
          nftArg[6]
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
