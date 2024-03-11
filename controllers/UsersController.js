/*
 * define the logic to add a user to the database
 */
const sha1 = require('sha1');
const dbClient = require('../utils/db');

const postNew = async (req, res) => {
  const { email, password } = req.body;
  console.log(email, password);
  if (!email) {
    res.status(400).send({ error: 'Missing email' });
  }

  if (!password) {
    res.status(400).send({ error: 'Missing password' });
    return;
  }

  const query = { email };
  const obj = await dbClient.db.collection('users').findOne(query);

  if (obj) {
    res.status(400).send({ error: 'Already exist' });
    return;
  }

  // hashing the password
  const hashPass = sha1(password);

  const newObj = await dbClient.db.collection('users').insertOne({ email, password: hashPass });
  res.status(201).send({
    _id: newObj.ops[0]._id,
    email,
  });
};

module.exports = { postNew };
