// SPDX-License-Identifier: none

pragma solidity ^0.8.0;

interface IWrapper{
    function totalSupply() external view returns (uint);
    
    function balanceOf(
        address account
    ) external view returns (uint256);
    
    function allowance(
        address owner,
        address spender
    ) external view returns (uint256);
    
    function deposit() external payable;
    
    function withdraw(
        uint256 amount
    ) external;

    function approve(
        address spender,
        uint256 amount
    ) external;
    
    function transfer(
        address destination,
        uint256 amount
    ) external;
    
    function transferFrom(
        address owner,
        address destination,
        uint256 amount
    ) external;
}