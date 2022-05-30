// Sources flattened with hardhat v2.3.0 https://hardhat.org
// SPDX-License-Identifier: MIT
// File contracts/interfaces/IAdminProject.sol

pragma solidity >=0.5.0;

interface IAdminProject {
  function rootAdmin() external view returns (address);

  function isSuperAdmin(address _addr, string calldata _project)
    external
    view
    returns (bool);

  function isAdmin(address _addr, string calldata _project)
    external
    view
    returns (bool);
}
