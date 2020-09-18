pragma solidity ^0.4.24;

import "../../node_modules/openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "../../node_modules/openzeppelin-solidity/contracts/ownership/Ownable.sol";

/**
 * This is intended to be used for testing integration between the Marketplace
 * and other ERC20 tokens
 */

contract MockOUSD is StandardToken, Ownable {
    string public name;
    string public symbol;
    uint8 public decimals;

    constructor(string _name, string _symbol, uint8 _decimals, uint _supply) public {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply_ = _supply;
        balances[msg.sender] = _supply;
        owner = msg.sender;
    }
}
