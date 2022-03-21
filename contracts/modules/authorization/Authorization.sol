// File contracts/abstract/Authorization.sol
pragma solidity 0.8.11;

import "../admin/interfaces/IAdminProjectRouter.sol";

abstract contract Authorization {
    IAdminProjectRouter public adminRouter;
    string public constant PROJECT = "bkf-dealer";

    modifier onlySuperAdmin() {
        require(adminRouter.isSuperAdmin(msg.sender, PROJECT), "Restricted only super admin");
        _;
    }

    modifier onlySuperAdminOrAdmin() {
        require(
            adminRouter.isSuperAdmin(msg.sender, PROJECT) || adminRouter.isAdmin(msg.sender, PROJECT),
            "Restricted only super admin or admin"
        );
        _;
    }

    function setAdmin(address _adminRouter) external onlySuperAdmin {
        adminRouter = IAdminProjectRouter(_adminRouter);
    }
}