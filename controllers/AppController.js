/*
 * controlling the business logic for the api
 */
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const sha1 = require('sha1');

// get the status
const getStatus = (req, res) => {
  res.status(200).send({ redis: redisClient.isAlive(), db: dbClient.isAlive() });
};

// get statistics
const getStats = async (req, res) => {
  const users = await dbClient.nbUsers();
  const files = await dbClient.nbFiles();

  res.status(200).send({ users, files });
};


module.exports = { getStats, getStatus };
