const express = require('express');
const passport = require('passport');
const User = require('../models/User');
const Opportunity = require('../models/Opportunity'); // Import the Opportunity model

const router = express.Router();

// Register Page
router.get('/register', (req, res) => {
    res.render('register'); // Render the register.ejs file
});

// Login Page
router.get('/login', (req, res) => {
    res.render('login', { messages: req.flash() }); // Pass flash messages to the template
});

// Register User
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            req.flash('error', 'User already exists'); // Flash message for duplicate user
            return res.redirect('/register');
        }

        const newUser = new User({ name, email, password });
        await newUser.save();
        req.flash('success', 'Registration successful! Please log in.'); // Flash message for success
        res.redirect('/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'Server Error'); // Flash message for server error
        res.status(500).redirect('/register');
    }
});

// Login User
router.post('/login', passport.authenticate('local', {
    successRedirect: '/home',
    failureRedirect: '/login',
    failureFlash: true // Enable flash messages for login failures
}));

// Home Page (Protected)
router.get('/home', async (req, res) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'Please log in to access this page.'); // Flash message for unauthorized access
        return res.redirect('/login');
    }

    try {
        // Fetch opportunities data from the database
        const opportunities = await Opportunity.find();
        res.render('index', { user: req.user, opportunities }); // Pass user and opportunities data to the template
    } catch (err) {
        console.error(err);
        req.flash('error', 'Failed to fetch opportunities.'); // Flash message for database error
        res.redirect('/home');
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.logout(() => {
        req.flash('success', 'You have been logged out.'); // Flash message for logout
        res.redirect('/login');
    });
});

module.exports = router;