require('dotenv').config();
const runMigrations = require('../database/migrate');
runMigrations().then(() => {
    console.log('Migrations finished.');
    process.exit(0);
}).catch(err => {
    console.error('Migrations failed:', err);
    process.exit(1);
});
