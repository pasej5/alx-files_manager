/*
 * create a route
 */
const { Router } = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const FilesController = require('../controllers/FilesController');

const app = Router();

app.get('/status', AppController.getStatus);
app.get('/stats', AppController.getStats);
app.post('/users', UsersController.postNew);
app.get('/connect', AuthController.getConnect);
app.get('/disconnect', AuthController.getDisconnect);
app.get('/users/me', UsersController.getMe);
app.post('/files', FilesController.postUpload)

module.exports = app;
