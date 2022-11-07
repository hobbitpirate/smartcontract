// SPDX-License-Identifier: none

import "./library/addressChecker.sol";
import "./library/ReentrancyGuard.sol";
import "./library/SafeBEP20.sol";
import "./interface/IWrapper.sol";
import "./interface/IHobbitPirateFarmFactory.sol";
import "./abstract/Context.sol";
import "./abstract/Initializable.sol";

pragma solidity ^0.8.0;

contract HobbitPirateFarm is Initializable, Context, ReentrancyGuard{
    using addressChecker for address;
    using Address for address;
    using SafeBEP20 for IBEP20;

    event CreatedPool(
        uint256 indexed timeCreate,
        uint256 indexed poolId,
        farmPoolOption indexed poolDetail
    );

    event EditedPool(
        uint256 indexed timeEdited,
        uint256 indexed poolId,
        farmPoolOption indexed poolDetail
    );

    event ChangedEqualityValue(
        uint256 indexed timeChanged,
        uint256 indexed equal1,
        uint256 indexed equal2
    );

    event AddedReward(
        uint256 indexed timeAdded,
        uint256 indexed amountPool
    );

    event RemovedReward(
        uint256 indexed timeAdded,
        uint256 indexed amountPool
    );

    event UserFarmIn(
        uint256 indexed timeJoin,
        address indexed user,
        userDetail indexed userInfo
    );

    event UserRewardClaimed(
        uint256 indexed timeClaim,
        address indexed user,
        uint256 indexed amountClaim
    );
    
    event UserStoppedFarm(
        uint256 indexed timeStopped,
        address indexed user
    );

    event UserFarmOut(
        uint256 indexed timeQuit,
        address indexed user,
        uint256 indexed amountOut
    );

    mapping (uint256 => farmPoolOption) private pools;
    mapping (address => userDetail) private userData;

    uint256 public totalPool;
    address public wrapper;
    address public factory;
    address public deposit;
    address public reward;
    farmPool public poolInfo;

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

    constructor() {
        if(_msgSender().isContract() == false) {
            _disableInitializers();
        }
    }

    receive() external payable{
        require(
            _msgSender() == wrapper,
            "HobbitPirateNFTStake : Only accept from wrapper"
        );
    }

    function _initialize(
        address depo,
        address income,
        address wrap
    ) initializer public {
        deposit = depo;
        reward = income;
        wrapper = wrap;
        factory = _msgSender();

        poolInfo.equal1 = 10**IBEP20(depo).decimals();
        poolInfo.equal2 = 10**IBEP20(income).decimals();
    }

    modifier onlyOwner(){
        require(
            _msgSender() == IHobbitPirateFarmFactory(factory).owner(),
            "HobbitPirateFarm : You are not owner!"
        );
        _;
    }

    modifier WhenNonfarm(){
        require(
            deposit != reward,
            "HobbitPirateFarm : Farm in Stake Mode!"
        );
        _;
    }

    modifier rewardFilled() {
        require(
            poolInfo.equal1 > 0 &&
            poolInfo.equal2 > 0 &&
            (poolInfo.rewardSupply - poolInfo.rewardLocked) > 0 ,
            "HobbitPirateFarm : Insufficient Reward!"
        );
        _;
    }

    function createPool(
        uint256 duration,
        uint256 apyFraction1,
        uint256 apyFraction2
    ) external virtual onlyOwner nonReentrant{
        pools[totalPool] = farmPoolOption(
            duration,
            apyFraction1,
            apyFraction2
        );

        totalPool += 1;

        emit CreatedPool(
            block.timestamp,
            (totalPool - 1),
            farmPoolOption(
                duration,
                apyFraction1,
                apyFraction2
            )
        );
    }

    function editPool(
        uint256 poolId,
        uint256 duration,
        uint256 apyFraction1,
        uint256 apyFraction2
    ) external virtual onlyOwner nonReentrant{
        require(
            poolId < totalPool,
            "HobbitPirateFarm : This pool is not available!"
        );

        pools[poolId] = farmPoolOption(
            duration,
            apyFraction1,
            apyFraction2
        );

        emit EditedPool(
            block.timestamp,
            poolId,
            farmPoolOption(
                duration,
                apyFraction1,
                apyFraction2
            )
        );
    }

    function editEqualityValue(
        uint256 newReward
    ) external virtual WhenNonfarm onlyOwner nonReentrant{
        poolInfo.equal2 = newReward;

        emit ChangedEqualityValue(
            block.timestamp,
            poolInfo.equal1,
            newReward
        );
    }

    function addReward(
        uint256 amountPool
    ) external payable virtual onlyOwner nonReentrant{
        if(reward == wrapper && msg.value > 0){
            require(
                msg.value == amountPool,
                "HobbitPirateFarm : Insufficient value for this transaction!"
            );
            IWrapper(wrapper).deposit{
                value: amountPool
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
                ) >= amountPool,
                "HobbitPirateFarm : Insufficient allocation for this transaction!"
            );
            IBEP20(reward).safeTransferFrom(
                _msgSender(),
                address(this),
                amountPool
            );
        }

        unchecked{
            poolInfo.rewardSupply = poolInfo.rewardSupply + amountPool;
        }

        emit AddedReward(
            block.timestamp,
            amountPool
        );
    }

    function removeReward(
        uint256 amountPool
    ) external virtual onlyOwner nonReentrant{
        unchecked{
            uint256 available = poolInfo.rewardSupply - poolInfo.rewardLocked;

            require(
                available >= amountPool,
                "HobbitPirateFarm : Pool reward has beed exceed!"
            );

            poolInfo.rewardSupply = poolInfo.rewardSupply - amountPool;
        }

        if(reward == wrapper){
            IWrapper(reward).withdraw(amountPool);
            payable(_msgSender()).transfer(amountPool);
        }else{
            IBEP20(reward).safeTransfer(
                _msgSender(),
                amountPool
            );
        }

        emit RemovedReward(
            block.timestamp,
            amountPool
        );
    }

    function userWantfarmIn(
        uint256 selectedPool,
        uint256 amountfarm
    ) external payable virtual nonReentrant{
        require(
            !userDataInfo(_msgSender()).isActive,
            "HobbitPirateFarm : You already have actived farm!"
        );
        require(
            userDataInfo(_msgSender()).deposited == 0,
            "HobbitPirateFarm : Farm Out first before re-farm!"
        );
        require(
            userClaimableReward(_msgSender()) == 0,
            "HobbitPirateFarm : Claim all reward before re-farm!"
        );
        require(
            selectedPool < totalPool,
            "HobbitPirateFarm : This pool is not available!"
        );
        require(
            poolInfo.rewardLocked + rewardCalculator(
                selectedPool,
                amountfarm
            ) <= poolInfo.rewardSupply,
            "HobbitPirateFarm : Insufficient reward!"
        );

        if(deposit == wrapper && msg.value > 0){
            require(
                msg.value == amountfarm,
                "HobbitPirateFarm : Insufficient value for this transaction!"
            );
            IWrapper(wrapper).deposit{
                value: amountfarm
            }();
        }else{
            require(
                msg.value == 0,
                "HobbitPirateNFTStake : no need value!"
            );
            require(
                IBEP20(deposit).allowance(
                    _msgSender(),
                    address(this)
                ) >= amountfarm,
                "HobbitPirateFarm : Insufficient allocation for this transaction!"
            );
            IBEP20(deposit).safeTransferFrom(
                _msgSender(),
                address(this),
                amountfarm
            );
        }

        userData[_msgSender()] = userDetail(
            true,
            selectedPool,
            amountfarm,
            block.timestamp,
            (block.timestamp + (poolOptionByIndex(
                selectedPool
            ).longTime)),
            block.timestamp,
            rewardCalculator(
                selectedPool,
                amountfarm
            ),
            _rewardPerSecondCalculator(
                selectedPool,
                amountfarm
            )
        );

        poolInfo.rewardLocked = poolInfo.rewardLocked + rewardCalculator(
            selectedPool,
            amountfarm
        );

        emit UserFarmIn(
            block.timestamp,
            _msgSender(),
            userDetail(
                true,
                selectedPool,
                amountfarm,
                block.timestamp,
                (block.timestamp + (poolOptionByIndex(
                    selectedPool
                ).longTime)),
                block.timestamp,
                rewardCalculator(
                    selectedPool,
                    amountfarm
                ),
                _rewardPerSecondCalculator(
                    selectedPool,
                    amountfarm
                )
            )
        );
    }

    function userWantClaim() external virtual nonReentrant{
        require(
            userDataInfo(_msgSender()).isActive,
            "HobbitPirateFarm : You do not have active farm yet!"
        );
        require(
            userDataInfo(_msgSender()).deposited > 0,
            "HobbitPirateFarm : You already have farm out!"
        );
        require(
            userClaimableReward(_msgSender()) > 0,
            "HobbitPirateFarm : You do not have any reward!"
        );

        uint256 tempClaimReward = userClaimableReward(_msgSender());

        userData[_msgSender()].farmLastClaim = block.timestamp;
        userData[_msgSender()].allocated = userData[_msgSender()].allocated - tempClaimReward;
        poolInfo.rewardSupply = poolInfo.rewardSupply - tempClaimReward;
        poolInfo.rewardLocked = poolInfo.rewardLocked - tempClaimReward;

        if(reward == wrapper){
            IWrapper(wrapper).withdraw(tempClaimReward);
            payable(_msgSender()).transfer(tempClaimReward);
        }else{
            IBEP20(reward).safeTransfer(
                _msgSender(),
                tempClaimReward
            );
        }

        emit UserRewardClaimed(
            block.timestamp,
            _msgSender(),
            tempClaimReward
        );
    }
    
    function userWantStopfarm() external virtual nonReentrant{
        require(
            userDataInfo(_msgSender()).isActive,
            "HobbitPirateFarm : You do not have active farm yet!"
        );
        require(
            block.timestamp < userDataInfo(_msgSender()).farmEnd,
            "HobbitPirateFarm : This action is not needed again!"
        );
        require(
            userDataInfo(_msgSender()).deposited > 0,
            "HobbitPirateFarm : You already have farm out!"
        );

        IHobbitPirateFarmFactory.penaltyUnstake memory data = IHobbitPirateFarmFactory(
            factory).getPenaltyData();
        uint256 penalty;

        if(data.argFraction1 > 0 && data.argFraction2 > 0){
            unchecked {
                penalty = (
                    (userData[_msgSender()].deposited * data.argFraction1) / 
                data.argFraction2) / 100;
            }

            if(deposit == wrapper){
                IWrapper(wrapper).withdraw(penalty);
                payable(IHobbitPirateFarmFactory(factory).owner()).transfer(penalty);
            }else{
                IBEP20(deposit).safeTransfer(
                    IHobbitPirateFarmFactory(factory).owner(),
                    penalty
                );
            }
        }

        uint256 unclaimedDistance = block.timestamp - (
            userData[_msgSender()].farmLastClaim
        );
        uint256 deallocatedReward = userData[_msgSender()].rewardPerSecond * (
            unclaimedDistance
        );
        uint256 freeAllocation = userData[_msgSender()].allocated - (
            deallocatedReward
        );

        userData[_msgSender()].deposited -= penalty;

        userData[_msgSender()].allocated = deallocatedReward;
        poolInfo.rewardLocked = poolInfo.rewardLocked - freeAllocation;

        userData[_msgSender()].farmEnd = block.timestamp;

        emit UserStoppedFarm(
            block.timestamp,
            _msgSender()
        );
    }

    function userWantfarmOut() external virtual nonReentrant{
        require(
            userDataInfo(_msgSender()).isActive,
            "HobbitPirateFarm : You do not have active farm yet!"
        );
        require(
            block.timestamp > userDataInfo(_msgSender()).farmEnd,
            "HobbitPirateFarm : You cant farm out before ended or stopped!"
        );
        require(
            userDataInfo(_msgSender()).deposited > 0,
            "HobbitPirateFarm : You already have farm out!"
        );
        require(
            userClaimableReward(_msgSender()) == 0,
            "HobbitPirateFarm : Claim all reward before farm out!"
        );

        uint256 tempAmount = userData[_msgSender()].deposited;
        userData[_msgSender()].isActive = false;
        
        if(deposit == wrapper){
            IWrapper(wrapper).withdraw(userData[_msgSender()].deposited);
            payable(_msgSender()).transfer(userData[_msgSender()].deposited);
        }else{
            IBEP20(deposit).safeTransfer(
                _msgSender(),
                userData[_msgSender()].deposited
            );
        }

        userData[_msgSender()].deposited = 0;
        
        emit UserFarmOut(
            block.timestamp,
            _msgSender(),
            tempAmount
        );
    }

    function poolOptionByIndex(
        uint256 index
    ) public view returns(farmPoolOption memory){
        return pools[index];
    }

    function userDataInfo(
        address user
    ) public view returns(userDetail memory){
        return userData[user];
    }

    function userClaimableReward(
        address user
    ) public view returns(uint256){
        unchecked{
            uint256 result;

            if(userDataInfo(user).farmLastClaim < userDataInfo(user).farmEnd){
                uint256 tempStart = userDataInfo(
                    user
                ).farmLastClaim;
                uint256 tempEnd;

                if(block.timestamp < userDataInfo(user).farmEnd){
                    tempEnd = block.timestamp;
                }else{
                    tempEnd = userDataInfo(
                        user
                    ).farmEnd;
                }

                uint256 tempDistance = tempEnd - (tempStart);
                result = userDataInfo(user).rewardPerSecond * (tempDistance);
            }

            return result;
        }
    }

    function rewardCalculator(
        uint256 selectedPool,
        uint256 amountfarm
    ) public view returns (uint256){
        unchecked{
            require(
                selectedPool < totalPool,
                "HobbitPirateFarm : This pool is not available!"
            );

            uint256 rewardPerSecond = _rewardPerSecondCalculator(
                selectedPool,
                amountfarm
            );

            require(
                rewardPerSecond > 0,
                "HobbitPirateFarm : Zero reward calculated is disallowed!"
            );

            uint256 tempReward = rewardPerSecond * poolOptionByIndex(
                selectedPool
            ).longTime;

            return tempReward;
        }
    }

    function _rewardPerSecondCalculator(
        uint256 selectedPool,
        uint256 amountfarm
    ) private view returns(uint256){
        unchecked{
            uint256 tempEqual = amountfarm * poolInfo.equal2;
            tempEqual = tempEqual / (10 ** IBEP20(reward).decimals());

            uint256 tempReward = tempEqual * poolOptionByIndex(
                selectedPool
            ).apyPercent;
            tempReward = tempReward / poolOptionByIndex(
                selectedPool
            ).apyDiver;
            tempReward = tempReward / 100;
            tempReward = tempReward / 31536000;

            return tempReward;
        }
    }
}