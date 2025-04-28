const db = require("../connection.js");
const fetchAndSeed = require("./fetchAndSeed.js");

const runSeed = () => {
  return fetchAndSeed().then(() => {
    db.end();
  });
};

runSeed();
