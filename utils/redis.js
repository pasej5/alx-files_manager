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

  // set key value pair for the server
  async set(key, value, time) {
    const redisSet = promisify(this.client.set).bind(this.client);
    await redisSet(key, value);
    await this.client.expire(key, time);
  }

  // delete key value pair in redis
  async del(key) {
    const redisDel = promisify(this.client.del).bind(this.client);
    await redisDel(key);
  }
}
const redisClient = new RedisClient();
module.exports = redisClient;
