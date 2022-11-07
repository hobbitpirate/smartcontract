// SPDX-License-Identifier: None

pragma solidity ^0.8.0;

interface INFTStakeFactory {
  function createStakePair(address nftStake, address rewardStake) external;
  function getPair(address nftStake, address rewardStake) external view returns(address);
  function owner() external view returns(address);
  function renounceOwnership() external;
  function transferOwnership(address newOwner) external;
  function wrapper() external view returns(address);
}