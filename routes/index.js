/*
 * create a route
 */
const { Router } = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');

const app = Router();

app.get('/status', AppController.getStatus);
app.get('/stats', AppController.getStats);
app.post('/users', UsersController.postNew);

module.exports = app;
