var pg = require('pg');

var client = new pg.Client('postgres://localhost:5432/twitterdb');
client.connect();

module.exports = client;