// SPDX-License-Identifier: None

import "./library/addressChecker.sol";
import "./library/Address.sol";
import "./library/ReentrancyGuard.sol";
import "./library/SafeBEP20.sol";
import "./interface/IWrapper.sol";
import "./interface/IHobbitPirateNFT.sol";
import "./interface/INFTStakeFactory.sol";
import "./abstract/Context.sol";
import "./abstract/ERC721Holders.sol";
import "./abstract/Initializable.sol";

pragma solidity ^0.8.0;

contract HobbitPirateNFTStake is Initializable, Context, ReentrancyGuard, ERC721Holder{
    using addressChecker for address;
    using ERC165Checker for address;
    using Address for address;
    using SafeBEP20 for IBEP20;

    uint256 private totalPools;

    address public factory;
    address public nft;
    address public reward;
    address public wrapper;

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

    mapping (uint256 => poolDetail) private stakePools;
    mapping (uint256 => poolRewards) private stakePoolRewards;
    mapping (address => userDetail) private stakerDetails;

    event createdPool(
        uint256 indexed poolId,
        uint256 duration,
        uint256[] rewardList
    );
    event refillReward(
        uint256 indexed poolId,
        uint256 rewardAmount
    );
    event takeReward(
        uint256 indexed poolId,
        uint256 rewardAmount
    );
    event userStakeIn(
        address indexed staker,
        uint256 indexed selectedPool,
        uint256 indexed stakedNFTId
    );
    event userStakeOut(
        address indexed staker,
        uint256 indexed selectedPool,
        uint256 indexed stakedNFTId
    );
    event userClaimStake(
        address indexed staker,
        uint256 indexed stakedNFTId,
        uint256 indexed amountReward
    );

    constructor() {
        if(_msgSender().isContract() == false) {
            _disableInitializers();
        }
    }

    function _initialize(
        address nftStake,
        address rewardStake,
        address wrap
    ) initializer public {
        require(
            nftStake.isERC721(),
            "HobbitPirateNFTStake : This address is not a NFT with ERC721 standart!"
        );
        require(
            rewardStake.isBEP20(),
            "HobbitPirateNFTStake : This address is not a BEP20 token"
        );
        require(
            INFTStakeFactory(_msgSender()).owner() != address(0),
            "HobbitPirateNFTStake : This address is not a factory"
        );

        factory = _msgSender();
        nft = nftStake;
        reward = rewardStake;
        wrapper = wrap;
    }

    receive() external payable{
        require(
            _msgSender() == wrapper,
            "HobbitPirateNFTStake : Only accept from wrapper"
        );
    }

    modifier onlyFactoryOwner(){
        require(
            _msgSender() == INFTStakeFactory(factory).owner(),
            "HobbitPirateNFTStake : Only owner allowed!"
        );
        _;
    }

    function createPool(
        uint256[] memory rewardList,
        uint256 durationStake
    ) external virtual nonReentrant onlyFactoryOwner{
        require(
            rewardList.length == 3,
            "HobbitPirateNFTStake : please input all roles reward"
        );

        stakePools[totalPools] = poolDetail(
            rewardList,
            durationStake
        );
        totalPools += 1;

        emit createdPool(
            totalPools,
            durationStake,
            rewardList
        );
    }

    function refillRewardPool(
        uint256 poolId,
        uint256 amountReward
    ) external payable virtual nonReentrant onlyFactoryOwner{
        require(
            poolId < totalCreatedPools(),
            "HobbitPirateNFTStake : inputted pool is not exist"
        );
        if(reward == wrapper && msg.value > 0){
            require(
                msg.value == amountReward,
                "HobbitPirateNFTStake : Insufficient value!"
            );
            IWrapper(reward).deposit{
                value: amountReward
            }();
        }else{
            require(
                msg.value == 0,
                "HobbitPirateNFTStake : no need value!"
            );
            require(
                IBEP20(reward).allowance(
                    _msgSender(),
                    address(this)
                ) >= amountReward,
                "HobbitPirateNFTStake : Insufficient allowance!"
            );

            IBEP20(reward).safeTransferFrom(
                _msgSender(),
                address(this),
                amountReward
            );
        }
        stakePoolRewards[poolId].totalRewardPool += amountReward;

        emit refillReward(
            poolId,
            amountReward
        );
    }

    function takeRewardPool(
        uint256 poolId,
        uint256 amountReward
    ) external virtual nonReentrant onlyFactoryOwner{
        require(
            poolId < totalCreatedPools(),
            "HobbitPirateNFTStake : inputted pool is not exist"
        );

        (,, uint256 available) = poolRewardInfo(poolId);
        require(
            available >= amountReward,
            "HobbitPirateNFTStake : Pool reward has beed exceed!"
        );

        if(reward == wrapper){
            IWrapper(reward).withdraw(amountReward);
            payable(_msgSender()).transfer(amountReward);
        }else{
            IBEP20(reward).safeTransfer(
                _msgSender(),
                amountReward
            );
        }
        stakePoolRewards[poolId].totalRewardPool -= amountReward;

        emit takeReward(
            poolId,
            amountReward
        );
    }

    function userStakeInNFT(
        uint256 selectedPools,
        uint256 selectedNftIds
    ) external virtual nonReentrant{
        require(
            selectedPools < totalCreatedPools(),
            "HobbitPirateNFTStake : This pool not available!"
        );
        require(
            IHobbitPirateNFT(nft).ownerOf(
                selectedNftIds
            ) == _msgSender(),
            "HobbitPirateNFTStake : This NFT assets is not yours!"
        );
        require(
            IHobbitPirateNFT(nft).isApprovedForAll(
                _msgSender(),
                address(this)
            ),
            "HobbitPirateNFTStake : Please grant 'isApprovedForAll' access to this address!"
        );
        require(
            userInfo(_msgSender()).stakeOutTime == 0 &&
            userInfo(_msgSender()).claimOutTime == 0 &&
            userInfo(_msgSender()).activedStakePool == 0,
            "HobbitPirateNFTStake : You still active at other staking pools!"
        );

        uint256 getRarity = uint256(
            IHobbitPirateNFT(nft).rarityInfo(selectedNftIds).rarity
        );
        uint256 allocatedReward = poolInfo(
            selectedPools
        ).rewardAmount[getRarity];
        (,,uint256 availableReward) = poolRewardInfo(
            selectedPools
        );

        require(
            availableReward >= allocatedReward,
            "HobbitPirateNFTStake : insufficient reward pool!"
        );

        IHobbitPirateNFT(nft).safeTransferFrom(
            _msgSender(),
            address(this),
            selectedNftIds
        );

        stakerDetails[_msgSender()] = userDetail(
            selectedPools,
            selectedNftIds,
            block.timestamp + poolInfo(
                selectedPools
            ).duration,
            0,
            allocatedReward
        );
        stakePoolRewards[selectedPools].allocatedRewardPool += allocatedReward;

        emit userStakeIn(
            _msgSender(),
            selectedPools,
            selectedNftIds
        );
    }

    function userStakeOutNFT() external virtual nonReentrant{
        require(
            userInfo(_msgSender()).claimOutTime == 0 &&
            userInfo(_msgSender()).stakeOutTime != 0,
            "HobbitPirateNFTStake : Not Meet Condition for do this action!"
        );

        if(block.timestamp <= userInfo(_msgSender()).stakeOutTime){
            uint256 tempReward = userInfo(_msgSender()).allocatedReward;
            uint256 tempActive = userInfo(_msgSender()).activedStakePool;

            stakerDetails[_msgSender()].allocatedReward = 0;
            stakePoolRewards[tempActive].allocatedRewardPool -= tempReward;
        }

        stakerDetails[_msgSender()].stakeOutTime = 0;
        stakerDetails[_msgSender()].claimOutTime = block.timestamp + 1 days;

        emit userStakeOut(
            _msgSender(),
            userInfo(_msgSender()).activedStakePool,
            userInfo(_msgSender()).nftIdsStaked
        );
    }

    function userClaimOutNFT() external virtual nonReentrant{
        require(
            userInfo(_msgSender()).stakeOutTime == 0 &&
            block.timestamp > userInfo(_msgSender()).claimOutTime &&
            userInfo(_msgSender()).claimOutTime != 0,
            "HobbitPirateNFTStake : Not Meet Condition for do this action!"
        );

        uint256 tempReward = userInfo(_msgSender()).allocatedReward;
        uint256 tempNftId = userInfo(_msgSender()).nftIdsStaked;
        uint256 tempActive = userInfo(_msgSender()).activedStakePool;

        IHobbitPirateNFT(nft).safeTransferFrom(
            address(this),
            _msgSender(),
            tempNftId
        );
        

        if(stakerDetails[_msgSender()].allocatedReward > 0){
            if(reward == wrapper){
                IWrapper(reward).withdraw(tempReward);
                payable(_msgSender()).transfer(tempReward);
            }else{
                IBEP20(reward).safeTransfer(
                    _msgSender(),
                    tempReward
                );
            }

            stakerDetails[_msgSender()].allocatedReward = 0;
        }

        stakerDetails[_msgSender()].activedStakePool = 0;
        stakerDetails[_msgSender()].nftIdsStaked = 0;
        stakerDetails[_msgSender()].claimOutTime = 0;

        stakePoolRewards[tempActive].allocatedRewardPool -= tempReward;
        stakePoolRewards[tempActive].totalRewardPool -= tempReward;

        emit userClaimStake(
            _msgSender(),
            tempNftId,
            tempReward
        );
    }

    function poolInfo(
        uint256 poolId
    ) public view returns(poolDetail memory){
        require(
            poolId < totalCreatedPools(),
            "HobbitPirateNFTStake : inputted pool is not exist"
        );

        return stakePools[poolId];
    }

    function poolRewardInfo(
        uint256 poolId
    ) public view returns(
        uint256,
        uint256,
        uint256
    ){
        require(
            poolId < totalCreatedPools(),
            "HobbitPirateNFTStake : inputted pool is not exist"
        );
        
        unchecked{
            uint256 available = stakePoolRewards[poolId].totalRewardPool;
            available -= stakePoolRewards[poolId].allocatedRewardPool;

            return(
                stakePoolRewards[poolId].totalRewardPool,
                stakePoolRewards[poolId].allocatedRewardPool,
                available
            );
        }
    }

    function userInfo(
        address user
    ) public view returns(userDetail memory){
        return stakerDetails[user];
    }

    function totalCreatedPools() public view returns(uint256){
        return totalPools;
    }
}