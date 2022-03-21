// SPDX-License-Identifier: MIT
pragma solidity 0.8.11;

import "./abstracts/Admins.sol";
import "./abstracts/FeeCollector.sol";
import "./abstracts/BKNextCallHelper.sol";
import "./modules/KAP20/interfaces/IKAP20.sol";
import "./modules/KAP20/interfaces/IAdminKAP20Router.sol";
import "./modules/committee/Committee.sol";
import "./modules/kyc/KYCHandler.sol";
import "./modules/authorization/Authorization.sol";
import "./modules/transferRouter/TransferRouter.sol";

contract DealerKAP20 is
    Authorization,
    FeeCollector,
    Committee,
    KYCHandler,
    BKNextCallHelper,
    TransferRouter
{
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

    modifier onlyOrderSeller(uint256 orderId, address _sender) {
        address sender = msg.sender;
        if (msg.sender == callHelper) sender = _sender;
        require(orderSells[orderId].seller == sender, "must be order seller");
        _;
    }

    modifier onlyOrderBuyer(uint256 orderId, address _sender) {
        address sender = msg.sender;
        if (msg.sender == callHelper) sender = _sender;
        require(orderSells[orderId].buyer == sender, "must be order buyer");
        _;
    }

    modifier onlyOrderBuyerOrSeller(uint256 orderId, address _sender) {
        address sender = msg.sender;
        if (msg.sender == callHelper) sender = _sender;
        require(
            orderSells[orderId].buyer == sender ||
                orderSells[orderId].seller == sender,
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

    constructor(
        address _rootAdmin,
        address _feeClaimer,
        address _kyc,
        address _committee,
        address _transferRouter,
        address _callHelper,
        uint256 _acceptedKYCLevel
    )
        Admins(_rootAdmin)
        FeeCollector(_feeClaimer)
        BKNextCallHelper(_callHelper)
    {
        _setKYC(_kyc);
        _setAcceptedKYCLevel(_acceptedKYCLevel);
        _setTransferRouter(_transferRouter);

        committee = _committee;
    }

    /*** BK Next helpers ***/
    function requireKYC(address _sender) internal view {
        require(
            kyc.kycsLevel(_sender) >= acceptedKYCLevel,
            "only Bitkub Next user"
        );
    }

    function createOrderSell(
        address _tokenAddress,
        uint256 _amount,
        address _buyer,
        address _sender
    ) external {
        require(_amount > 0, "Invalid sell amount");
        require(_buyer != address(0), "Invalid buyer");
        if (msg.sender == callHelper) {
            requireKYC(_sender);
            transferRouter.transferFrom(
                PROJECT,
                _tokenAddress,
                _sender,
                address(this),
                _amount
            );
        } else {
            require(_sender == msg.sender, "Invalid sender");
            IKAP20(_tokenAddress).transferFrom(_sender, address(this), _amount);
        }
        uint256 _orderId = orderSells.length;
        OrderSell memory createdOrder = OrderSell({
            id: _orderId,
            tokenAddress: _tokenAddress,
            seller: _sender,
            buyer: _buyer,
            amount: _amount,
            deadline: block.timestamp + timeoutPeriod,
            status: _NEW
        });
        orderSells.push(createdOrder);
        emit OrderCreated(_sender, _buyer, _tokenAddress, _orderId);
    }

    function cancelOrderSell(uint256 _orderId, address _sender)
        external
        onlyOrderSeller(_orderId, _sender)
        onlyNewOrder(_orderId)
        onlyExpired(_orderId)
    {
        OrderSell storage order = orderSells[_orderId];
        order.status = _CANCELLED;
        IKAP20(order.tokenAddress).transfer(order.seller, order.amount);
        emit OrderCancelled(order.seller, order.buyer, _orderId);
    }

    function confirmPayOrderSell(uint256 _orderId, address _sender)
        external
        onlyOrderBuyer(_orderId, _sender)
        onlyNewOrder(_orderId)
    {
        OrderSell storage order = orderSells[_orderId];
        order.status = _PAID;
        emit OrderPayConfirmed(order.seller, order.buyer, _orderId);
    }

    function appealOrderSell(uint256 _orderId, address _sender)
        external
        onlyOrderBuyerOrSeller(_orderId, _sender)
        onlyPaidOrder(_orderId)
    {
        OrderSell storage order = orderSells[_orderId];
        order.status = _APPEALED;
        emit OrderAppealed(order.seller, order.buyer, _orderId);
    }

    function handleAppealOrder(
        uint256 _orderId,
        address _rightAccount,
        address _sender
    ) external onlyAppealedOrder(_orderId) {
        if (msg.sender == callHelper) {
            require(isAdmin[_sender] == _ADMIN, "must be admin");
        } else {
            require(isAdmin[msg.sender] == _ADMIN, "must be admin");
        }

        OrderSell storage order = orderSells[_orderId];
        require(
            order.seller == _rightAccount || order.buyer == _rightAccount,
            "Invalid right accounts"
        );

        IKAP20(order.tokenAddress).transfer(_rightAccount, order.amount);

        order.status = _FAILED;
        emit OrderAppealHandled(
            order.seller,
            order.buyer,
            _orderId,
            _rightAccount,
            _sender
        );
    }

    function releaseToken(uint256 _orderId, address _sender)
        external
        onlyOrderSeller(_orderId, _sender)
        onlyPaidOrder(_orderId)
    {
        OrderSell storage order = orderSells[_orderId];

        (uint256 transferredAmount, uint256 collectedFee) = deductFee(
            order.tokenAddress,
            order.amount
        );

        IKAP20(order.tokenAddress).transfer(order.buyer, transferredAmount);

        order.status = _COMPLETED;
        emit OrderCompleted(order.seller, order.buyer, _orderId, collectedFee);
    }

    function confirmPayTrustedOrder(
        address _tokenAddress,
        address _seller,
        uint256 _amount,
        address _buyer
    ) external {
        if (msg.sender == callHelper) {
            require(isAdmin[_buyer] == _ADMIN, "must be admin");
        } else {
            require(isAdmin[msg.sender] == _ADMIN, "must be admin");
        }

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

        transferRouter.externalTransfer(
            _tokenAddress,
            _tokenAddress,
            _seller,
            _buyer,
            transferredAmount,
            0
        );

        emit OrderCreated(_buyer, _buyer, _tokenAddress, _orderId);
        emit OrderCompleted(
            createdOrder.seller,
            createdOrder.buyer,
            _orderId,
            collectedFee
        );
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

    function setKYC(address _kyc) external onlyCommittee {
        _setKYC(_kyc);
    }

    function setAcceptedKYCLevel(uint256 _acceptedKYCLevel)
        external
        onlyCommittee
    {
        _setAcceptedKYCLevel(_acceptedKYCLevel);
    }

    function setTransferRouter(address _transferRouter) external onlyCommittee {
        _setTransferRouter(_transferRouter);
    }
}
