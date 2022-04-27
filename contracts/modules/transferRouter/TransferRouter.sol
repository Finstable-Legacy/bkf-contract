// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./interfaces/INextTransferRouter.sol";

abstract contract TransferRouter {
  INextTransferRouter public transferRouter;

  function _setTransferRouter(address _transferRouter) internal virtual {
    transferRouter = INextTransferRouter(_transferRouter);
  }
}
