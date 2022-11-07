require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.16",
    settings: {
      optimizer: {
        enabled: true,
        runs: 2000,
      },
    },
  },
  networks: {
    localhost: {
      url: "http://localhost:8545",
    },
    bsc: {
      url: "https://bsc-dataseed1.ninicoin.io/",
      chainId: 56,
      accounts: [
        process.env.PRIVATEKEY
      ]
    },
    bsc_testnet: {
      url: "https://bsc-testnet.public.blastapi.io",
      chainId: 97,
      accounts: [
        process.env.PRIVATEKEY
      ]
    }
  },
  etherscan: {
    apiKey: process.env.API, // bscscan.com
  },
  gasReporter: {
    gasPrice: 10,
    currency: "USD",
    enabled: (process.env.GAS_REPORT) ? true : false
  },
};
