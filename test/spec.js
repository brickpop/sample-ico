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
  var MiniMeTokenFactory, MiniMeToken, TvrboTokenSale;
  var tokenFactoryInstance, tvrboTokenInstance, tokenSaleInstance;
  var tokenFactoryAddress, tokenAddress, tokenSaleAddress;

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
    MiniMeTokenFactory = wrapContract(minimeContracts.MiniMeTokenFactory.abi, minimeContracts.MiniMeTokenFactory.byteCode);
    MiniMeToken = wrapContract(minimeContracts.MiniMeToken.abi, minimeContracts.MiniMeToken.byteCode);
    TvrboTokenSale = wrapContract(saleContract.TvrboTokenSale.abi, saleContract.TvrboTokenSale.byteCode);

    // TOKEN FACTORY
    tokenFactoryInstance = await MiniMeTokenFactory.new();
    assert.ok(tokenFactoryInstance.$address, "tokenFactoryInstance should have an address");
    tokenFactoryAddress = tokenFactoryInstance.$address;

    // TOKEN ITSELF
    tvrboTokenInstance = await MiniMeToken.new(tokenFactoryInstance.$address,
      0,
      0,
      'Tvrbo Token',
      18,
      'XTK',
      true);

    assert.ok(tvrboTokenInstance.$address, "tvrboTokenInstance should have an address");
    tokenAddress = tvrboTokenInstance.$address;

    // TOKEN SALE CAMPAIGN
    const _startFundingTime = Date.now() - 1000 * 60;
    const _endFundingTime = Date.now() + 1000 * 60 * 60 * 60 * 60;
    const _maximumFunding = ethTx.getCurrentWeb3().utils.toWei("10", "ether");
    const _vaultAddress = accounts[0];
    const _tokenAddress = tvrboTokenInstance.$address;

    tokenSaleInstance = await TvrboTokenSale.new(_startFundingTime,
      _endFundingTime,
      _maximumFunding,
      _vaultAddress,
      _tokenAddress);

    assert(tokenSaleInstance.$address, "tokenSaleInstance should have an address");
    tokenSaleAddress = tokenSaleInstance.$address;
  });

  it("should have propper default values", async () => {
    assert(0 == await tvrboTokenInstance.balanceOf(accounts[0]).call());
    assert(0 == await tvrboTokenInstance.balanceOf(accounts[1]).call());
    assert(0 == await tvrboTokenInstance.balanceOf(accounts[2]).call());
    assert(0 == await tvrboTokenInstance.balanceOf(accounts[3]).call());
    assert(0 == await tvrboTokenInstance.balanceOf(accounts[4]).call());
    assert(0 == await tvrboTokenInstance.balanceOf(accounts[5]).call());
    assert(0 == await tvrboTokenInstance.balanceOf(accounts[6]).call());
    assert(0 == await tvrboTokenInstance.balanceOf(accounts[7]).call());
    assert(0 == await tvrboTokenInstance.balanceOf(accounts[8]).call());
    assert(0 == await tvrboTokenInstance.balanceOf(accounts[9]).call());

    assert(0 == await tvrboTokenInstance.balanceOfAt(accounts[0], 0).call());
    assert(0 == await tvrboTokenInstance.balanceOfAt(accounts[1], 0).call());
    assert(0 == await tvrboTokenInstance.balanceOfAt(accounts[2], 0).call());
    assert(0 == await tvrboTokenInstance.balanceOfAt(accounts[3], 0).call());
    assert(0 == await tvrboTokenInstance.balanceOfAt(accounts[4], 0).call());
    assert(0 == await tvrboTokenInstance.balanceOfAt(accounts[5], 0).call());
    assert(0 == await tvrboTokenInstance.balanceOfAt(accounts[6], 0).call());
    assert(0 == await tvrboTokenInstance.balanceOfAt(accounts[7], 0).call());
    assert(0 == await tvrboTokenInstance.balanceOfAt(accounts[8], 0).call());
    assert(0 == await tvrboTokenInstance.balanceOfAt(accounts[9], 0).call());

    var collected = await tokenSaleInstance.totalCollected().call();
    assert(0 == parseInt(collected));
  })

  it("should attach to the deployed contracts", async () => {
    const factInstance = new MiniMeTokenFactory(tokenFactoryAddress);
    const tokInstance = new MiniMeToken(tokenAddress);
    const saleInstance = new TvrboTokenSale(tokenSaleAddress);

    assert(0 == await tokInstance.balanceOf(accounts[0]).call());
    assert(0 == await tokInstance.balanceOf(accounts[1]).call());
    assert(0 == await tokInstance.balanceOf(accounts[2]).call());
    assert(0 == await tokInstance.balanceOf(accounts[3]).call());
    assert(0 == await tokInstance.balanceOf(accounts[4]).call());
    assert(0 == await tokInstance.balanceOf(accounts[5]).call());
    assert(0 == await tokInstance.balanceOf(accounts[6]).call());
    assert(0 == await tokInstance.balanceOf(accounts[7]).call());
    assert(0 == await tokInstance.balanceOf(accounts[8]).call());
    assert(0 == await tokInstance.balanceOf(accounts[9]).call());

    assert(0 == await tokInstance.balanceOfAt(accounts[0], 0).call());
    assert(0 == await tokInstance.balanceOfAt(accounts[1], 0).call());
    assert(0 == await tokInstance.balanceOfAt(accounts[2], 0).call());
    assert(0 == await tokInstance.balanceOfAt(accounts[3], 0).call());
    assert(0 == await tokInstance.balanceOfAt(accounts[4], 0).call());
    assert(0 == await tokInstance.balanceOfAt(accounts[5], 0).call());
    assert(0 == await tokInstance.balanceOfAt(accounts[6], 0).call());
    assert(0 == await tokInstance.balanceOfAt(accounts[7], 0).call());
    assert(0 == await tokInstance.balanceOfAt(accounts[8], 0).call());
    assert(0 == await tokInstance.balanceOfAt(accounts[9], 0).call());

    assert(factInstance.$address == tokenFactoryAddress);
    assert(tokInstance.$address == tokenAddress);
    assert(saleInstance.$address == tokenSaleAddress);

    assert(await saleInstance.totalCollected().call() == await tokenSaleInstance.totalCollected().call());
  })

  it("should allow to invest", async () => {throw new Error("unimplemented")})
  it("should assign the right amount of tokens", async () => {throw new Error("unimplemented")})
  it("should update the totalCollected amount", async () => {throw new Error("unimplemented")})
  it("should not allow to end the funding yet", async () => {throw new Error("unimplemented")})
  it("should restrict owner-only actions", async () => {throw new Error("unimplemented")})
  it("should allow transfers", async () => {throw new Error("unimplemented")})
  it("should allow approvals", async () => {throw new Error("unimplemented")})
  it("the destination valut should receive the funds", async () => {throw new Error("unimplemented")})
  it("should have the right vault address", async () => {throw new Error("unimplemented")})
  it("should allow to change the vault address if owner", async () => {throw new Error("unimplemented")})
});
