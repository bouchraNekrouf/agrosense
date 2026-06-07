const mongoose = require('mongoose');

const connectDB = async () => {
    const cloudURI = 'mongodb://nekroufbouchra31_db_user:W2QALJu7FLr8eUHJ@ac-7zwglep-shard-00-00.kgsfljc.mongodb.net:27017,ac-7zwglep-shard-00-01.kgsfljc.mongodb.net:27017,ac-7zwglep-shard-00-02.kgsfljc.mongodb.net:27017/?ssl=true&replicaSet=atlas-rppohd-shard-0&authSource=admin&appName=Agrosence';
    const localURI = 'mongodb://127.0.0.1:27017/agros26';

    const connectWithFallback = async () => {
        try {
            await mongoose.connect(cloudURI, {
                tlsAllowInvalidCertificates: true,
                serverSelectionTimeoutMS: 3000
            });
            console.log('Connected to MongoDB Atlas (Online Mode)');
            return 'atlas';
        } catch (cloudErr) {
            console.warn('Internet connection unavailable. Falling back to Local MongoDB...');
            try {
                await mongoose.disconnect().catch(() => {});
                await mongoose.connect(localURI, {
                    serverSelectionTimeoutMS: 3000
                });
                console.log('Connected to Local MongoDB (Offline Mode)');
                return 'local';
            } catch (localErr) {
                console.error('❌ Local MongoDB connection failed:', localErr);
                throw localErr;
            }
        }
    };

    try {
        await connectWithFallback();

        try {
            const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:5000';
            const ModelMetrics = require('../models/ModelMetrics');
            const r = await fetch(`${pythonBackendUrl}/metrics`, { method: 'GET' });
            if (r.ok) {
                const data = await r.json();
                if (data && data.success) {
                    const core = data.metrics || {};
                    await ModelMetrics.findOneAndUpdate(
                        {},
                        {
                            algorithmName: data.algorithm || 'Random Forest',
                            trainProportion: data.split?.train ?? 80,
                            validationProportion: data.split?.validation ?? 0,
                            testProportion: data.split?.test ?? 20,
                            accuracy: core.accuracy ?? 0,
                            precision: core.precision ?? 0,
                            recall: core.recall ?? 0,
                            f1: core.f1 ?? 0,
                            confusionMatrix: data.confusion_matrix || [],
                            labels: data.labels || [],
                            updatedAt: new Date()
                        },
                        { upsert: true, setDefaultsOnInsert: true }
                    );
                }
            }
        } catch (e) {
        }
    } catch (err) {
        process.exit(1);
    }
};

module.exports = connectDB;
