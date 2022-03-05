// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "../interfaces/IAdmin.sol";

contract Admin is IAdmin {

    uint256 private constant _NOT_ADMIN = 0;
    uint256 private constant _ADMIN = 1;

    address public override rootAdmin;
    mapping(address => uint256) public override isAdmin;

    event RootAdminChanged(address indexed oldRoot, address indexed newRoot);
    event AdminUpdated(address indexed account, uint256 indexed isAdmin);

    constructor(address _rootAdmin) {
        rootAdmin = _rootAdmin;
    }

    modifier onlyRootAdmin() {
        require(msg.sender == rootAdmin, "must be root admin");
        _;
    }

    modifier onlyAdmin() {
        require(isAdmin[msg.sender] == _ADMIN , "must be admin");
        _;
    }

    function changeRootAdmin(address _newRootAdmin) public onlyRootAdmin {
        address oldRoot = rootAdmin;
        rootAdmin = _newRootAdmin;
        emit RootAdminChanged(oldRoot, rootAdmin);
    }

    function addAdmin(address _admin) public onlyRootAdmin {
        isAdmin[_admin] = _ADMIN;
        emit AdminUpdated(_admin, _ADMIN);
    }

    function removeAdmin(address _admin) public onlyRootAdmin {
        isAdmin[_admin] = _NOT_ADMIN;
        emit AdminUpdated(_admin, _NOT_ADMIN);
    }
}
