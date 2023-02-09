const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");

describe("Faucet", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployContractAndSetVariables() {
    const Faucet = await ethers.getContractFactory("Faucet");
    const faucet = await Faucet.deploy({
      value: ethers.utils.parseEther("0.1"), // the constructor is payabl, so we pass value to transfer eht to the contract
    });

    const [owner] = await ethers.getSigners();

    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    const proxyContract = await ProxyContract.deploy(owner.address);

    let withdrawAmount = ethers.utils.parseUnits("1", "ether");
    let withdrawAmountLess = ethers.utils.parseUnits(".01", "ether");

    return {
      faucet,
      proxyContract,
      owner,
      withdrawAmount,
      withdrawAmountLess,
    };
  }

  it("should deploy and set the owner correctly", async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    expect(await faucet.owner()).to.equal(owner.address);
  });

  it("should not allow withdrawals above .1 ETH at a time", async function () {
    const { faucet, withdrawAmount } = await loadFixture(
      deployContractAndSetVariables
    );

    await expect(faucet.withdraw(withdrawAmount)).to.be.reverted;
  });

  it("should  allow withdraw  less or equal to .1 ETH at a time", async function () {
    const { faucet, owner, withdrawAmountLess } = await loadFixture(
      deployContractAndSetVariables
    );

    const contractBalanceBefore = await ethers.provider.getBalance(
      faucet.address
    );
    const ownerBalanceBefore = await ethers.provider.getBalance(owner.address);

    await expect(faucet.withdraw(withdrawAmountLess)).not.to.reverted;

    const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);
    const contractBalanceAfter = await ethers.provider.getBalance(
      faucet.address
    );

    expect(contractBalanceBefore.gt(contractBalanceAfter)).to.be.true;
    expect(ownerBalanceAfter.gt(ownerBalanceBefore)).to.be.true;
  });

  it("withdrawAll() function should reverted if called by diferent then contract owner address", async function () {
    const { faucet } = await loadFixture(deployContractAndSetVariables);

    await faucet.withdrawAll();
    const contractBalanceAfter = await ethers.provider.getBalance(
      faucet.address
    );

    expect(contractBalanceAfter.isZero()).to.be.true;
  });

  it("withdrawAll() function if called by contract owner shoud empty contract balance", async function () {
    const { proxyContract } = await loadFixture(deployContractAndSetVariables);

    await expect(proxyContract.attemptNonOwnerToCallWithdrawAll()).to.be
      .reverted;
  });

  it("destroyFaucet() function should reverted if called by diferent then contract owner address", async function () {
    const { proxyContract } = await loadFixture(deployContractAndSetVariables);

    await expect(proxyContract.attemptNonOwnerToCallDestroyFaucet()).to.be
      .reverted;
  });

  it("destroyFaucet() function should destroy the contract if called by the contract owner", async function () {
    const { faucet, owner } = await loadFixture(deployContractAndSetVariables);

    await expect(faucet.destroyFaucet()).not.to.reverted;
    const code = await ethers.provider.getCode(faucet.address); // we get the code to be sure it's equal to "0x"(no code)
    expect(code).to.equal("0x");
  });
});
