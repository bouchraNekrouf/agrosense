const mongoose = require('mongoose');

const connectDB = async () => {
    const cloudURI = 'mongodb://nekroufbouchra31_db_user:W2QALJu7FLr8eUHJ@ac-7zwglep-shard-00-00.kgsfljc.mongodb.net:27017,ac-7zwglep-shard-00-01.kgsfljc.mongodb.net:27017,ac-7zwglep-shard-00-02.kgsfljc.mongodb.net:27017/?ssl=true&replicaSet=atlas-rppohd-shard-0&authSource=admin&appName=Agrosence';
    const localURI = 'mongodb://127.0.0.1:27017/agros26';

    try {
        try {
            await mongoose.connect(cloudURI, {
                tlsAllowInvalidCertificates: true,
                serverSelectionTimeoutMS: 3000
            });
            console.log('Connected to MongoDB Atlas (Online Mode)');
            return;
        } catch (cloudErr) {
            console.warn('Internet connection unavailable. Falling back to Local MongoDB...');
        }

        await mongoose.disconnect().catch(() => {});
        await mongoose.connect(localURI, { serverSelectionTimeoutMS: 3000 });
        console.log('Connected to Local MongoDB (Offline Mode)');
    } catch (err) {
        console.error('❌ Local MongoDB connection failed:', err);
        process.exit(1);
    }
};

module.exports = connectDB;
