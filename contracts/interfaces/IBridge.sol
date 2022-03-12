//SPDX-License-Identifier: Unlicense
pragma solidity >=0.5.0;

interface IBridge {
    function bridgeERC20(
        address tokenAddr,
        address from,
        address to,
        uint256 amount
    ) external;
}
