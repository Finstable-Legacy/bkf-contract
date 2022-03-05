// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";

contract Broker {
  uint256 public feeDecimals = 4;
  uint256 public shifter = 10**feeDecimals;
  uint256 public fee = 30; // 4 decimals => 0.003 * 10^4
  mapping(address => uint256) public feeReserves;

  address private UNISWAP_V2_ROUTER;
  address public admin;

  mapping(uint256 => bool) public orders;

  constructor(address _router, address _admin) {
    UNISWAP_V2_ROUTER = _router;
    admin = _admin;
  }

  modifier onlyAdmin() {
    require(msg.sender == admin, "must be admin");
    _;
  }

  event PaymentSuccess(uint256 indexed orderId);
  event WithdrewFee(address token, uint256 amount, address beneficiary);
  event Purchase(
    uint256 orderId,
    address merchant,
    address inputToken,
    address outputToken,
    uint256 amountIn,
    uint256 amountOutMin
  );

  function purchase(
    uint256 orderId,
    address merchant,
    address inputToken,
    address outputToken,
    uint256 amountIn,
    uint256 amountOutMin,
    uint256 deadline
  ) public {
    require(orders[orderId] == false, "Order was completed");
    require(block.timestamp <= deadline, "Order was exceeded deadline");

    orders[orderId] = true;

    if (inputToken == outputToken) {
      // direct transfer token
      uint256 collectedFee = (amountIn * fee) / shifter;
      uint256 calAmountIn = amountIn - collectedFee;

      IERC20(inputToken).transferFrom(msg.sender, merchant, calAmountIn);

      feeReserves[inputToken] += collectedFee;
    } else {
      uint256 swapAmount = swapTokensForExactTokens(
        inputToken,
        outputToken,
        amountOutMin,
        amountIn,
        merchant,
        deadline
      );

      uint256 collectedFee = (swapAmount * fee) / shifter;
      feeReserves[outputToken] += collectedFee;
    }

    emit Purchase(
      orderId,
      merchant,
      inputToken,
      outputToken,
      amountIn,
      amountOutMin
    );
  }

  // ---- SWAP ----
  function getAmountsIn(
    address _tokenIn,
    address _tokenOut,
    uint256 _amountOut
  ) public view returns (uint256) {
    address[] memory path = new address[](2);
    path[0] = _tokenIn;
    path[1] = _tokenOut;

    uint256[] memory amounts = IUniswapV2Router02(UNISWAP_V2_ROUTER)
      .getAmountsIn(_amountOut, path);

    return amounts[0];
  }

  function swapTokensForExactTokens(
    address _tokenIn,
    address _tokenOut,
    uint256 _amountOut,
    uint256 _amountInMax,
    address _to,
    uint256 _deadline
  ) internal returns (uint256) {
    IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountInMax);
    IERC20(_tokenIn).approve(UNISWAP_V2_ROUTER, _amountInMax);

    address[] memory path = new address[](2);

    path[0] = _tokenIn;
    path[1] = _tokenOut;

    // Receive an exact amount of output tokens for as few input tokens as possible
    uint256[] memory amounts = IUniswapV2Router02(UNISWAP_V2_ROUTER)
      .swapTokensForExactTokens(_amountOut, _amountInMax, path, _to, _deadline);

    return amounts[amounts.length - 1];
  }

  function collectFee(
    address token,
    uint256 amount,
    address beneficiary
  ) external onlyAdmin {
    uint256 withdrewAmount = amount >= feeReserves[token]
      ? feeReserves[token]
      : amount;
    IERC20(token).transfer(beneficiary, withdrewAmount);
    feeReserves[token] -= withdrewAmount;
    emit WithdrewFee(token, withdrewAmount, beneficiary);
  }
}
