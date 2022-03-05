// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IAdmin {
    function rootAdmin() external view returns (address);

    function changeRootAdmin(address _newRootAdmin) external;
}
