// SPDX-License-Identifier: none

pragma solidity ^0.8.0;

interface IHobbitPirateFarm{
    struct farmPoolOption{
        uint256 longTime;
        uint256 apyPercent;
        uint256 apyDiver;
    }

    struct farmPool{
        uint256 equal1;
        uint256 equal2;
        uint256 rewardSupply;
        uint256 rewardLocked;
    }

    struct userDetail{
        bool isActive;
        uint256 selectedPool;
        uint256 deposited;
        uint256 farmStart;
        uint256 farmEnd;
        uint256 farmLastClaim;
        uint256 allocated;
        uint256 rewardPerSecond;
    }

    function _initialize(address depo,address income,address wrap) external;
    function addReward(uint256 amountPool) external payable;
    function createPool(uint256 duration,uint256 apyFraction1,uint256 apyFraction2) external;
    function deposit() external view returns(address);
    function editEqualityValue(uint256 newReward) external;
    function editPool(uint256 poolId,uint256 duration,uint256 apyFraction1,uint256 apyFraction2) external;
    function factory() external view returns(address);
    function poolInfo() external view returns(uint256 equal1,uint256 equal2,uint256 rewardSupply,uint256 rewardLocked);
    function poolOptionByIndex(uint256 index) external view returns(farmPoolOption memory);
    function removeReward(uint256 amountPool) external;
    function reward() external view returns(address);
    function rewardCalculator(uint256 amountfarm,uint256 selectedPool) external view returns(uint256);
    function totalPool() external view returns(uint256);
    function userClaimableReward(address user) external view returns(uint256);
    function userDataInfo(address user) external view returns(userDetail memory);
    function userWantClaim() external;
    function userWantStopfarm() external;
    function userWantfarmIn(uint256 amountfarm,uint256 selectedPool) external payable;
    function userWantfarmOut() external;
    function wrapper() external view returns(address);
}