/*
 * create a route
 */
const { Router } = require('express');
const AppController = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const FilesController = require('../controllers/FilesController');

const app = Router();
console.log(FilesController.putPublish, FilesController.putUnpublish);

app.get('/status', AppController.getStatus);
app.get('/stats', AppController.getStats);
app.post('/users', UsersController.postNew);
app.get('/connect', AuthController.getConnect);
app.get('/disconnect', AuthController.getDisconnect);
app.get('/users/me', UsersController.getMe);
app.post('/files', FilesController.postUpload);
app.get('/files/:id', FilesController.getShow);
app.get('/files', FilesController.getIndex);
app.put('/files/:id/publish', FilesController.putPublish);
app.put('/files/:id/unpublish', FilesController.putUnpublish);
app.get('/files/:id/data', FilesController.getFile);

module.exports = app;
