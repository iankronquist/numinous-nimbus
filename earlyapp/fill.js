var redis = require('redis');
var bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
var redisClient = redis.createClient(process.env.REDIS_URL || 'redis://localhost:6379');

var distros = {
  'ubuntu:packages': {
    'gcc': {
      "website": "gnu.org",
      "install_command": "",
      "last_updated": 00000,
      "caveats": [ "I had issues with foo", "I had issues with bar, this was my work around"]
    },
  },
  'centos:packages': {
    'gcc': {
      "website": "gnu.org",
      "install_command": "",
      "last_updated": 00000,
      "caveats": [ "I had issues with foo", "I had issues with bar, this was my work around"]
    },
  },
};

var programs = {
  'gcc': [
    {
      "distro": "ubuntu",
      "package": "gcc"
    },
    {
      "distro": "centos",
      "package": "gcc"
    },
  ],
};
Promise.all(Object.keys(programs).map((k) => {
  return redisClient.hsetAsync('programs', k, JSON.stringify(programs[k]));
})).then(() => {
  Promise.all(Object.keys(distros).map((d) => {
    return Promise.all(Object.keys(distros[d]).map((k) => {
      console.log(d, k, JSON.stringify(distros[d][k]));
      return redisClient.hsetAsync(d, k, JSON.stringify(distros[d][k]));
    }));
  }));
}).then(() => redisClient.quit());
