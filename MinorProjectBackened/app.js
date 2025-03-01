require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const path = require('path');
const mongoose = require('mongoose');
const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const cron = require('node-cron');
const Opportunity = require('./models/Opportunity'); // Import Opportunity model

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

// View Engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Database Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

// Passport Config
require('./config/passportConfig')(passport);

// Routes
app.use('/', require('./routes/authRoutes'));
app.use('/opportunities', require('./routes/opportunityRoutes'));

// 🚀 Scraping Function with Enhanced Logic
async function scrapeData() {
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get('https://www.india.gov.in/topics/education/secondary-higher-secondary-education');

        // ✅ Wait until the content loads (wait for views-row)
        await driver.wait(until.elementLocated(By.css('.views-row')), 30000);

        const elements = await driver.findElements(By.css('.views-row'));
        const opportunities = [];

        for (let element of elements) {
            // ✅ 1. TITLE (Try multiple selectors)
            let title = 'No Title Available';
            let link = '#';
            try {
                const titleElement = await element.findElement(By.css('h3 a, .field-content a')); // Multiple selectors
                title = await titleElement.getText();
                link = await titleElement.getAttribute('href');
            } catch (err) {
                console.log('⚠️ Title not found for one element.');
            }

            // ✅ 2. DESCRIPTION (Try multiple selectors)
            let description = 'No description available.';
            try {
                const descElement = await element.findElement(By.css('.views-field-body p, .field-content p'));
                description = await descElement.getText();
            } catch (err) {
                console.log(`⚠️ Description not found for: ${title}`);
            }

            // ✅ Add to opportunities if at least title exists
            if (title !== 'No Title Available') {
                opportunities.push({ title, link, description });
            }
        }

        // Save opportunities to the database
        await Opportunity.deleteMany({}); // Clear old data
        await Opportunity.insertMany(opportunities);

        console.log('✅ Data scraped and saved successfully!');
    } catch (error) {
        console.error('❌ Error scraping data:', error);
    } finally {
        await driver.quit();
    }
}

// 🕰️ Run scraping every 30 mins
cron.schedule('*/30 * * * *', scrapeData);

// 🌐 Display Data
app.get('/', async (req, res) => {
    try {
        const opportunities = await Opportunity.find(); // Fetch opportunities from the database
        res.render('index', { opportunities });
    } catch (err) {
        console.error('Error fetching opportunities:', err);
        res.status(500).send('Server Error');
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    scrapeData(); // Run on server start
});