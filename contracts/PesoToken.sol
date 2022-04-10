//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract PesoToken is ERC20, Ownable {
    using SafeMath for uint256;

    address[] internal stakeholders;
    mapping(address => uint256) internal stakes;
    mapping(address => uint256) internal rewards;

    constructor(address _owner, uint256 initialSupply) ERC20("Peso", "PES") {
        _mint(_owner, initialSupply);
    }

    function isStakeholder(address _address)
        public
        view
        returns (bool, uint256)
    {
        for (uint256 s = 0; s < stakeholders.length; s++) {
            if (_address == stakeholders[s]) return (true, s);
        }
        return (false, 0);
    }

    function addStakeholder(address _stakeholder) public {
        (bool _isStakeholder, ) = isStakeholder(_stakeholder);
        if (!_isStakeholder) stakeholders.push(_stakeholder);
    }

    function removeStakeholder(address _stakeholder) public {
        (bool _isStakeholder, uint256 s) = isStakeholder(_stakeholder);
        if (_isStakeholder) {
            stakeholders[s] = stakeholders[stakeholders.length - 1];
            stakeholders.pop();
        }
    }

    function stakeOf(address _stakeholder) public view returns (uint256) {
        return stakes[_stakeholder];
    }

    function totalStakes() public view returns (uint256) {
        uint256 _totalStakes = 0;
        for (uint256 s = 0; s < stakeholders.length; s++) {
            _totalStakes = _totalStakes.add(stakes[stakeholders[s]]);
        }
        return _totalStakes;
    }

    function createStake(uint256 _stake) public {
        require(balanceOf(msg.sender) > 0, "Insufficient balance to stake.");

        _burn(msg.sender, _stake);
        if (stakes[msg.sender] == 0) addStakeholder(msg.sender);
        stakes[msg.sender] = stakes[msg.sender].add(_stake);
    }

    function removeStake(uint256 _stake) public {
        stakes[msg.sender] = stakes[msg.sender].sub(_stake);
        if (stakes[msg.sender] == 0) removeStakeholder(msg.sender);
        _mint(msg.sender, _stake);
    }

    function rewardOf(address _stakeholder) public view returns (uint256) {
        return rewards[_stakeholder];
    }

    function totalRewards() public view returns (uint256) {
        uint256 _totalRewards = 0;
        for (uint256 s = 0; s < stakeholders.length; s++) {
            _totalRewards = _totalRewards.add(rewards[stakeholders[s]]);
        }
        return _totalRewards;
    }

    function calculateRewards(address _stakeholder)
        public
        view
        returns (uint256)
    {
        return stakes[_stakeholder] / 100;
    }

    function distributeRewards() public onlyOwner {
        for (uint256 s = 0; s < stakeholders.length; s++) {
            address stakeholder = stakeholders[s];
            uint256 reward = calculateRewards(stakeholder);
            rewards[stakeholder] = rewards[stakeholder].add(reward);
        }
    }

    function withdrawnReward() public {
        uint256 reward = rewards[msg.sender];
        rewards[msg.sender] = 0;
        _mint(msg.sender, reward);
    }
}
