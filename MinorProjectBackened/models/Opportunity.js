const mongoose = require('mongoose');

const OpportunitySchema = new mongoose.Schema({
    title: String,
    link: String,
    description: String
});

module.exports = mongoose.model('Opportunity', OpportunitySchema);