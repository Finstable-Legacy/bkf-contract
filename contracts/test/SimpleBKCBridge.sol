//SPDX-License-Identifier: Unlicense
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract SimpleBKCBridge {
    event BridgedERC20(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    event ReceivedERC20(
        address indexed token,
        address indexed from,
        address indexed to,
        uint256 amount
    );

    function bridgeERC20(
        address tokenAddr,
        address from,
        address to,
        uint256 amount
    ) external {
        IERC20 token = IERC20(tokenAddr);
        token.transferFrom(msg.sender, address(this), amount);
        emit BridgedERC20(tokenAddr, from, to, amount);
    }

    function receiveERC20(
        address tokenAddr,
        address from,
        address to,
        uint256 amount
    ) external {
        IERC20 token = IERC20(tokenAddr);
        token.transfer(to, amount);
        emit ReceivedERC20(tokenAddr, from, to, amount);
    }

    function withdraw(address tokenAddr, uint256 amount) external {
        IERC20 token = IERC20(tokenAddr);
        token.transfer(msg.sender, amount);
    }
}
