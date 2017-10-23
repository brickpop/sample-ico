const fs = require('fs');
const path = require('path');
const TestRPC = require('ethereumjs-testrpc');
const assert = require('chai').assert;
const ethTx = require("eth-tx");

const { connect, getAccounts, compileTo, wrapContract } = ethTx;

describe('MiniMeToken test', () => {
  var testrpc;
  var accounts;
  var tfContract, tContract, sContract;

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
    const tokenSrcFile = path.join(__dirname, "..", "contracts", "util", "MiniMeToken.sol");
    const saleSrcFile = path.join(__dirname, "..", "contracts", "TvrboTokenSale.sol");

    const tokenFactoryDestination = path.join(__dirname, "..", "build", "token-factory.js");
    const tokenDestination = path.join(__dirname, "..", "build", "token.js");
    const saleDestination = path.join(__dirname, "..", "build", "sale.js");

    if (!fs.existsSync(path.dirname(tokenFactoryDestination)))
      fs.mkdirSync(path.dirname(tokenFactoryDestination));

    await compileTo(tokenFactorySrcFile, tokenFactoryDestination, {});
    await compileTo(tokenSrcFile, tokenDestination, {});
    await compileTo(saleSrcFile, saleDestination, {});
  }).timeout(30000);

  it("should import the contract's data", () => {
    tfContract = require(path.join(__dirname, "..", "build", "token-factory.js"));
    tContract = require(path.join(__dirname, "..", "build", "token.js"));
    sContract = require(path.join(__dirname, "..", "build", "sale.js"));

    assert(!!tfContract.MiniMeTokenFactory);
    assert(!!tContract.MiniMeToken);
    assert(!!sContract.TvrboTokenSale);
  });

  // it('should deploy all the contracts', async () => {
  //   const factory = wrapContract();

  //   const tokenFactory = await MiniMeTokenFactory.new(web3);

  //   miniMeToken = await MiniMeToken.new(web3,
  //     tokenFactory.$address,
  //     0,
  //     0,
  //     'MiniMe Test Token',
  //     18,
  //     'MMT',
  //     true);
  //   assert.ok(miniMeToken.$address);
  //   miniMeTokenState = new MiniMeTokenState(miniMeToken);
  // }).timeout(20000);


});


