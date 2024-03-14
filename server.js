/*
 * create a server and load all routes in index.js
 * listen on default 5000
 */
const express = require('express');
const routes = require('./routes/index');

const app = express();
app.use(express.json());
app.use(routes);

app.listen(process.env.PORT || 5000);
