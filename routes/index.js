/*
 * create a route
 */
const { Router } = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');

const app = Router();

console.log(AuthController.getConnect);

app.get('/status', AppController.getStatus);
app.get('/stats', AppController.getStats);
app.post('/users', UsersController.postNew);
app.get('/connect', AuthController.getConnect);
app.get('/disconnect', AuthController.getDisconnect);
app.get('/users/me', UsersController.getMe);

module.exports = app;
