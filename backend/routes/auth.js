const express = require("express");
const User = require("../models/User");
const router = express.Router();

router.get("/test", (req, res) => {
  res.json({ message: "API working fine ✅" });
});

// Create new user
router.post("/register", async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// Get all users
router.get("/users", async (req, res) => {
  const users = await User.find().sort({ score: -1 });
  res.json(users);
});

// Update score
router.put("/score/:id", async (req, res) => {
  const { id } = req.params;
  const { score } = req.body;
  const user = await User.findByIdAndUpdate(id, { score }, { new: true });
  res.json(user);
});

module.exports = router;
