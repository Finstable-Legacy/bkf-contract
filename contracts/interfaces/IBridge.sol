//SPDX-License-Identifier: Unlicense
pragma solidity >=0.5.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBridge {
    function bridge(
        IERC20 _token,
        uint256 _amount,
        uint256 _destChainID,
        address _to
    ) external;
}
