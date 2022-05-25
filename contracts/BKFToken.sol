// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./modules/KAP20/KAP20.sol";

contract BKFToken is KAP20 {
  constructor(
    uint256 _totalSupply,
    address _kyc,
    address _committee,
    address _transferRouter,
    uint256 _acceptedKYCLevel
  )
    KAP20(
      "BKF Token",
      "BKF",
      18,
      _kyc,
      _committee,
      _transferRouter,
      _acceptedKYCLevel
    )
  {
    _mint(msg.sender, _totalSupply);
  }

  function mint(address account, uint256 amount) external onlyOwner {
    _mint(account, amount);
  }

  function pause() external onlyOwner {
    _pause();
  }

  function unpause() external onlyOwner {
    _unpause();
  }
}
