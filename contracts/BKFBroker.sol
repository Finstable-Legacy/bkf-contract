// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./abstracts/Admin.sol";
import "./abstracts/FeeCollector.sol";
import "./interfaces/IBridge.sol";

contract BKFBroker is Admin, FeeCollector {
    uint256 private constant _NEW = 0;
    uint256 private constant _COMPLETED = 1;

    mapping(uint256 => uint256) public orderStatus;
    address public swapRouter;
    address public bridge;

    event Purchased(
        uint256 orderId,
        address indexed payer,
        address indexed merchant,
        address inputToken,
        address indexed outputToken,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee,
        uint256 destChainId
    );

    event SwapRouterChanged(address oldSwapRouter, address newSwapRouter);
    event BridgeChanged(address oldBridge, address newBridge);

    constructor(
        address _router,
        address _bridge,
        address _rootAdmin,
        address _feeClaimer
    ) Admin(_rootAdmin) FeeCollector(_feeClaimer) {
        swapRouter = _router;
        bridge = _bridge;
    }

    function purchase(
        uint256 orderId,
        address merchant,
        address inputToken,
        address outputToken,
        uint256 amountIn,
        uint256 amountOutMin,
        uint256 deadline,
        uint256 destChainID
    ) public {
        require(orderStatus[orderId] == _NEW, "Order was completed");

        uint256 amountOut;
        uint256 deductedFee;

        if (inputToken == outputToken) {
            (amountOut, deductedFee) = deductFee(inputToken, amountIn);

            IERC20(inputToken).transferFrom(
                msg.sender,
                address(this),
                amountOut
            );
        } else {
            uint256 swapOutput = swapTokensForExactTokens(
                inputToken,
                outputToken,
                amountOutMin,
                amountIn,
                address(this),
                deadline
            );

            (amountOut, deductedFee) = deductFee(outputToken, swapOutput);
        }

        if (getChainID() != destChainID) {
            IERC20(outputToken).approve(bridge, amountOut);
            IBridge(bridge).bridge(
                IERC20(outputToken),
                amountOut,
                destChainID,
                merchant
            );
        } else {
            IERC20(outputToken).transfer(merchant, amountOut);
        }

        orderStatus[orderId] = _COMPLETED;

        emit Purchased(
            orderId,
            msg.sender,
            merchant,
            inputToken,
            outputToken,
            amountIn,
            amountOut,
            deductedFee,
            destChainID
        );
    }

    function swapTokensForExactTokens(
        address _tokenIn,
        address _tokenOut,
        uint256 _amountOut,
        uint256 _amountInMax,
        address _to,
        uint256 _deadline
    ) private returns (uint256) {
        IERC20(_tokenIn).transferFrom(msg.sender, address(this), _amountInMax);
        IERC20(_tokenIn).approve(swapRouter, _amountInMax);

        address[] memory path = new address[](2);

        path[0] = _tokenIn;
        path[1] = _tokenOut;

        // Receive an exact amount of output tokens for as few input tokens as possible
        uint256[] memory amounts = IUniswapV2Router02(swapRouter)
            .swapTokensForExactTokens(
                _amountOut,
                _amountInMax,
                path,
                _to,
                _deadline
            );

        return amounts[amounts.length - 1];
    }

    function setFee(uint256 newFee) external onlyRootAdmin {
        _setFee(newFee);
    }

    function setFeeClaimer(address newFeeClaimer) external onlyRootAdmin {
        _setFeeClaimer(newFeeClaimer);
    }

    function setSwapRouter(address newSwapRouter) external onlyRootAdmin {
        address oldSwapRouter = swapRouter;
        swapRouter = newSwapRouter;
        emit SwapRouterChanged(oldSwapRouter, newSwapRouter);
    }

    function setBridge(address newBridge) external onlyRootAdmin {
        address oldBridge = bridge;
        bridge = newBridge;
        emit BridgeChanged(oldBridge, newBridge);
    }

    function getChainID() public view returns (uint256) {
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }
}