// === server.js ===
require('dotenv').config();
const express = require('express');
const cors = require('cors'); // Only once
const axios = require('axios');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors({
  origin: '*', // Use 'http://localhost:3000' in production
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));


// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

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
  type: { type: String, default: "register" }
});

const User = mongoose.model('User', userSchema);

// Auth Middleware
const authenticate = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ success: false, error: 'Invalid token' });
    req.userId = decoded.userId;
    next();
  });
};

// Register
app.post('/register', async (req, res) => {
  const { firstName, lastName, email, workTel, mobileTel, business, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, error: 'Email already in use' });

    let baseUsername = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, '');
    let username = baseUsername;
    let suffix = 2;
    while (await User.findOne({ username })) {
      username = `${baseUsername}${suffix}`;
      suffix++;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ firstName, lastName, email, username, workTel, mobileTel, business, password: hashedPassword });
    await user.save();

    res.json({ success: true, message: 'User registered successfully', username });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Login
app.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  try {
    const user = await User.findOne({ $or: [ { email: identifier.toLowerCase() }, { username: identifier.toLowerCase() } ] });
    if (!user) return res.status(400).json({ success: false, error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, error: 'Invalid password' });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '2h' });

    res.json({
      success: true,
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        workTel: user.workTel,
        mobileTel: user.mobileTel,
        business: user.business,
        name: `${user.firstName} ${user.lastName}`
      }
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Contact Submission
app.post('/submit', authenticate, async (req, res) => {
  const { subject, message } = req.body;

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    const response = await axios.post(process.env.GOOGLE_SCRIPT_URL, {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      subject,
      message
    });

    res.json({ success: true, message: 'Data forwarded to Google Sheets', scriptResponse: response.data });
  } catch (error) {
    console.error('Error forwarding to Google Sheets:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Fallback Route
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

app.listen(port, () => console.log(`🚀 Server running on port ${port}`));



// === public/app.js ===
document.addEventListener('DOMContentLoaded', function () {
  const form = document.querySelector('.contact-form');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      const name = form.querySelector('input[name="name"]').value.trim();
      const email = form.querySelector('input[name="email"]').value.trim();
      const subject = form.querySelector('input[name="subject"]').value.trim();
      const message = form.querySelector('textarea[name="message"]').value.trim();

      if (!name || !email || !subject || !message) {
        alert("Please fill in all fields before submitting.");
        return;
      }

      fetch('/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': localStorage.getItem('token')
        },
        body: JSON.stringify({ subject, message })
      })
      .then(res => res.json())
      .then(data => {
        console.log("Data saved:", data);
        const popup = document.getElementById('message-popup');
        if (popup) {
          popup.style.display = 'block';
          setTimeout(() => popup.style.display = 'none', 3000);
        }
        form.reset();
      })
      .catch(err => {
        console.error("Failed to save data:", err);
        alert("Message sending failed.");
      });
    });
  }

  const user = JSON.parse(localStorage.getItem('user'));
  if (user) {
    document.querySelector('[href="login.html"]').style.display = 'none';
    document.querySelector('[href="register.html"]').style.display = 'none';

    const nav = document.querySelector('.nav-list');
    const logoutItem = document.createElement('li');
    logoutItem.innerHTML = '<a href="#">Logout</a>';
    logoutItem.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      location.reload();
    });
    nav.appendChild(logoutItem);
  }
});
