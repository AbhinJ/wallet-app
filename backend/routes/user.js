const express = require("express");
const { z } = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { authMiddleware } = require("../middleware");

const router = express.Router();
const signupBody = z.object({
  username: z.string().email(),
  password: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

router.post("/signup", async (req, res) => {
  const { success } = signupBody.safeParse(req.body);
  if (!success) {
    res.status(411).json({
      message: "Email already taken / Incorrect inputs",
    });
  }
  try {
    const existing = await User.findOne({
      username: req.body.username,
    });
    if (existing) {
      res.status(411).json({
        message: "Email already taken",
      });
      return;
    }

    const user = await User.create({
      username: req.body.username,
      password: req.body.password,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
    });

    const userId = user._id;
    await Account.create({
      userId,
      balance: 1 + Math.random() * 10000,
    });
    const token = jwt.sign({ userId }, JWT_SECRET);

    res.status(200).json({
      message: "User created sucessfully",
      token,
    });
  } catch (e) {
    res.status(411).json({
      errorMessage: e,
    });
  }
});

const signinBody = z.object({
  username: z.string().email(),
  password: z.string(),
});

router.post("/signin", async (req, res) => {
  const { success } = signinBody.safeParse(req.body);
  if (!success) {
    res.status(411).json({
      message: "Error while logging in",
    });
    return;
  }

  const user = await User.findOne({
    username: req.body.username,
    password: req.body.password,
  });

  if (!user) {
    res.status(411).json({
      message: "Error while logging in",
    });
    return;
  }

  const token = jwt.sign({ id: user._id }, JWT_SECRET);
  res.status(200).json({
    token,
  });
});

const updateBody = z.object({
  password: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

router.put("/", authMiddleware, async (res, req) => {
  try {
    const { success } = updateBody.safeParse(req.body);
    if (!success) {
      return res.status(411).json({ message: "Error occured" });
    }
    const id = req.userId;
    await User.updateOne({ _id: id }, req.body);
    return res.status(200).json({
      message: "updated sucessfully",
    });
  } catch (errorMessage) {
    return res.status(411).json({ errorMessage });
  }
});

router.get("/bulk", authMiddleware, async (res, req) => {
  const filter = req.query.filter || "";
  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });

  res.status(200).json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      _id: user._id,
    })),
  });
});

module.exports = router;
