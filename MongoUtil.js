const mongoClient = require("mongodb").MongoClient;
const ObjectId = require('mongodb').ObjectId


async function connect(mongoUrl, dbName) {
  // create a client
  let client = await mongoClient.connect(mongoUrl, {
    useUnifiedTopology: true
  });
  // use a database;
  let db = client.db(dbName);
  console.log("Database connected");
  return db;
}



module.exports = {
  connect,
}
