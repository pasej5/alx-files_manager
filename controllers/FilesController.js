/*
*add uploads to the server
*/
const fs = require('fs').promises;
const { ObjectId } = require('mongodb');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

const postUpload = async (req, res) => {
// check the user exists using tken
  const token = req.headers['x-token'];
  if (!token) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  const userId = await redisClient.get(`auth_${token}`);
  if (!userId) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }
  // get data passed as the body
  const {
    type, name, parentId = 0, isPublic = false, data,
  } = req.body;

  if (!name) {
    res.status(400).send({ error: 'Missing name' });
    return;
  }
  const acceptedTypes = ['folder', 'file', 'image'];
  if (!type || !acceptedTypes.includes(type)) {
    res.status(400).send({ error: 'Missing type' });
    return;
  }

  if (!data && type !== 'folder') {
    res.status(400).send({ error: 'Missing data' });
    return;
  }

  if (parentId) {
    const parentFile = await dbClient.fileCollection().findOne({ _id: ObjectId(parentId) });
    if (!parentFile) {
      res.status(400).send({ error: 'Parent not found' });
      return;
    }

    if (parentFile.type !== 'folder') {
      res.status(400).send({ error: 'Parent is not a folder' });
      return;
    }
  }

  const file = {
    userId: ObjectId(userId),
    name,
    type,
    parentId: parentId === 0 || parentId === '0' ? '0' : ObjectId(parentId),
    isPublic,
  };

  if (type === 'file' || type === 'image') {
    // if not folder
    const PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
    const filename = uuidv4();
    await fs.mkdir(PATH, { recursive: true });
    const filePath = path.join(PATH, filename);

    // decode the data
    const fileData = Buffer.from(data, 'base64').toString('utf8');
    await fs.writeFile(filePath, fileData, 'utf8');
    file.localPath = filePath;
  }

  const reslt = await dbClient.fileCollection().insertOne(file);

  res.status(201);
  res.send({
    name,
    id: reslt.ops[0]._id,
    userId,
    type,
    isPublic,
    parentId: parentId === 0 || parentId === '0' ? 0 : parentId,
  });
};

module.exports = { postUpload };
