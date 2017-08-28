pragma solidity ^0.4.10;

import './Owned.sol';

contract Splitter is Owned {

    mapping(address => uint) public balances;

    event LogMoneyTransfer(
        address sender,
        address recipientOne,
        address recipientTwo,
        uint amount
    );

    event LogMoneyWithdrawal(
    	address sender,
    	uint amount
    );

    function sendMoney(address recipientOne, address recipientTwo)
        public
        payable
        returns (bool success) {

          /* require a positive amount */
          require(msg.value > 0);
          require(recipientOne != 0);
          require(recipientTwo != 0);

          uint totalSenderAmount = msg.value;

          /* If odd, the sender keeps the remainder */
          if (totalSenderAmount & 1 == 1) {
              totalSenderAmount -= 1;
              balances[msg.sender]++;
          }

          uint amountToSend =  totalSenderAmount / 2;

          balances[recipientOne] += amountToSend;
          balances[recipientTwo] += amountToSend;

          LogMoneyTransfer(
              msg.sender,
              recipientOne,
              recipientTwo,
              amountToSend
          );

          return true;
    }

    function withdrawFunds()
    	public
    	returns (bool success) {
    		require(balances[msg.sender] > 0);
        uint balance = balances[msg.sender];
        balances[msg.sender] = 0;
    		msg.sender.transfer(balance);
        LogMoneyWithdrawal(msg.sender, balance);
        return true;
    }

    function kill() returns (bool success) {
        require(msg.sender == owner);
        selfdestruct(owner);
        return true;
    }
}
