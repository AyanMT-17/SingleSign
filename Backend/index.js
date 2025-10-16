require('dotenv').config();
const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 5000;

// Load from environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET;

// In-Memory "Database"
const db = {
    users: {}, // { googleId: { name, email, notes: [] } }
    notes: {}  // { userId: [{ id, content, timestamp }] }
};

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(cors({
    origin: 'http://localhost:5173', // Vite's default port
    credentials: true // Crucial for sending cookies
}));
app.use(bodyParser.json());
app.use(cookieParser());

// --- Middleware to Protect Routes (JWT Verification) ---
const protect = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).json({ message: 'Not authenticated. No token found.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = db.users[decoded.googleId];
        req.userId = decoded.googleId;
        next();
    } catch (err) {
        // If the token is invalid or expired
        return res.status(401).json({ message: 'Not authenticated. Invalid token.' });
    }
};

// --- API: Google Login Endpoint ---
app.post('/api/login', async (req, res) => {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).send('Missing ID Token');
    }

    try {
        // 1. Verify Google ID Token
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        const googleId = payload['sub'];
        const name = payload['name'];
        const email = payload['email'];

        // 2. Upsert User in DB
        if (!db.users[googleId]) {
            db.users[googleId] = { googleId, name, email };
            db.notes[googleId] = [];
            console.log(`New user registered: ${name}`);
        }

        // 3. Create JWT
        const token = jwt.sign({ googleId: googleId }, JWT_SECRET, {
            expiresIn: '7d', // Token expires in 7 days
        });

        // 4. Store JWT in HTTP-Only Cookie
        res.cookie('jwt', token, {
            httpOnly: true, // Prevents client-side JS access
            secure: process.env.NODE_ENV === 'production', // Use 'true' in production with HTTPS
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            sameSite: 'strict', // Security setting
        });

        res.json({ message: 'Login successful', user: { name, email } });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Authentication failed' });
    }
});

// --- API: Get Current User (Protected) ---
app.get('/api/user', protect, (req, res) => {
    if (req.user) {
        res.json({ user: { name: req.user.name, email: req.user.email } });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// --- API: Logout ---
app.post('/api/logout', (req, res) => {
    res.cookie('jwt', '', {
        httpOnly: true,
        expires: new Date(0), // Expire the cookie immediately
        sameSite: 'strict',
    });
    res.json({ message: 'Logout successful' });
});

// --- API: Get User Notes (Protected) ---
app.get('/api/notes', protect, (req, res) => {
    const userNotes = db.notes[req.userId] || [];
    res.json({ notes: userNotes });
});

// --- API: Add New Note (Protected) ---
app.post('/api/notes', protect, (req, res) => {
    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ message: 'Note content is required.' });
    }
    
    const newNote = {
        id: Date.now(), // Simple unique ID
        content: content,
        timestamp: new Date().toISOString()
    };

    if (!db.notes[req.userId]) {
        db.notes[req.userId] = [];
    }
    db.notes[req.userId].push(newNote);

    res.status(201).json({ message: 'Note added successfully', note: newNote });
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
