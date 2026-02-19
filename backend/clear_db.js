const mongoose = require('mongoose');
const MONGO_URI = 'mongodb+srv://root:chintu@cluster0.alpyjmp.mongodb.net/tree-viz?appName=Cluster0';

async function clearData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully.');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections. Dropping them...`);

        for (const collection of collections) {
            try {
                await mongoose.connection.db.dropCollection(collection.name);
                console.log(`Dropped collection: ${collection.name}`);
            } catch (dropErr) {
                console.error(`Error dropping collection ${collection.name}:`, dropErr.message);
            }
        }

        console.log('Successfully cleared all data from the database.');
        process.exit(0);
    } catch (err) {
        console.error('Error clearing data:', err);
        process.exit(1);
    }
}

clearData();
