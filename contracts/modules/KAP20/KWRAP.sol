// SPDX-License-Identifier: MIT AND Unlicense
// Sources flattened with hardhat v2.9.1 https://hardhat.org

pragma solidity ^0.8.0;

import "./KAP20.sol";

contract KWRAP is KAP20 {
  IKAP20 public underlying;

  constructor(
    string memory _name,
    string memory _symbol,
    uint8 _decimals,
    address _kyc,
    address _committee,
    address _transferRouter,
    address _underlying
  ) KAP20(_name, _symbol, _decimals, _kyc, _committee, _transferRouter, 4) {
    underlying = IKAP20(_underlying);
  }

  function pause() external onlyOwner {
    _pause();
  }

  function unpause() external onlyOwner {
    _unpause();
  }

  function deposit(uint256 _amount) external whenNotPaused {
    underlying.transferFrom(msg.sender, address(this), _amount);
    _mint(msg.sender, _amount);
  }

  function withdraw(uint256 _amount) external whenNotPaused {
    underlying.transfer(msg.sender, _amount);
    _burn(msg.sender, _amount);
  }
}
