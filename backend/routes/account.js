const express = require("express");
const { authMiddleware } = require("../middleware");
const { Account } = require("../db");
const { z } = require("zod");
const mongoose = require("mongoose");
const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
  const { userId } = req;
  const { balance } = await Account.findOne({ userId });
  return res.status(200).json({
    balance,
  });
});

const transferBody = z.object({
  to: z.string(),
  amount: z.string(),
});

router.post("/transfer", authMiddleware, async (req, res) => {
  const { success } = transferBody.safeParse(req.body);
  if (!success) {
    return res.status(403).json({
      message: "Error",
    });
  }
  const by = req.userId;
  const { to } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();
  const { amount } = req.body;

  const byAccount = await Account.findOne({ userId: by }).session(session);
  if (!byAccount || byAccount.balance < amount) {
    await session.abortTransaction(session);
    return res.status(400).json({
      message: "Insufficient Balance",
    });
  }
  const toAccount = await Account.findOne({ userId: to }).session(session);
  if (!toAccount) {
    await session.abortTransaction(session);
    return res.status(400).json({
      message: "Invalid Account",
    });
  }

  await Account.updateOne(
    { userId: to },
    {
      $inc: {
        balance: amount,
      },
    }
  ).session(session);

  await Account.updateOne(
    { userId: by },
    {
      $inc: {
        balance: -amount,
      },
    }
  ).session(session);

  await session.commitTransaction();
  return res.json({
    message: "Transfer successful",
  });
});

module.exports = router;
