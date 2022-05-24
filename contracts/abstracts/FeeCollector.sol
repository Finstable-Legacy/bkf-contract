// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IFeeCollector.sol";

abstract contract FeeCollector is IFeeCollector {
  uint256 public constant override feeDecimals = 4;
  uint256 public constant override shifter = 10**feeDecimals;
  uint256 public override fee = 50; // 4 decimals => 0.005 * 10^4
  address public override feeClaimer;

  mapping(address => uint256) public override tokenFeeReserves;

  event FeeCollected(
    address indexed beneficiary,
    address indexed token,
    uint256 amount
  );
  event FeeClaimerChanged(
    address indexed oldFeeClaimer,
    address indexed newFeeClaimer
  );
  event FeeChanged(uint256 oldFee, uint256 newFee);

  modifier onlyFeeCalimer() {
    require(msg.sender == feeClaimer, "Only fee claimer");
    _;
  }

  constructor(address feeClaimer_) {
    feeClaimer = feeClaimer_;
  }

  function deductFee(address token, uint256 amount)
    internal
    returns (uint256, uint256)
  {
    uint256 collectedFee = (amount * fee) / shifter;
    uint256 output = amount - collectedFee;
    tokenFeeReserves[token] += collectedFee;
    return (output, collectedFee);
  }

  function collectFee(
    address token,
    uint256 amount,
    address beneficiary
  ) external override onlyFeeCalimer {
    uint256 withdrewAmount = amount >= tokenFeeReserves[token]
      ? tokenFeeReserves[token]
      : amount;
    IERC20(token).transfer(beneficiary, withdrewAmount);
    tokenFeeReserves[token] -= withdrewAmount;
    emit FeeCollected(beneficiary, token, withdrewAmount);
  }

  function _setFeeClaimer(address newFeeClaimer) internal {
    address oldFeeCalimer = feeClaimer;
    feeClaimer = newFeeClaimer;
    emit FeeClaimerChanged(oldFeeCalimer, feeClaimer);
  }

  function _setFee(uint256 newFee) internal {
    uint256 oldFee = fee;
    fee = newFee;
    emit FeeChanged(oldFee, fee);
  }
}
