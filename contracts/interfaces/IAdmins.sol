// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IAdmins {
    function rootAdmin() external view returns (address);
    function isAdmin(address account) external returns (uint256);

    function changeRootAdmin(address _newRootAdmin) external;
    function addAdmin(address _newAdmin) external;
    function removeAdmin(address _admin) external;
}
