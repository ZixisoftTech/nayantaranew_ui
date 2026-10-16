const mysql = require('mysql');
const path = require('path');

// Local development: values from nayantara/.env.local override the production defaults below.
try {
    if (typeof process.loadEnvFile === 'function') {
        process.loadEnvFile(path.join(__dirname, '..', '.env.local'));
    }
} catch (e) { /* no .env.local -> production defaults */ }

const connectDatabase = mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'phpmyadmin',
    password: process.env.DB_PASSWORD || '2K*G41nE8y<AO7[n_',
    database: process.env.DB_NAME || 'nayantara_db',

    // host: 'localhost',
    // user: 'root',
    // password: '',
    // database: 'nayantara_db',
});

connectDatabase.connect((error) => {
    if (error) {
        console.log("error occurred while connecting", error);
    } else {
        console.log("connection created with Mysql successfully");
    }
});

module.exports = connectDatabase;