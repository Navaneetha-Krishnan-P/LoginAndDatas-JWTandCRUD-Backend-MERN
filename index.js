const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());


const PORT = 5000;
const JWT_SECRET = "krishnank8903848938";

const username = "new_user-01";
const password = "Krish2309";
const cluster = "cluster0";
const dbname = "JwtAndCrud";

const uri = `mongodb+srv://${username}:${password}@${cluster}.hotzxyg.mongodb.net/${dbname}?retryWrites=true&w=majority&appName=Cluster0`;

mongoose.connect(uri, {})
    .then(() => console.log('MongoDB Atlas connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// User schema
const userSchema = new mongoose.Schema({
    username: String,
    email: { type: String, unique: true },
    password: String,
});
const User = mongoose.model('User', userSchema);

// Post schema
const postSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    heading: String,
    description: String,
    createdAt: { type: Date, default: Date.now },
});
const Post = mongoose.model('Post', postSchema);

// Register
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        await newUser.save();
        return res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(400).json({ message: 'Invalid credentials' });
    }
});

// Create Post
app.post('/posts', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    const { heading, description } = req.body;
    const decoded = jwt.verify(token, JWT_SECRET);
    const post = new Post({ userId: decoded.id, heading, description });
    await post.save();
    res.json({ message: 'Post created' });
});

// Get Posts
app.get('/posts', async (req, res) => {
    const posts = await Post.find();
    res.json(posts);
});

// Update Post
app.put('/posts/:id', async (req, res) => {
    const { heading, description } = req.body;
    await Post.findByIdAndUpdate(req.params.id, { heading, description });
    res.json({ message: 'Post updated' });
});

// Delete Post
app.delete('/posts/:id', async (req, res) => {
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});



