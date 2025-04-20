// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract LendingEvents {

    event Deposit(address indexed _user, address indexed _asset, uint256 _amount);
    event Withdraw(address indexed _user, address indexed _asset, uint256 _amount);
    event Borrow(address indexed _user, address indexed _asset, uint256 _amount);
    event Liquidation(address indexed _borrower, address indexed _liquidator, address indexed _debtAsset,  address _collateralAsset, uint256 _repayAmount, uint256 _collateralAmount);
    event Repay(address indexed _user, address indexed _asset, uint256 _amount);

}
