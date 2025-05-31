const redisClient = require('../config/redis');

const cache = {
  get: async (key) => {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  },

  set: async (key, data, ttl = 3600) => {
    try {
      await redisClient.set(key, JSON.stringify(data), {
        EX: ttl
      }); // Removed NX to allow overwriting existing cache entries
    } catch (error) {
      console.error('Cache write error:', error);
    }
  },

  del: async (pattern) => {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys); // Spread operator to pass all keys
      }
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }
};

module.exports = cache;
