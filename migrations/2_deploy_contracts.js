// var ConvertLib = artifacts.require("./ConvertLib.sol");
// var MetaCoin = artifacts.require("./MetaCoin.sol");
var MiniMeTokenFactory = artifacts.require("MiniMeTokenFactory");
var TTK = artifacts.require("TTK");
var TvrboTokenSale = artifacts.require("TvrboTokenSale");

module.exports = function(deployer, network, accounts) {
  // deployer.deploy(ConvertLib);
  // deployer.link(ConvertLib, MetaCoin);
  // deployer.deploy(MetaCoin);

  var tokenFactory, minimeToken, campaign;

  // Deploy the factory
  deployer.deploy(MiniMeTokenFactory)
  .then(() => MiniMeTokenFactory.deployed())
  .then(instance => {

    tokenFactory = instance;

    // Deploy the token contract
    return deployer.deploy(TTK, tokenFactory.address).then(() => TTK.deployed());
  })
  .then(instance => {

    minimeToken = instance;

    // Deploy the campaign
    const _startFundingTime = 0;
    const _endFundingTime = Date.now() + 1000 * 60 * 60 * 60 * 60;
    const _maximumFunding = 10000000000000000000; // 10 ether
    const _vaultAddress = accounts[0];
    const _tokenAddress = minimeToken.address;

    return deployer.deploy(TvrboTokenSale, _startFundingTime, _endFundingTime, _maximumFunding, _vaultAddress, _tokenAddress)
    .then(() => TvrboTokenSale.deployed());
  })
  .then(instance => {
    campaign = instance;

    // minimeToken.changeController(campaign.address);
    minimeToken.changeController(accounts[0]);
  })
  .catch(console.log);

};
