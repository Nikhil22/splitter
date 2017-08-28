var Splitter = artifacts.require("./Splitter.sol");

function promisify(inner) {
  return new Promise((resolve, reject) =>
    inner((err, res) => {
      err ? reject(err) : resolve(res);
    })
  );
}

var getEventsPromise = function (myFilter, count) {
  return new Promise(function (resolve, reject) {
    count = count ? count : 1;
    var results = [];
    myFilter.watch(function (error, result) {
      if (error) {
        reject(error);
      } else {
        count--;
        results.push(result);
      }
      if (count <= 0) {
        resolve(results);
        myFilter.stopWatching();
      }
    });
  });
};

contract('Splitter', function(accounts) {
  let instance;

  beforeEach(() => {
      return Splitter.new().then(thisInstance => {
          instance = thisInstance;
      });
  });

  it("should send money in a 50/50 split if even", () => {
    const sent = 10;
    const half = 5;
    let balance;

    return instance.sendMoney(
      accounts[1],
      accounts[2],
      { from: accounts[0], value: sent }
    )
      .then(tx => {
        return instance.balances(accounts[1]);
      })
      .then(_balance => {
        balance = _balance;
        return getEventsPromise(instance.LogMoneyTransfer(
            accounts[0],
            accounts[1],
            accounts[2],
            sent
        ));
      })
      .then((event) => {
        const eventArgs = event[0].args;
        assert.equal(balance, half, "account 1's balance is not half of amount sent");
        assert.equal(eventArgs.sender.valueOf(), accounts[0], "should be sender");
	    	assert.equal(eventArgs.recipientOne.valueOf(), accounts[1], "should be the recipientOne");
	    	assert.equal(eventArgs.recipientTwo.valueOf(), accounts[2], "should be the recipientTwo");
        assert.equal(eventArgs.amount.valueOf(), half, "should be the sent amount");
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
      let balance;

      return instance.sendMoney(
        accounts[1],
        accounts[2],
        { from: accounts[0], value: sent }
      )
        .then(tx => {
          return instance.balances(accounts[0]);
        })
        .then(_balance => {
          balance = _balance;
          return getEventsPromise(instance.LogMoneyTransfer(
              accounts[0],
              accounts[1],
              accounts[2],
              sent
          ));
        })
        .then(event => {
          const eventArgs = event[0].args;
          assert.equal(balance, 1, "sender's balance is 1");
          assert.equal(eventArgs.sender.valueOf(), accounts[0], "should be sender");
          assert.equal(eventArgs.recipientOne.valueOf(), accounts[1], "should be the recipientOne");
          assert.equal(eventArgs.recipientTwo.valueOf(), accounts[2], "should be the recipientTwo");
          assert.equal(eventArgs.amount.valueOf(), half, "should be the sent amount");
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


    it("should allow withdrawals", (done) => {
        let beforeEthBalance;
        let newBalance;
        let tx;
        const sent = 4;
        const half = sent / 2;
        const gasPrice = 10;

        promisify((cb) => web3.eth.getBalance(accounts[1], cb))
          .then(balance => {
            beforeEthBalance = balance;
            return;
          })
          .then(() => {
            instance.sendMoney(accounts[1], accounts[2], {from: accounts[0], value: sent}).then(tx => {
                return instance.balances(accounts[1]);
            }).then(balance => {
                assert.equal(balance, half, "account 1's balance is not half of amount sent");
                return instance.withdrawFunds({from: accounts[1], gasPrice: gasPrice});
            }).then((_tx) => {
              tx = _tx;
              return promisify((cb) => web3.eth.getBalance(accounts[1], cb));
            })
            .then(balance => {
              newBalance = balance;
              return;
            })
            .then(() => {
                const weiUsed = tx.receipt.gasUsed * gasPrice;
                assert.deepEqual(beforeEthBalance.minus(weiUsed).plus(web3.toBigNumber(half)), newBalance,
                    "account 1's wei balance did not increase by half of amount sent");
                return instance.balances(accounts[1]);
            }).then(balance => {
                assert.equal(balance, 0, "account 1's contract balance is not 0 after withdrawing");
                done();
            }).catch(done)
          })
    });

});
