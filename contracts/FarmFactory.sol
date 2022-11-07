// SPDX-License-Identifier: None

import "./abstract/Ownable.sol";
import "./interface/IHobbitPirateFarm.sol";
import "./library/addressChecker.sol";
import "./library/Clones.sol";
import "./library/Counters.sol";
import "./library/ReentrancyGuard.sol";

pragma solidity ^0.8.0;

contract HobbitPirateFarmFactory is Ownable, ReentrancyGuard{
    using addressChecker for address;
    using Counters for Counters.Counter;

    Counters.Counter private deployed;
    
    address immutable public wrapper;
    address immutable public implementation;

    penaltyUnstake private _penaltyData;

    address[] public tokenStake;
    address[] public lpStake;
    address[] public tokenFarm;
    address[] public lpFarm;

    struct penaltyUnstake {
        uint256 argFraction1;
        uint256 argFraction2;
    }

    mapping (address => mapping(address => address)) public FarmPair;

    event createdFarmPair(
        address indexed pair,
        address indexed token0,
        address indexed token1
    );

    constructor(
        address implement,
        address wrap,
        address owner
    ){
        require(
            wrap.isBEP20(),
            "HobbitPirateFarmFactory : This address is not a BEP20 token"
        );
        
        wrapper = wrap;
        implementation = implement;

        transferOwnership(owner);
    }

    function getPenaltyData() public view returns(penaltyUnstake memory){
        return _penaltyData;
    }

    function getTotalPair() public view returns(uint256){
        return deployed.current();
    }

    function getTotalStakePair() public view returns(uint256){
        return tokenStake.length;
    }

    function getTotalFarmPair() public view returns(uint256){
        return tokenFarm.length;
    }

    function getTotalLpStakePair() public view returns(uint256){
        return lpStake.length;
    }

    function getTotalLpFarmPair() public view returns(uint256){
        return lpFarm.length;
    }

    function editPenalty(
        uint256 penaltyArg1,
        uint256 penaltyArg2
    ) external virtual onlyOwner nonReentrant{
        _penaltyData = penaltyUnstake(
            penaltyArg1,
            penaltyArg2
        );
    }

    function createFarmPair(
        bool isLp,
        address depo,
        address reward
    ) external virtual onlyOwner nonReentrant{
        if(isLp == true){
            require(
                depo.isLiquidity() || reward.isLiquidity(),
                "HobbitPirateIFO : This address is not a liquidity token"
            );
        }
        require(
            depo.isBEP20() && reward.isBEP20(),
            "HobbitPirateIFO : This address is not a BEP20 token"
        );
        require(
            FarmPair[depo][reward] == address(0),
            "HobbitPirateIFO : This pair already deployed"
        );

        bytes32 salt = keccak256(abi.encodePacked(depo, reward));
        address newContract = Clones.cloneDeterministic(
            implementation,
            salt
        );
        IHobbitPirateFarm(newContract)._initialize(
            depo,
            reward, 
            wrapper
        );

        FarmPair[depo][reward] = newContract;

        if(depo == reward){
            if(isLp == true){
                lpStake.push(newContract);
            }else{
                tokenStake.push(newContract);
            }
        }else{
            if(isLp == true){
                lpFarm.push(newContract);
            }else{
                tokenFarm.push(newContract);
            }
        }
        deployed.increment();

        emit createdFarmPair(
            newContract,
            depo,
            reward
        );
    }
}