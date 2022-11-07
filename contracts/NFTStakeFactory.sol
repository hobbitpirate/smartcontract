// SPDX-License-Identifier: None

import "./abstract/Ownable.sol";
import "./library/addressChecker.sol";
import "./library/Clones.sol";
import "./library/Counters.sol";
import "./library/ReentrancyGuard.sol";
import "./interface/IHobbitPiratesNFTStake.sol";

pragma solidity ^0.8.0;

contract HobbitPirateNFTStakeFactory is Ownable, ReentrancyGuard{
    using Counters for Counters.Counter;
    using addressChecker for address;

    Counters.Counter private deployed;
    
    address immutable public hobbitNft;
    address immutable public wrapper;
    address immutable public implementation;
    address[] public pairAddress;

    mapping (address => mapping(address => address)) private NFTStakePair;

    event createdStakePair(
        address indexed pair,
        address indexed nft,
        address indexed reward
    );

    constructor(
        address implement,
        address nft,
        address wrap,
        address owner
    ){
        require(
            wrap.isBEP20(),
            "HobbitPirateIFO : This address is not a BEP20 token"
        );
        
        hobbitNft = nft;
        wrapper = wrap;
        implementation = implement;

        transferOwnership(owner);
    }

    function getTotalPair() public view returns(uint256){
        return deployed.current();
    }

    function getPair(
        address rewardStake
    ) public view returns(address){
        return NFTStakePair[hobbitNft][rewardStake];
    }

    function createStakePair(
        address rewardStake
    ) external virtual onlyOwner nonReentrant{
        require(
            getPair(rewardStake) == address(0),
            "HobbitPirateIFO : This pair already deployed"
        );

        bytes32 salt = keccak256(abi.encodePacked(hobbitNft, rewardStake));
        address temp = Clones.cloneDeterministic(
            implementation,
            salt
        );
        IHobbitPiratesNFTStake(temp)._initialize(
            hobbitNft,
            rewardStake,
            wrapper
        );

        NFTStakePair[hobbitNft][rewardStake] = temp;
        pairAddress.push(temp);

        deployed.increment();

        emit createdStakePair(
            temp,
            hobbitNft,
            rewardStake
        );
    }
}