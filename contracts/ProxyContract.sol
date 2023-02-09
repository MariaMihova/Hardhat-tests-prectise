// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
// import "./Faucet.sol";

interface FaucetInterface {

  function withdrawAll() external;
  function destroyFaucet() external;
  
}


contract ProxyContract {

  address public foucetAddress;

  constructor(address _foucetAddress){
    foucetAddress = _foucetAddress;
  }


  function attemptNonOwnerToCallWithdrawAll() public {
    FaucetInterface(foucetAddress).withdrawAll();
  }

  function attemptNonOwnerToCallDestroyFaucet() public {
    FaucetInterface(foucetAddress).destroyFaucet();
  }
}