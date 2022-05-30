// SPDX-License-Identifier: MIT
// Sources flattened with hardhat v2.3.0 https://hardhat.org

// File contracts/interfaces/IAdminProjectRouter.sol

pragma solidity >=0.5.0;

interface IAdminProjectRouter {
  function isSuperAdmin(address _addr, string calldata _project)
    external
    view
    returns (bool);

  function isAdmin(address _addr, string calldata _project)
    external
    view
    returns (bool);
}
