const express = require('express');
const Opportunity = require('../models/Opportunity');
const scrapeData = require('../utils/scraper');

const router = express.Router();

// Display Opportunities
router.get('/', async (req, res) => {
    try {
        const opportunities = await Opportunity.find();
        res.render('index', { opportunities });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Trigger Scraping Manually (Optional)
router.get('/scrape', async (req, res) => {
    try {
        await scrapeData();
        res.redirect('/');
    } catch (err) {
        res.status(500).send('Scraping failed');
    }
});

module.exports = router;