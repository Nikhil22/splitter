var Splitter = artifacts.require("./Splitter.sol");

contract('Splitter', function(accounts) {
  let instance;

  beforeEach(() => {
      return Splitter.new().then(thisInstance => {
          instance = thisInstance;
      });
  });

  it("should send money in a 50/50 split if even", () => {
    const sent = 10;
    const half = sent / 2;

    return instance.sendMoney(
      accounts[1],
      accounts[2],
      { from: accounts[0], value: sent }
    )
      .then(tx => {
        return instance.balances(accounts[1]);
      })
      .then(balance => {
        assert.equal(balance, half, "account 1's balance is not half of amount sent");
        return instance.balances(accounts[2]);
      })
      .then(balance => {
        assert.equal(balance, half, "account 2's balance is not half of amount sent");
        return;
      });
    });

    it("should send money in a 50/50 split - 1 if odd, and give the remaining to the sender", () => {
      const sent = 11;
      const half = (sent - 1) / 2;

      return instance.sendMoney(
        accounts[1],
        accounts[2],
        { from: accounts[0], value: sent }
      )
        .then(tx => {
          return instance.balances(accounts[0]);
        })
        .then(balance => {
          assert.equal(balance, 1, "sender's balance is 1");
          return instance.balances(accounts[1]);
        })
        .then(balance => {
          assert.equal(balance, half, "account 1's balance is not half of amount sent");
          return instance.balances(accounts[2]);
        })
        .then(balance => {
          assert.equal(balance, half, "account 2's balance is not half of amount sent");
          return;
        });
    });


    it("should allow withdrawals", () => {
        const beforeEthBalance = web3.eth.getBalance(accounts[1]);
        const sent = 4;
        const half = sent / 2;
        const gasPrice = 10;

        return instance.sendMoney(accounts[1], accounts[2], {from: accounts[0], value: sent}).then(tx => {
            return instance.balances(accounts[1]);
        }).then(balance => {
            assert.equal(balance, half, "account 1's balance is not half of amount sent");
            return instance.withdrawFunds({from: accounts[1], gasPrice: gasPrice});
        }).then(tx => {
            const weiUsed = tx.receipt.gasUsed * gasPrice;
            assert.deepEqual(beforeEthBalance.minus(weiUsed).plus(web3.toBigNumber(half)), web3.eth.getBalance(accounts[1]),
                "account 1's wei balance did not increase by half of amount sent");
            return instance.balances(accounts[1]);
        }).then(balance => {
            assert.equal(balance, 0, "account 1's contract balance is not 0 after withdrawing");
        });
    });

});
