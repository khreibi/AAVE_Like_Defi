// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./LendingStorage.sol";

abstract contract LendingLogic is LendingStorage {

    function _accrueInterest(address _user, address _asset) internal {
        uint256 principal = userBorrows[_user][_asset];
        if( principal == 0) return;

        uint256 last = lastBorrowTimestamp[_user][_asset];
        if(last == 0) return;

        uint256 elapsed = block.timestamp - last;
        if(elapsed == 0) return;

        uint256 interest = (principal * INTEREST_RATE_PER_YEAR * elapsed) / (365 days * 1e18);
        userBorrows[_user][_asset] += interest;

        lastBorrowTimestamp[_user][_asset] = block.timestamp;
    }
}