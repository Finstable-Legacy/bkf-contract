// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./interfaces/IAdminKAP20Router.sol";

abstract contract TransferRouter {
  IAdminKAP20Router public transferRouter;

  function _setTransferRouter(address _transferRouter) internal virtual {
    transferRouter = IAdminKAP20Router(_transferRouter);
  }
}
