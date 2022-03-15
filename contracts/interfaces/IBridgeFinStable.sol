// SPDX-License-Identifier: MIT

pragma solidity >=0.5.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBridgeFinStable {
    enum FEE_TYPE {
        NO_FEE,
        FIX,
        PERCENTAGE
    }

    enum TOKEN_STRATEGY {
        LOCK,
        BURN
    }

    struct ERC20BridgeInfo {
        IERC20 token;
        address feeReceiver;
        // if fee type is PERCENTAGE it will be divided by 10,000 (50 mean 0.5%) else it mean fix rate
        uint256 fee;
        FEE_TYPE feeType;
        TOKEN_STRATEGY strategy;
        address receiver;
    }

    function addDestChainID(IERC20 _token, uint256 _destChainID) external;

    function removeDestChainID(IERC20 _token, uint256 _destChainID) external;

    function getWhitelistToken(IERC20 _token)
        external
        view
        returns (ERC20BridgeInfo memory);

    function getDestChains(IERC20 _token)
        external
        view
        returns (uint256[] memory);

    function setToken(ERC20BridgeInfo memory _bridgeInfo) external;

    function deleteToken(IERC20 _token) external;

    function getWhitelist() external view returns (address[] memory);

    function addWhitelistAddress(address _addr) external;

    function removeWhitelistAddress(address _addr) external;

    function bridge(
        IERC20 _token,
        uint256 _amount,
        uint256 _destChainID,
        address _to
    ) external;

    function computeFeeByFeeType(IERC20 _token, uint256 _amount)
        external
        view
        returns (uint256);
}
