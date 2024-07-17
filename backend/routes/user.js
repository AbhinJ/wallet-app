const express = require("express");
const { z } = require("zod");
const { User } = require("../db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

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

    const id = user._id;
    const token = jwt.sign({ id }, JWT_SECRET);

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

module.exports = router;
