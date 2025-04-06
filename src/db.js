const { Client } = require('pg');

const client = new Client({
    user: 'your-db-username',
    host: 'localhost',
    database: 'your-db-name',
    password: 'your-db-password',
    port: 5432,
});

client.connect();
