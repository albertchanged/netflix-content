const redis = require('redis');

const redisClient = redis.createClient({ host: process.env.REDIS_HOST || '127.0.0.1' });

const util = require('util');
require('util.promisify').shim();

redisClient.on('connect', () => {
  console.log('Connected to redis!');
});

module.exports.getAsync = util.promisify(redisClient.get).bind(redisClient);
module.exports.setAsync = util.promisify(redisClient.set).bind(redisClient);
module.exports.hsetSync = util.promisify(redisClient.hset).bind(redisClient);
module.exports.hgetallAsync = util.promisify(redisClient.hgetall).bind(redisClient);
module.exports.hmsetSync = util.promisify(redisClient.hmset).bind(redisClient);
module.exports.rpushSync = util.promisify(redisClient.rpush).bind(redisClient);