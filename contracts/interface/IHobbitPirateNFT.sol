// SPDX-License-Identifier: none

pragma solidity ^0.8.0;

interface IHobbitPirateNFT{
    struct nftInfo{
        uint256 gen;
        rariryLevel rarity;
    }

    enum rariryLevel{
        common,
        rare,
        legend
    }

    function approve(address to,uint256 tokenId) external;
    function balanceOf(address owner) external view returns(uint256);
    function burn(uint256 tokenId) external;
    function buyNft() external;
    function getApproved(uint256 tokenId) external view returns(address);
    function isApprovedForAll(address owner,address operator) external view returns(bool);
    function lastExistId() external view returns(uint256);
    function maxSupply() external view returns(uint256);
    function name() external view returns(string memory);
    function owner() external view returns(address);
    function ownerOf(uint256 tokenId) external view returns(address);
    function rarityInfo(uint256 tokenId) external view returns(nftInfo memory);
    function renounceOwnership() external;
    function resetSale(uint256 price_,uint256 saleSupply_,address payment_,address oracle_) external;
    function safeTransferFrom(address from,address to,uint256 tokenId) external;
    function safeTransferFrom(address from,address to,uint256 tokenId,bytes memory _data) external;
    function salesInfo() external view returns(uint256,uint256,address);
    function setApprovalForAll(address operator,bool approved) external;
    function supportsInterface(bytes4 interfaceId) external view returns(bool);
    function symbol() external view returns(string memory);
    function tokenURI(uint256 tokenId) external view returns(string memory);
    function totalSupply() external view returns(uint256);
    function transferFrom(address from,address to,uint256 tokenId) external;
    function transferOwnership(address newOwner) external;
}