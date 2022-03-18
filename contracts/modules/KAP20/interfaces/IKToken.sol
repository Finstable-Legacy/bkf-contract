// SPDX-License-Identifier: MIT AND Unlicense
// Sources flattened with hardhat v2.9.1 https://hardhat.org

pragma solidity ^0.8.0;

interface IKToken {
  function internalTransfer(
    address sender,
    address recipient,
    uint256 amount
  ) external returns (bool);

  function externalTransfer(
    address sender,
    address recipient,
    uint256 amount
  ) external returns (bool);
}
