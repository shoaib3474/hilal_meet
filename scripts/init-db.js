const { initializeDatabase } = require('../db');

initializeDatabase()
    .then(() => {
        console.log('Database initialized successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Database initialization failed', error);
        process.exit(1);
    });
