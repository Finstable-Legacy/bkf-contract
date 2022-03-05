// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "../interfaces/IAdmin.sol";

contract Admin is IAdmin {
    address public override rootAdmin;

    event RootAdminChanged(address indexed oldRoot, address indexed newRoot);

    constructor(address _rootAdmin) {
        rootAdmin = _rootAdmin;
    }

    modifier onlyRootAdmin() {
        require(msg.sender == rootAdmin, "must be root admin");
        _;
    }

    function changeRootAdmin(address _newRootAdmin) public onlyRootAdmin {
        address oldRoot = rootAdmin;
        rootAdmin = _newRootAdmin;
        emit RootAdminChanged(oldRoot, rootAdmin);
    }
}
