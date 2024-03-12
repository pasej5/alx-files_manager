/*
 * creating logic for authN of a a cusr
 */

const sha1 = require('sha1');
const { v4: uuidv4 } = require('uuid');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

const getConnect = async (req, res) => {
  const { authorization } = req.headers;
  if (authorization) {
    const credentials = authorization.split(' ')[1];
    console.log(credentials);
    // convert to string
    const bufferObj = Buffer.from(credentials, 'base64');
    const credentialString = bufferObj.toString('utf8');
    const [email, password] = credentialString.split(':');

    const query = { email, password: sha1(password) };
    const user = await dbClient.userCollection().findOne(query);
    if (!user) {
      res.status(401).send({ error: 'Unauthorized' });
    }

    // generete token
    const token = uuidv4();
    const key = `auth_${token}`;
    // storing in sredis
    await redisClient.set(key, user._id, 24 * 60);
    res.status(200).send({ token });
  }
};

/*
 * deletes the token from memeory and removes the authN from user
 */
const getDisconnect = async (req, res) => {
  // getting the header token
  const token = req.headers['x-token'];
  if (!token) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  const userId = await redisClient.get(`auth_${token}`);
  console.log(userId);
  if (userId) {
    await redisClient.del(`auth_${token}`);
    res.status(204).send();
    return;
  }
  res.status(401).send({ error: 'Unauthorized' });
};

module.exports = { getDisconnect, getConnect };
