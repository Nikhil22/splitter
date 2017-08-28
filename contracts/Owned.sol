pragma solidity ^0.4.10;

contract Owned {

    address owner;

    function Owned() {
      owner = msg.sender;
    }
}
