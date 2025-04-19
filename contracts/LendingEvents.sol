// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract LendingEvents {

    event Deposit(address indexed _user, address indexed _asset, uint256 _amount);
    event Withdraw(address indexed _user, address indexed _asset, uint256 _amount);
    event Borrow(address indexed _user, address indexed _asset, uint256 _amount);
    event Liquidation(address indexed borrower, address indexed liquidator, address indexed debtAsset,  address collateralAsset, uint256 repayAmount, uint256 collateralAmount);


}
