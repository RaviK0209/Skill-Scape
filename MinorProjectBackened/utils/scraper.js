const { Builder, By, until } = require('selenium-webdriver');
require('chromedriver');
const Opportunity = require('../models/Opportunity');

async function scrapeData() {
    const driver = await new Builder().forBrowser('chrome').build();

    try {
        await driver.get('https://www.india.gov.in/topics/education/secondary-higher-secondary-education');

        // Wait until the content loads
        await driver.wait(until.elementLocated(By.css('.views-row')), 30000);

        const elements = await driver.findElements(By.css('.views-row'));
        const opportunities = [];

        for (let element of elements) {
            let title = 'No Title Available';
            let link = '#';
            let description = 'No description available.';

            try {
                // Scrape title and link
                const titleElement = await element.findElement(By.css('h3 a, .field-content a'));
                title = await titleElement.getText();
                link = await titleElement.getAttribute('href');

                // Scrape description
                const descElement = await element.findElement(By.css('.views-field-body p, .field-content p'));
                description = await descElement.getText();
            } catch (err) {
                console.log(`⚠️ Error scraping data for one element: ${err.message}`);
            }

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

module.exports = scrapeData;