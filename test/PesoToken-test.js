const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const BigNumber = require("bignumber.js");

describe("Peso - Staking token", () => {
  let PesoToken, PesoTokenInstance;
  let owner, user1, user2;
  const manyTokens = BigNumber(10).pow(18).multipliedBy(1000);

  beforeEach(async () => {
    PesoToken = await ethers.getContractFactory("PesoToken");
    [owner, user1, user2] = await ethers.getSigners();
    PesoTokenInstance = await PesoToken.deploy(
      owner.address,
      manyTokens.toString(10)
    );
    await PesoTokenInstance.deployed();
  });

  describe("Stake", async () => {
    it("Should create a new stake", async () => {
      await PesoTokenInstance.transfer(user1.address, 3, {
        from: owner.address,
      });

      await PesoTokenInstance.connect(user1).createStake(1, {
        from: user1.address,
      });

      assert.equal(await PesoTokenInstance.balanceOf(user1.address), 2);
      assert.equal(await PesoTokenInstance.stakeOf(user1.address), 1);
      assert.equal(
        await PesoTokenInstance.totalSupply(),
        manyTokens.minus(1).toString(10)
      );
      assert.equal(await PesoTokenInstance.totalStakes(), 1);
    });

    it("Should remove stake and mint the given stakes", async () => {
      await PesoTokenInstance.transfer(user1.address, 3, {
        from: owner.address,
      });

      await PesoTokenInstance.connect(user1).createStake(3, {
        from: user1.address,
      });

      await PesoTokenInstance.connect(user1).removeStake(1, {
        from: user1.address,
      });

      assert.equal(await PesoTokenInstance.stakeOf(user1.address), 2);
      assert.equal(await PesoTokenInstance.balanceOf(user1.address), 1);
      assert.equal(
        await PesoTokenInstance.totalSupply(),
        manyTokens.minus(2).toString(10)
      );
      assert.equal(await PesoTokenInstance.totalStakes(), 2);
    });

    it("Should revert, insufficient balance to stake", async () => {
      await expect(
        PesoTokenInstance.connect(user1).createStake(1, {
          from: user1.address,
        })
      ).to.be.revertedWith("Insufficient balance to stake.");
    });

    it("Should return 0 totalStakes", async () => {
      assert.equal(await PesoTokenInstance.stakeOf(user1.address), 0);
    });
  });

  describe("Reward", async () => {
    it("Should calculate rewards to distribute", async () => {
      await PesoTokenInstance.transfer(user1.address, 100, {
        from: owner.address,
      });

      await PesoTokenInstance.connect(user1).createStake(100, {
        from: user1.address,
      });

      await PesoTokenInstance.distributeRewards({ from: owner.address });

      assert.equal(await PesoTokenInstance.rewardOf(user1.address), 1);
      assert.equal(await PesoTokenInstance.totalRewards(), 1);
    });

    it("Should let withdrawn rewards", async () => {
      await PesoTokenInstance.transfer(user1.address, 100, {
        from: owner.address,
      });

      await PesoTokenInstance.connect(user1).createStake(100, {
        from: user1.address,
      });

      await PesoTokenInstance.distributeRewards({ from: owner.address });
      await PesoTokenInstance.connect(user1).withdrawnReward({
        from: user1.address,
      });

      const initialSupply = manyTokens;
      const existingStakes = 100;
      const mintedAndWithdrawn = 1;

      assert.equal(await PesoTokenInstance.balanceOf(user1.address), 1);
      assert.equal(await PesoTokenInstance.stakeOf(user1.address), 100);
      assert.equal(await PesoTokenInstance.rewardOf(user1.address), 0);
      assert.equal(
        await PesoTokenInstance.totalSupply(),
        initialSupply
          .minus(existingStakes)
          .plus(mintedAndWithdrawn)
          .toString(10)
      );
      assert.equal(await PesoTokenInstance.totalStakes(), 100);
      assert.equal(await PesoTokenInstance.totalRewards(), 0);
    });

    it("Should return 0 rewardOf", async () => {
      assert.equal(await PesoTokenInstance.rewardOf(user1.address), 0);
    });

    it("Should return 0 totalRewards", async () => {
      assert.equal(await PesoTokenInstance.totalRewards(), 0);
    });

    it("Should return 0 calculateRewards", async () => {
      assert.equal(await PesoTokenInstance.connect(user1).totalRewards(), 0);
    });
  });

  describe("Stakeholder", async () => {
    it("Should return true checking isStakeholder", async () => {
      await PesoTokenInstance.transfer(user1.address, 3, {
        from: owner.address,
      });

      await PesoTokenInstance.connect(user1).createStake(1, {
        from: user1.address,
      });

      const [isStakeholder, position] = await PesoTokenInstance.connect(
        user1
      ).isStakeholder(user1.address);

      assert.equal(isStakeholder, true);
      assert.equal(position, 0);
    });

    it("Should return false checking isStakeholder", async () => {
      const [isStakeholder, _] = await PesoTokenInstance.connect(
        user1
      ).isStakeholder(user1.address);

      assert.equal(isStakeholder, false);
    });

    it("Should addStakeholder", async () => {
      await PesoTokenInstance.connect(user1).addStakeholder(user1.address);

      assert.isTrue(
        (await PesoTokenInstance.connect(user1).isStakeholder(user1.address))[0]
      );
    });

    it("Should removeStakeholder", async () => {
      await PesoTokenInstance.connect(user1).addStakeholder(user1.address);
      await PesoTokenInstance.connect(user1).removeStakeholder(user1.address);

      assert.isFalse(
        (await PesoTokenInstance.connect(user1).isStakeholder(user1.address))[0]
      );
    });
  });
});
