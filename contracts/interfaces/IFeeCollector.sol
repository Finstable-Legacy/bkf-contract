// SPDX-License-Identifier: MIT
pragma solidity >=0.5.0;

interface IFeeCollector {
    function feeClaimer() external returns (address);

    function feeDecimals() external returns (uint256);

    function shifter() external returns (uint256);

    function fee() external returns (uint256);

    function tokenFeeReserves(address token) external returns (uint256);

    function collectFee(
        address token,
        uint256 amount,
        address beneficiary
    ) external;

    function setFeeClaimer(
        address newFeeClaimer
    ) external;

    function setFee(uint256 newFee) external;
}
