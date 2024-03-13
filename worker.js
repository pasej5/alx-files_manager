const Queue = require('bull');
const imageThumbnail = require('image-thumbnail');
const fs = require('fs').promises;
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db.js');

const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  const file = await dbClient.fileCollection().findOne({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });

  if (!file) {
    throw new Error('File not found');
  }

  const originalFilePath = file.localPath;
  const thumbnails = await Promise.all([
    imageThumbnail(originalFilePath, { width: 500 }),
    imageThumbnail(originalFilePath, { width: 250 }),
    imageThumbnail(originalFilePath, { width: 100 }),
  ]);

  await Promise.all(
    thumbnails.map(async (thumbnail, index) => {
      const size = [500, 250, 100][index];
      const thumbnailPath = `${originalFilePath}_${size}`;
      await fs.writeFile(thumbnailPath, thumbnail);
    })
  );
});

module.exports = fileQueue;
