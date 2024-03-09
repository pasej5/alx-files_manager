import { createClient } from 'redis';
import { promisify } from 'utils';

// class to define commands commonly used in redis
class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (error) => {
      console.log(`Redis client not connected to server: ${error}`);
    });
  }
}
const redisClient = new RedisClient();
module.exports = redisClient;
