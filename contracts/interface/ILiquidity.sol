// SPDX-License-Identifier: none

pragma solidity ^0.8.0;

interface ILiquidity {
    //usage to checking liquidity is have token0 and token1 (Fork uniswap like Pancake, Biswap, etc with similar function)

    function token0() external view returns (address);
    function token1() external view returns (address);
}