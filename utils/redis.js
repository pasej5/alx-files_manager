import { createClient } from 'redis';
import { get } from 'request';
import { promisify } from 'utils';

// class to define commands commonly used in redis
class RedisClient {
  constructor() {
    this.client = createClient();
    this.client.on('error', (error) => {
      console.log(`Redis client not connected to server: ${error}`);
    });
  }

  // checking the redis connection and repoting the status
  isAlive() {
    if (this.client.connected) {
      return true;
    }
    return false;
  }

  // get value for a given key
  async get(key) {
    const redisGet = promisify(this.client.get).bind(this.client);
    const value = await redisGet(key);
    return value;
  }
}
const redisClient = new RedisClient();
module.exports = redisClient;
