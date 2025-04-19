// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract LendingStorage {

    uint256 public constant COLATERAL_FACTOR = 80;
    uint256 public constant FACTOR_DENOMINATOR = 100;

    uint256 public constant LIQUIDATION_THRESHOLD = 1e18;
    uint256 public constant LIQUIDATION_BONUS = 5;
    uint256 public constant BONUS_DOMINATOR = 100;
    uint256 public constant INTEREST_RATE_PER_YEAR = 10e16;

    address[] public supportedAssets;

    mapping(address => mapping(address => uint256)) public userBalances;
    mapping(address => mapping(address => uint256)) public userBorrows;
    mapping(address => uint256) public assetPrices;
    mapping(address => mapping(address => uint256)) public lastBorrowTimestamp;



}