// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "@uniswap/v2-periphery/contracts/interfaces/IERC20.sol";
import "./abstracts/Admins.sol";
import "./abstracts/FeeCollector.sol";

contract Dealer is Admins, FeeCollector {
    uint256 private constant _NEW = 0;
    uint256 private constant _CANCELLED = 1;
    uint256 private constant _PAID = 2;
    uint256 private constant _APPEALED = 3;
    uint256 private constant _FAILED = 4;
    uint256 private constant _COMPLETED = 5;

    uint256 public timeoutPeriod = 5 minutes;

    struct OrderSell {
        uint256 id;
        address tokenAddress;
        address seller;
        address buyer;
        uint256 amount;
        uint256 deadline;
        uint256 status;
    }

    OrderSell[] public orderSells;

    event OrderCreated(
        address indexed seller,
        address indexed buyer,
        address indexed tokenAddress,
        uint256 orderId
    );
    event OrderCancelled(
        address indexed seller,
        address indexed buyer,
        uint256 orderId
    );
    event OrderPayConfirmed(
        address indexed seller,
        address indexed buyer,
        uint256 orderId
    );
    event OrderAppealed(
        address indexed seller,
        address indexed buyer,
        uint256 orderId
    );
    event OrderAppealHandled(
        address indexed seller,
        address indexed buyer,
        uint256 orderId,
        address rightAccount,
        address indexed admin
    );
    event OrderCompleted(
        address indexed seller,
        address indexed buyer,
        uint256 orderId,
        uint256 fee
    );
    event TimeoutPeriodUpdated(
        uint256 oldDeadlineInterval,
        uint256 newTimeoutPeriod
    );

    modifier onlyOrderSeller(uint256 orderId) {
        require(
            orderSells[orderId].seller == msg.sender,
            "must be order seller"
        );
        _;
    }

    modifier onlyOrderBuyer(uint256 orderId) {
        require(orderSells[orderId].buyer == msg.sender, "must be order buyer");
        _;
    }

    modifier onlyOrderBuyerOrSeller(uint256 orderId) {
        require(
            orderSells[orderId].buyer == msg.sender ||
                orderSells[orderId].seller == msg.sender,
            "must be order buyer or seller"
        );
        _;
    }

    modifier onlyNewOrder(uint256 orderId) {
        require(orderSells[orderId].status == _NEW, "only new order");
        _;
    }

    modifier onlyPaidOrder(uint256 orderId) {
        require(orderSells[orderId].status == _PAID, "only paid order");
        _;
    }

    modifier onlyAppealedOrder(uint256 orderId) {
        require(orderSells[orderId].status == _APPEALED, "only appealed order");
        _;
    }

    modifier onlyExpired(uint256 orderId) {
        require(
            block.timestamp > orderSells[orderId].deadline,
            "only expired order"
        );
        _;
    }

    constructor(address _rootAdmin, address _feeClaimer)
        Admins(_rootAdmin)
        FeeCollector(_feeClaimer)
    {}

    function createOrderSell(
        address _tokenAddress,
        uint256 _amount,
        address _buyer
    ) external {
        require(_amount > 0, "Invalid sell amount");
        require(_buyer != address(0), "Invalid buyer");
        IERC20(_tokenAddress).transferFrom(msg.sender, address(this), _amount);
        uint256 _orderId = orderSells.length;
        OrderSell memory createdOrder = OrderSell({
            id: _orderId,
            tokenAddress: _tokenAddress,
            seller: msg.sender,
            buyer: _buyer,
            amount: _amount,
            deadline: block.timestamp + timeoutPeriod,
            status: _NEW
        });
        orderSells.push(createdOrder);
        emit OrderCreated(msg.sender, _buyer, _tokenAddress, _orderId);
    }

    function cancelOrderSell(uint256 orderId)
        external
        onlyOrderSeller(orderId)
        onlyNewOrder(orderId)
        onlyExpired(orderId)
    {
        OrderSell storage order = orderSells[orderId];
        order.status = _CANCELLED;
        IERC20(order.tokenAddress).transfer(order.seller, order.amount);
        emit OrderCancelled(order.seller, order.buyer, orderId);
    }

    function confirmPayOrderSell(uint256 orderId)
        external
        onlyOrderBuyer(orderId)
        onlyNewOrder(orderId)
    {
        OrderSell storage order = orderSells[orderId];
        order.status = _PAID;
        emit OrderPayConfirmed(order.seller, order.buyer, orderId);
    }

    function appealOrderSell(uint256 orderId)
        external
        onlyOrderBuyerOrSeller(orderId)
        onlyPaidOrder(orderId)
    {
        OrderSell storage order = orderSells[orderId];
        order.status = _APPEALED;
        emit OrderAppealed(order.seller, order.buyer, orderId);
    }

    function handleAppealOrder(uint256 orderId, address rightAccount)
        external
        onlyAdmin
        onlyAppealedOrder(orderId)
    {
        OrderSell storage order = orderSells[orderId];
        require(
            order.seller == rightAccount || order.buyer == rightAccount,
            "Invalid right accounts"
        );

        IERC20(order.tokenAddress).transfer(rightAccount, order.amount);

        order.status = _FAILED;
        emit OrderAppealHandled(
            order.seller,
            order.buyer,
            orderId,
            rightAccount,
            msg.sender
        );
    }

    function releaseToken(uint256 orderId)
        external
        onlyOrderSeller(orderId)
        onlyPaidOrder(orderId)
    {
        OrderSell storage order = orderSells[orderId];

        (uint256 transferredAmount, uint256 collectedFee) = deductFee(
            order.tokenAddress,
            order.amount
        );

        IERC20(order.tokenAddress).transfer(order.buyer, transferredAmount);

        order.status = _COMPLETED;
        emit OrderCompleted(order.seller, order.buyer, orderId, collectedFee);
    }

    function setTimeoutPeriod(uint256 newTimeoutPeriod) external onlyRootAdmin {
        uint256 oldDeadlineInterval = timeoutPeriod;
        timeoutPeriod = newTimeoutPeriod;
        emit TimeoutPeriodUpdated(oldDeadlineInterval, newTimeoutPeriod);
    }

    function setFee(uint256 newFee) external onlyRootAdmin {
        _setFee(newFee);
    }

    function setFeeClaimer(address newFeeClaimer) external onlyRootAdmin {
        _setFeeClaimer(newFeeClaimer);
    }

    function confirmPayTrustedOrder(
        address _tokenAddress,
        address _seller,
        uint256 _amount,
        address _buyer
    ) external onlyAdmin {
        uint256 _orderId = orderSells.length;
        OrderSell memory createdOrder = OrderSell({
            id: _orderId,
            tokenAddress: _tokenAddress,
            seller: _seller,
            buyer: _buyer,
            amount: _amount,
            deadline: block.timestamp,
            status: _COMPLETED
        });
        orderSells.push(createdOrder);

        (uint256 transferredAmount, uint256 collectedFee) = deductFee(
            createdOrder.tokenAddress,
            createdOrder.amount
        );

        IERC20(_tokenAddress).transferFrom(_seller, _buyer, transferredAmount);

        emit OrderCreated(msg.sender, _buyer, _tokenAddress, _orderId);
        emit OrderCompleted(
            createdOrder.seller,
            createdOrder.buyer,
            _orderId,
            collectedFee
        );
    }
}
