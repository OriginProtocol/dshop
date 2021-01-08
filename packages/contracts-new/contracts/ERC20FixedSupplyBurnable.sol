// contracts/ERC20FixedSupplyBurnable.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import '@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol';

contract ERC20FixedSupplyBurnable is ERC20Burnable {
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) public ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
    }
}
