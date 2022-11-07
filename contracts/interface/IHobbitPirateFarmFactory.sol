// SPDX-License-Identifier: none

pragma solidity ^0.8.0;

interface IHobbitPirateFarmFactory {
  struct penaltyUnstake {
    uint256 argFraction1;
    uint256 argFraction2;
  }

  function editPenalty(uint256 penaltyArg1,uint256 penaltyArg2) external;
  function createFarmPair(address depo, address reward) external;
  function getPenaltyData() external view returns(penaltyUnstake memory);
  function getTotalPair() external view returns(uint256);
  function getAllLpFarmPair() external view returns(address[] memory);
  function getAllLpStakePair() external view returns(address[] memory);
  function getAllTokenFarmPair() external view returns(address[] memory);
  function getAllTokenStakePair() external view returns(address[] memory);
  function getPair(address depo, address reward) external view returns(address);
  function owner() external view returns(address);
  function renounceOwnership() external;
  function transferOwnership(address newOwner) external;
  function wrapper() external view returns(address);
}