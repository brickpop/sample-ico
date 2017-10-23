pragma solidity ^0.4.15;

import "./util/MiniMeToken.sol";

contract XTK is MiniMeToken {
  // @dev XTK constructor just parametrizes the MiniMeToken constructor
  function XTK(
    address _tokenFactory
  ) MiniMeToken(
    _tokenFactory,
    0x0,                    // no parent token
    0,                      // no snapshot block number from parent
    "Tvrbo Token", // Token name
    18,                     // Decimals
    "XTK",                  // Symbol
    true                    // Enable transfers
    ) {;}
}
