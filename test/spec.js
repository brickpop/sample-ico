const fs = require('fs');
const path = require('path');
const TestRPC = require('ethereumjs-testrpc');
const assert = require('chai').assert;
const ethTx = require("eth-tx");

const { connect, getAccounts, compileTo, wrapContract } = ethTx;

describe('Tvrbo Token Test', () => {
  var testrpc;
  var accounts;
  var minimeContracts, saleContract;

  before(async () => {
    testrpc = TestRPC.server({
      ws: true,
      gasLimit: 5800000,
      total_accounts: 10,
    });

    testrpc.listen(8545, '127.0.0.1');

    await connect('http://localhost:8545');
    accounts = await getAccounts();
  });

  after((done) => {
    testrpc.close();
    done();
  });

  // TESTS

  it("should compile the contracts", async () => {
    const tokenFactorySrcFile = path.join(__dirname, "..", "contracts", "util", "MiniMeTokenFactory.sol");
    // const tokenSrcFile = path.join(__dirname, "..", "contracts", "util", "MiniMeToken.sol");
    const saleSrcFile = path.join(__dirname, "..", "contracts", "TvrboTokenSale.sol");

    const tokenFactoryDestination = path.join(__dirname, "..", "build", "token-factory.js");
    // const tokenDestination = path.join(__dirname, "..", "build", "token.js");
    const saleDestination = path.join(__dirname, "..", "build", "token-sale.js");

    if (!fs.existsSync(path.dirname(tokenFactoryDestination)))
      fs.mkdirSync(path.dirname(tokenFactoryDestination));

    await compileTo(tokenFactorySrcFile, tokenFactoryDestination, {});
    // await compileTo(tokenSrcFile, tokenDestination, {});
    await compileTo(saleSrcFile, saleDestination, {});

    assert(fs.existsSync(tokenFactoryDestination));
    assert(fs.existsSync(saleDestination));
  }).timeout(60000);

  it("should import the contract's data", () => {
    minimeContracts = require(path.join(__dirname, "..", "build", "token-factory.js"));
    saleContract = require(path.join(__dirname, "..", "build", "token-sale.js"));

    assert.ok(minimeContracts.MiniMeTokenFactory);
    assert.ok(minimeContracts.MiniMeToken);
    assert.ok(saleContract.TvrboTokenSale);
  });

  it('should deploy all the contracts', async () => {
    const MiniMeTokenFactory = wrapContract(minimeContracts.MiniMeTokenFactory.abi, minimeContracts.MiniMeTokenFactory.byteCode);
    const MiniMeToken = wrapContract(minimeContracts.MiniMeToken.abi, minimeContracts.MiniMeToken.byteCode);
    const TvrboTokenSale = wrapContract(saleContract.TvrboTokenSale.abi, saleContract.TvrboTokenSale.byteCode);

    // TOKEN FACTORY
    const tokenFactory = await MiniMeTokenFactory.new();
    assert.ok(tokenFactory.$address);

    // TOKEN ITSELF
    const tvrboToken = await MiniMeToken.new(tokenFactory.$address,
      0,
      0,
      'Tvrbo Token',
      18,
      'XTK',
      true);

    assert.ok(tvrboToken.$address);

    // TOKEN SALE CAMPAIGN
    const _startFundingTime = Date.now() - 1000 * 60;
    const _endFundingTime = Date.now() + 1000 * 60 * 60 * 60 * 60;
    const _maximumFunding = ethTx.getCurrentWeb3().utils.toWei("10", "ether");
    const _vaultAddress = accounts[0];
    const _tokenAddress = tvrboToken.$address;

    const tokenSale = await TvrboTokenSale.new(_startFundingTime,
      _endFundingTime,
      _maximumFunding,
      _vaultAddress,
      _tokenAddress);

      assert(tokenSale.$address);
  }).timeout(20000);
});
