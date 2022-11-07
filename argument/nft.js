const { ethers } = require('ethers');

module.exports = [
    ethers.utils.parseEther("1"), // price buy mysterybox
    ethers.BigNumber.from("50"), // max supply
    "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512", // token address
    "0x060DFF81f955e8B3359dD51E291FBE83f66a4854", // nft owner
    "Hobbit Pirate Collectible", // token name
    "HPC", // token symbol,
    "https://metadata-testt.herokuapp.com/" // metadata,must return object if add only number behind url,
    // ex https://metadata-testt.herokuapp.com/1
]