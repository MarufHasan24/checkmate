const redis = require("redis");
const { readFile, writeFile } = require("./node");

/* 
read file will send a filepath to the redis server
I will count that path as a key
and the value will be the data of that file
if data exists in redis, it will return the data
if data does not exist, it will read the file and store it in redis
*/

// Create Redis client

const path = require("path");
const keySet = new Set();

const redisClient = redis.createClient({
  url: "redis://localhost:6379",
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

function connectRedis(callback) {
  redisClient
    .connect()
    .then(() => {
      console.log("Redis connected.");
      callback(null);
    })
    .catch(callback);
}

function readFromRedis(key, callback) {
  redisClient.get(key, (err, result) => {
    if (err) {
      readFile(key, (fileErr, data) => {
        if (fileErr) {
          return callback(fileErr);
        } else {
          writeToRedis(key, JSON.stringify(data), (writeErr) => {
            if (writeErr) {
              return callback(writeErr);
            } else {
              return callback(null, data);
            }
          });
        }
      });
    } else {
      return callback(null, JSON.parse(result));
    }
  });
}

function writeToRedis(key, value, callback) {
  redisClient.set(key, JSON.stringify(value), (err, reply) => {
    if (err) {
      return callback(err);
    } else {
      // Add the key to the keySet
      keySet.add(key);
      return callback(null, reply);
    }
  });
}

//get the full redis keys and data
function updateRedisKeys() {
  let paths = Array.from(keySet);

  function processPathsSequentially(paths, index = 0) {
    if (index >= paths.length) {
      console.log("✅ All keys processed.");
      return;
    }

    const key = paths[index];
    redisClient.get(key, (err, result) => {
      if (err) {
        console.error(`❌ Redis error for "${key}":`, err);
        return processPathsSequentially(paths, index + 1);
      }

      let data;
      try {
        data = JSON.parse(result);
      } catch (parseErr) {
        console.error(`⚠️ JSON parse error for key "${key}":`, parseErr);
        return processPathsSequentially(paths, index + 1);
      }

      const fullPath = path.join(__dirname, key);
      const dir = path.dirname(fullPath);

      fs.mkdir(dir, { recursive: true }, (mkdirErr) => {
        if (mkdirErr) {
          console.error(`❌ Failed to create directory "${dir}":`, mkdirErr);
          return processPathsSequentially(paths, index + 1);
        }

        writeFile(fullPath, data, (writeErr) => {
          if (writeErr) {
            console.error(`❌ Write error for "${key}":`, writeErr);
          } else {
            console.log(`✅ Wrote file: ${fullPath}`);
          }
          processPathsSequentially(paths, index + 1);
        });
      });
    });
  }
  processPathsSequentially(paths);
}
connectRedis((err) => {
  if (err) {
    console.error("Failed to connect to Redis:", err);
  } else {
    console.log("Connected to Redis, updating keys...");
    updateRedisKeys();
  }
});
function quitRedis(callback) {
  redisClient
    .quit()
    .then(() => callback(null))
    .catch(callback);
}

module.exports = {
  connectRedis,
  readFromRedis,
  writeToRedis,
  quitRedis,
};
