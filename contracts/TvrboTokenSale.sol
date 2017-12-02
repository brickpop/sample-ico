pragma solidity ^0.4.15;

import "./util/MiniMeToken.sol";
import "./util/Owned.sol";
import "./util/SafeMath.sol";

contract TvrboTokenSale is TokenController, Owned {
    uint public startFundingTime;       // In UNIX Time Format
    uint public endFundingTime;         // In UNIX Time Format
    uint public maximumFunding;         // In wei
    uint public totalCollected;         // In wei
    MiniMeToken public tokenContract;   // The token for this Token Sale
    address public vaultAddress;        // The address to hold the funds donated

    /// @notice 'TvrboTokenSale()' initiates the TvrboTokenSale by setting its funding
    /// parameters
    /// @dev There are several checks to make sure the parameters are acceptable
    /// @param _startFundingTime The UNIX time that the TvrboTokenSale will be able to
    /// start receiving funds
    /// @param _endFundingTime The UNIX time that the TvrboTokenSale will stop being able
    /// to receive funds
    /// @param _maximumFunding In wei, the Maximum amount that the TvrboTokenSale can
    /// receive
    /// @param _vaultAddress The address that will store the donated funds
    /// @param _tokenAddress Address of the token contract this contract controls

    function TvrboTokenSale(
        uint _startFundingTime,
        uint _endFundingTime,
        uint _maximumFunding,
        address _vaultAddress,
        address _tokenAddress
    ) public {
        require(_endFundingTime >= now);
        require(_endFundingTime > _startFundingTime);
        require(_maximumFunding <= 10000 ether);
        require(_vaultAddress != 0);

        startFundingTime = _startFundingTime;
        endFundingTime = _endFundingTime;
        maximumFunding = _maximumFunding;
        tokenContract = MiniMeToken(_tokenAddress);
        vaultAddress = _vaultAddress;
    }

    /// @dev The fallback function is called when ether is sent to the contract, it
    /// simply calls `processPayment()` with the address that sent the ether as the
    /// `_owner`. Payable is a required solidity modifier for functions to receive
    /// ether, without this modifier functions will throw if ether is sent to them

    function () public payable {
        processPayment(msg.sender);
    }

    ///////////////////////////////////////////////////////////////////////////
    // TokenController methods implementation
    ///////////////////////////////////////////////////////////////////////////

    /// @notice `proxyPayment()` allows the caller to send ether to the TvrboTokenSale and
    /// have the tokens created in an address of their choosing
    /// @param _owner The address that will hold the newly created tokens

    function proxyPayment(address _owner) public payable returns(bool) {
        processPayment(_owner);
        return true;
    }

    /// @notice Notifies the controller about a transfer, for this TvrboTokenSale all
    ///  transfers are allowed by default and no extra notifications are needed
    /// @param _from The origin of the transfer
    /// @param _to The destination of the transfer
    /// @param _amount The amount of the transfer
    /// @return False if the controller does not authorize the transfer

    function onTransfer(address _from, address _to, uint _amount) public returns(bool) {
        return true;
    }

    /// @notice Notifies the controller about an approval, for this TvrboTokenSale all
    ///  approvals are allowed by default and no extra notifications are needed
    /// @param _owner The address that calls `approve()`
    /// @param _spender The spender in the `approve()` call
    /// @param _amount The amount in the `approve()` call
    /// @return False if the controller does not authorize the approval

    function onApprove(address _owner, address _spender, uint _amount)
        public returns(bool)
    {
        return true;
    }

    /// @dev `processPayment()` is an internal function that sends the ether that this
    ///  contract receives to the `vault` and creates tokens in the address of the
    ///  `_owner` assuming the TvrboTokenSale is still accepting funds
    /// @param _owner The address that will hold the newly created tokens

    function processPayment(address _owner) internal {
        // First check that the TvrboTokenSale is allowed to receive this donation
        require(now >= startFundingTime);
        require(now <= endFundingTime);
        require(tokenContract.controller() != 0);
        require(msg.value != 0);
        require((totalCollected + msg.value) <= maximumFunding);

        //Track how much the TvrboTokenSale has collected
        totalCollected += msg.value;

        //Send the ether to the vault
        require (vaultAddress.send(msg.value));

        // Creates an equal amount of tokens as ether sent. The new tokens are created
        //  in the `_owner` address
        require (tokenContract.generateTokens(_owner, msg.value));

        return;
    }

    /// @notice `endFunding()` ends the TvrboTokenSale by calling setting the
    ///  controller to 0, thereby ending the issuance of new tokens and stopping the
    ///  TvrboTokenSale from receiving more ether
    /// @dev `endFunding()` can only be called after the end of the funding period.

    function endFunding() public {
        require(now >= endFundingTime);
        tokenContract.changeController(0);
    }

    /// @notice `onlyOwner` changes the location that ether is sent
    /// @param _newVaultAddress The address that will receive the ether sent to this
    ///  TvrboTokenSale
    function setDestinationVault(address _newVaultAddress) public onlyOwner {
        vaultAddress = _newVaultAddress;
    }
}
