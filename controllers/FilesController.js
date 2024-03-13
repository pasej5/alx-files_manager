/*
*add uploads to the server
*/
const mime = require('mime-types');
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

/*
* retrive a file based on the id and user
*
*/
const getShow = async (req, res) => {
// find user using token
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
  const { id } = req.params;
  // check if user is associated with the a file
  const file = await dbClient.fileCollection().findOne({
    userId: ObjectId(userId),
    _id: ObjectId(id),
  });
  if (!file) {
    res.status(404).send({ error: 'Not found' });
    return;
  }

  res.send({
    id,
    userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId,
  });
};

/*
* retrieve all users file documents for a specific parentId and with pagination
*/
const getIndex = async (req, res) => {
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

  // get the parameter passed and if a folder exists witha that id
  const { parentId = 0, page = 0 } = req.query;
  if (+(parentId) !== 0) {
    const folder = await dbClient.fileCollection().findOne({
      _id: ObjectId(parentId),
      type: 'folder',
    });

    if (!folder) {
      res.send([]);
      return;
    }
  }

  // get data with pagination
  const pageNo = Number(page);
  const NumberOfDoc = 20;

  if (pageNo >= 0) {
    const result = await dbClient.fileCollection().aggregate([
      { $match: { parentId: +(parentId) === 0 ? 0 : ObjectId(parentId) } },
      { $skip: pageNo * NumberOfDoc },
      { $limit: NumberOfDoc },
    ]).toArray();

    const editResult = result.map((value) => ({
      id: value._id,
      userId: value.userId,
      name: value.name,
      type: value.type,
      isPublic: value.isPublic,
      parentId: value.parentId,
    }));

    res.send(editResult);
  }
};

const putPublish = async (req, res) => {
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
  // check if a document is linked to the user and id passed
  const { id } = req.params;
  const file = await dbClient.fileCollection().findOne({
    userId: ObjectId(userId),
    _id: ObjectId(id),
  });
  if (!file) {
    res.status(404).send({ error: 'Not found' });
    return;
  }

  file.isPublic = true;

  res.send({
    id,
    userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId,
  });
};

const putUnpublish = async (req, res) => {
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
  const { id } = req.params;
  const file = await dbClient.fileCollection().findOne({
    userId: ObjectId(userId),
    _id: ObjectId(id),
  });

  if (!file) {
    res.status(404).send({ error: 'Not found' });
    return;
  }

  file.isPublic = false;
  res.send({
    id,
    userId,
    name: file.name,
    type: file.type,
    isPublic: file.isPublic,
    parentId: file.parentId,
  });
};

/*
*  return the content of the file document based on the ID
*/

const getFile = async (req, res) => {
  const token = req.headers['x-token'];
  console.log(token);
  if (!token) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  const userId = await redisClient.get(`auth_${token}`);
  console.log('user', userId);
  if (!userId) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  const { id } = req.params;
  // check if a file exists with that id
  const file = await dbClient.fileCollection().findOne({ _id: ObjectId(id) });
  console.log(file.userId)
  if (!file) {
    res.status(404).json({ error: 'File not found' });
    return;
  }

  if (!file.isPublic && (file.userId.toString() !== userId.toString())) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  if (file.type === 'folder') {
    res.status(400).json({ error: "A folder doesn't have content" });
    return;
  }

  // check if it exists locally
  const itExists = await fs.access(file.localPath);
  if (!itExists) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  // get the mine type
  const mimeType = mime.lookup(file.name);

  // read the content of the file
  const content = fs.readFile(file.localPath);

  res.setHeader('Content-Type', mimeType);
  res.send(content);
};
module.exports = {
  postUpload,
  getShow,
  getIndex,
  putPublish,
  putUnpublish,
  getFile,
};
