var Splitter = artifacts.require("./Splitter.sol");
var Owned = artifacts.require("./Owned.sol");

module.exports = function(deployer) {
  deployer.deploy(Splitter);
  deployer.deploy(Owned);
};
