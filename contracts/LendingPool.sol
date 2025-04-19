// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./LendingLogic.sol";
import "./LendingStorage.sol";
import "./LendingErrors.sol";
import "./LendingEvents.sol";

contract LendingPool is Ownable, LendingStorage, LendingLogic, LendingEvents  {

    constructor(address _dai) Ownable(msg.sender) {
        supportedAssets.push(_dai);
    }

    modifier greaterThenZero(uint256 _amount){
        if(_amount == 0) revert AmountCantBeZero();
        _;
    }

    function setAssetPrice(address _asset, uint256 _priceInUsd) external onlyOwner {
        assetPrices[_asset] = _priceInUsd;
    }

    function addSupportedAsset(address _asset) external onlyOwner {
        for (uint i = 0; i < supportedAssets.length; i++) {
            if (supportedAssets[i] == _asset) {
                return; // Already supported
            }
        }
        supportedAssets.push(_asset);
    }  

    function getAccountData(address _user) public view returns (uint256 totalCollateralUsd, uint256 totalBorrowedUsd, uint256 healthFactor){

        for(uint256 i=0; i < supportedAssets.length; i++){
            address asset = supportedAssets[i];
            uint256 price = assetPrices[asset];


            uint256 deposited = userBalances[_user][asset];
            if( deposited > 0){
                totalCollateralUsd += deposited * price /1e18;
            }
        
            uint256 borrowed = getAccruedDebt(_user, asset);
            if( borrowed > 0) {
                totalBorrowedUsd += borrowed * price /1e18; 
            }
        }  

        if(totalBorrowedUsd == 0){
            healthFactor = type(uint256).max;
        }else{
            healthFactor = (totalCollateralUsd * COLATERAL_FACTOR / FACTOR_DENOMINATOR)*1e18 / totalBorrowedUsd;
        }

        return (totalCollateralUsd, totalBorrowedUsd, healthFactor);
    }

    function deposit(address _asset, uint256 _amount) external greaterThenZero(_amount){
        IERC20 token = IERC20(_asset);
        bool success = token.transferFrom(msg.sender, address(this), _amount);
        if(!success) revert TransferFailed();
        userBalances[msg.sender][_asset] += _amount;
        emit Deposit(msg.sender, _asset, _amount);
    }


    function withdraw(address _asset, uint256 _amount) external greaterThenZero(_amount) {
        uint256 userBalance = userBalances[msg.sender][_asset];
        if (userBalance < _amount) revert InsufficientBalance();
        
        userBalances[msg.sender][_asset] -= _amount;

        (,, uint256 newHealthFactor) = getAccountData(msg.sender);
        if(newHealthFactor < LIQUIDATION_THRESHOLD){
            userBalances[msg.sender][_asset] += _amount; //rollback
            revert InsufficientCollateral();
        }

        IERC20 token = IERC20(_asset);
        bool success = token.transfer(msg.sender, _amount);
        if(!success) revert TransferFailed();
        emit Withdraw(msg.sender, _asset, _amount);
    }

    function borrow(address _asset, uint256 _amount) external greaterThenZero(_amount) {

        uint256 poolBalance = IERC20(_asset).balanceOf(address(this));
        if(poolBalance < _amount) revert InsufficientBalance();

        _accrueInterest(msg.sender, _asset); // Accrue interest before adding new debt  
        if (lastBorrowTimestamp[msg.sender][_asset] == 0) {
            lastBorrowTimestamp[msg.sender][_asset] = block.timestamp;
        }      
        userBorrows[msg.sender][_asset]+= _amount;
        (,, uint256 healthFactor) = getAccountData(msg.sender);
        if(healthFactor < LIQUIDATION_THRESHOLD){
            userBorrows[msg.sender][_asset] -= _amount; //rollback
            revert InsufficientCollateral();
        }

        IERC20 token = IERC20(_asset);
        bool success =  token.transfer(msg.sender, _amount);
        if (!success) revert TransferFailed();

        emit Borrow(msg.sender, _asset, _amount);
    }

    function liquidate(address _borrower, address _debtAsset, address _colatteralAsset, uint256 _repayAmount) external {
         _accrueInterest(_borrower, _debtAsset); // Ensure up-to-date debt
        (,, uint256 healthFactor) = getAccountData(_borrower); 
        if(healthFactor >= LIQUIDATION_THRESHOLD) revert NotEligibelForLiquidation();

        _repayDebt(_debtAsset, _repayAmount);
        _reduceBorrow(_borrower, _debtAsset, _repayAmount);


        uint256 collateralAmount = _calculateCollateralToSeize(_debtAsset, _colatteralAsset, _repayAmount);

        _seizeCollateral(_borrower, _colatteralAsset, collateralAmount);
        emit Liquidation(_borrower, msg.sender, _debtAsset, _colatteralAsset, _repayAmount, collateralAmount);
        
    }


    function _repayDebt(address _asset, uint256 _amount) private {
        bool ok = IERC20(_asset).transferFrom(msg.sender, address(this), _amount);
        if(!ok) revert TransferFailed();
    }

    function _reduceBorrow(address _user, address _asset, uint256 _amount) private {
        userBorrows[_user][_asset] -= _amount;
    }

    function _calculateCollateralToSeize(
        address _debtAsset,
        address _collateralAsset,
        uint256 _repayAmount
    ) private view returns (uint256){

        uint256 priceDebt = assetPrices[_debtAsset];
        uint256 priceCollateral = assetPrices[_collateralAsset];
        
        uint256 repayUsd = _repayAmount * priceDebt / 1e18;
        uint256 bonusUsd = repayUsd * LIQUIDATION_BONUS / BONUS_DOMINATOR;
        uint256 totalUsd = repayUsd + bonusUsd;

        return totalUsd * 1e18 / priceCollateral;
    }

    function _seizeCollateral(address _borrower, address _asset, uint256 _amount) private {
        uint256 collateralBalance = userBalances[_borrower][_asset];
        if(collateralBalance < _amount) revert InsufficientCollateral();

        userBalances[_borrower][_asset] -= _amount;
        bool ok = IERC20(_asset).transfer(msg.sender, _amount);
        if(!ok) revert TransferFailed();
    }



    function getAccruedDebt(address _user, address _asset) public view returns (uint256){
        uint256 principal = userBorrows[_user][_asset];
        if (principal == 0) return 0;

        uint256 lastTimestamp = lastBorrowTimestamp[_user][_asset];
        if(lastTimestamp == 0 || block.timestamp <= lastTimestamp) return principal;

        uint256 timeElapsed = block.timestamp - lastTimestamp;

        uint256 interest = (principal * INTEREST_RATE_PER_YEAR * timeElapsed) /(365 days * 1e18);

        return principal + interest;
    }

}