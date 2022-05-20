// SPDX-License-Identifier: MIT AND Unlicense
// Sources flattened with hardhat v2.9.1 https://hardhat.org

pragma solidity ^0.8.0;

import "../abstracts/KYCHandler.sol";
import "../abstracts/Committee.sol";
import "../abstracts/Ownable.sol";

abstract contract AccessController is KYCHandler, Committee, Ownable {
  address public transferRouter;

  event TransferRouterSet(
    address indexed oldTransferRouter,
    address indexed newTransferRouter,
    address indexed caller
  );

  modifier onlyTransferRouter() {
    // require(
    //   msg.sender == transferRouter,
    //   "AccessController: restricted only transfer router"
    // );
    _;
  }

  modifier onlyTransferRouterOrOwner() {
    require(
      msg.sender == transferRouter || msg.sender == owner(),
      "AccessController: restricted only transfer router or owner"
    );
    _;
  }

  function activateOnlyKYCAddress() external onlyCommittee {
    _activateOnlyKYCAddress();
  }

  function setKYC(address _kyc) external onlyCommittee {
    _setKYC(_kyc);
  }

  function setAcceptedKYCLevel(uint256 _kycLevel) external onlyCommittee {
    _setAcceptedKYCLevel(_kycLevel);
  }

  function setTransferRouter(address _transferRouter) external onlyOwner {
    emit TransferRouterSet(transferRouter, _transferRouter, msg.sender);
    transferRouter = _transferRouter;
  }
}
