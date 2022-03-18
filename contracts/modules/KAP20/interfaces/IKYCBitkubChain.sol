// SPDX-License-Identifier: MIT AND Unlicense
// Sources flattened with hardhat v2.9.1 https://hardhat.org

pragma solidity ^0.8.0;

interface IKYCBitkubChain {
  function kycsLevel(address _addr) external view returns (uint256);
}
