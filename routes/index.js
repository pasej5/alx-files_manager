/*
 * create a route
 */
const { Router } = require('express');
const AppController = require('../controllers/AppController');

const app = Router();

app.get('/status', AppController.getStatus);
app.get('/stats', AppController.getStats);

module.exports = app;
