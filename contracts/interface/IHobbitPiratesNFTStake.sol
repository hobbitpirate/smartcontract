// SPDX-License-Identifier: none

pragma solidity ^0.8.0;

interface IHobbitPiratesNFTStake{
    struct userDetail{
        uint256 activedStakePool;
        uint256 nftIdsStaked;
        uint256 stakeOutTime;
        uint256 claimOutTime;
        uint256 allocatedReward;
    }

    struct poolDetail{
        uint256[] rewardAmount;
        uint256 duration;
    }

    struct poolRewards{
        uint256 totalRewardPool;
        uint256 allocatedRewardPool;
    }

    function _initialize(address nftStake,address rewardStake,address wrap) external;
    function createPool(uint256[] memory memoryrewardList,uint256 durationStake) external;
    function factory() external view returns(address);
    function nft() external view returns(address);
    function onERC721Received(address,address,uint256,bytes memory) external returns(bytes4);
    function poolInfo(uint256 poolId) external view returns(poolDetail memory);
    function poolRewardInfo(uint256 poolId) external view returns(uint256,uint256,uint256);
    function refillRewardPool(uint256 poolId,uint256 amountReward) external payable;
    function reward() external view returns(address);
    function takeRewardPool(uint256 poolId,uint256 amountReward) external;
    function totalCreatedPools() external view returns(uint256);
    function userClaimOutNFT() external;
    function userInfo(address user) external view returns(userDetail memory);
    function userStakeInNFT(uint256 selectedPools,uint256 selectedNftIds) external;
    function userStakeOutNFT() external;
    function wrapper() external view returns(address);
}