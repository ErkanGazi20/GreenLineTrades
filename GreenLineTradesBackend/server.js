const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path'); // ✅ Required for serving static files
const app = express();
const Listing = require('./models/Listing');

// Middleware
app.use(cors());
app.use(express.json());
// Serve index.html and other root-level static files
app.use(express.static(__dirname));

// Optionally still serve js folder explicitly if needed (can also be served via above)
app.use('/js', express.static(path.join(__dirname, 'js')));

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
  role: { 
    type: String, 
    enum: ['consumer', 'merchant', 'admin'], 
    default: 'consumer' 
  }
});

const User = mongoose.model('User', userSchema);

// Middleware: Authenticate Token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.sendStatus(401);

  const token = authHeader.split(' ')[1];
  jwt.verify(token, "your_jwt_secret", (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Middleware: Authorize Roles
const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    const dbUser = await User.findById(req.user.userId);
    if (!dbUser || !allowedRoles.includes(dbUser.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient privileges.' });
    }
    req.user.role = dbUser.role;
    next();
  };
};

// Routes
app.get('/', (req, res) => {
  res.send('🚀 Welcome to Green Line Trades Backend API');
});

// Registration Route
app.post('/register', async (req, res) => {
  try {
    const {
      firstName, lastName, email, workTel,
      mobileTel, business, password, role
    } = req.body;

    if (!firstName || !lastName || !email || !password || !mobileTel) {
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

    const validRoles = ['consumer', 'merchant', 'admin'];
    const assignedRole = validRoles.includes(role) ? role : 'consumer';

    const newUser = new User({
      firstName,
      lastName,
      username,
      email,
      workTel: workTel?.trim() || '',
      mobileTel,
      business,
      password: hashedPassword,
      role: assignedRole
    });

    await newUser.save();

    // ✅ Create token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email },
      "your_jwt_secret",
      { expiresIn: "2h" }
    );

    // ✅ Send token and user (omit password)
    res.status(201).json({
      success: true,
      token,
      user: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ success: false, message: "Server error. Please try again later." });
  }
});

// Login Route
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
      "your_jwt_secret",
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
        role: user.role
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Add Listing Route - Only merchants or admins
app.post('/add-listing', authenticateToken, authorizeRoles('merchant', 'admin'), async (req, res) => {
  try {
    const { title, description, price, category } = req.body;

    if (!title || !price) {
      return res.status(400).json({ success: false, message: "Title and price are required." });
    }

    const newListing = new Listing({
      title,
      description,
      price,
      category,
      owner: req.user.userId
    });

    await newListing.save();
    res.status(201).json({ 
      success: true, 
      message: "Listing created successfully", 
      listing: newListing 
    });

  } catch (error) {
    console.error("Error saving listing:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Message Submission Route (Optional Auth)
app.post('/submit', (req, res) => {
  const authHeader = req.headers['authorization'];
  let user = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      user = jwt.verify(token, "your_jwt_secret");
      console.log("✅ Authenticated submission from:", user.email);
    } catch (err) {
      console.warn("⚠️ Invalid token provided:", err.message);
    }
  } else {
    console.log("📩 Anonymous submission");
  }

  console.log("📩 Received submission:", req.body);
  res.status(200).json({ success: true, message: "Message received" });
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
