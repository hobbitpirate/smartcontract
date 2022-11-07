// SPDX-License-Identifier: none

pragma solidity ^0.8.0;

import "../interface/IBEP20.sol";
import "../interface/ILiquidity.sol";
import "../interface/IERC721Metadata.sol";

import "./ERC165Checker.sol";

library addressChecker{
    using ERC165Checker for address;

    function isBEP20(
        address target
    ) internal view returns(bool) {
        return _tryIsBEP20(target);
    }

    function isLiquidity(
        address target
    ) internal view returns(bool) {
        return _tryIsLiquidity(target);
    }

    function isERC721(
        address target
    ) internal view returns(bool) {
        bytes4 erc721interface = type(IERC721Metadata).interfaceId;
        
        return target.supportsInterface(erc721interface);
    }

    function _tryIsBEP20(
        address target
    ) private view returns(bool) {
        try IBEP20(target).decimals() returns(uint8 decimals) {
            return decimals > 0;
        }catch{
            return false;
        }
    }

    function _tryIsLiquidity(
        address target
    ) private view returns(bool) {
        address tempToken0;
        address tempToken1;

        try ILiquidity(target).token0() returns(address token0) {
            tempToken0 = token0;
        }catch{
            return false;
        }

        try ILiquidity(target).token1() returns(address token1) {
            tempToken1 = token1;
        }catch{
            return false;
        }

        return (tempToken0 != address(0) && tempToken1 != address(0));
    }
}