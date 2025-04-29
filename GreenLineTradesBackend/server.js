const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

app.post('/submit', (req, res) => {
  const authHeader = req.headers['authorization'];
  let user = null;

  // Optional auth handling
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      user = jwt.verify(token, "your_jwt_secret");
      console.log("✅ Authenticated submission from:", user.email);
    } catch (err) {
      console.warn("⚠️ Invalid token provided:", err.message);
      // Optional: return an error or just continue as anonymous
    }
  } else {
    console.log("📩 Anonymous submission");
  }

  console.log("📩 Received submission:", req.body);

  // TODO: Optionally save user-submitted message to DB

  res.status(200).json({ success: true, message: "Message received" });
});

// MongoDB Connection
mongoose.connect('mongodb://127.0.0.1:27017/greenlinetrades')
  .then(() => console.log('✅ Connected to Local MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  username: { type: String, unique: true },
  email: { type: String, unique: true },
  workTel: String,
  mobileTel: String,
  business: String,
  password: String,
  type: { type: String, default: 'user' }
});

const User = mongoose.model('User', userSchema);

// Routes
app.get('/', (req, res) => {
  res.send('🚀 Welcome to Green Line Trades Backend API');
});

app.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, workTel, mobileTel, business, password, type } = req.body;

    if (!firstName || !lastName || !email || !password || !workTel || !mobileTel) {
      return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email is already registered." });
    }

    let base = (firstName + lastName).toLowerCase().replace(/[^a-z0-9]/gi, '');
    let username = base;
    let counter = 2;
    while (await User.exists({ username })) {
      username = base + counter++;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      workTel,
      mobileTel,
      business,
      password: hashedPassword,
      type
    });

    await newUser.save();
    res.status(201).json({ success: true, message: "User registered successfully!" });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
});

// ✅ LOGIN ROUTE (outside of register handler!)
app.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }]
    });

    if (!user) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      "your_jwt_secret", // Replace with env variable in production
      { expiresIn: "2h" }
    );

    res.json({
      success: true,
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        type: user.type
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
