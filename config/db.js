const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Connexion à la base de données MongoDB Atlas (Standard Format - Sans SRV)
        // Cette méthode est la plus stable sur les réseaux ayant des soucis de DNS
        const cloudURI = 'mongodb://nekroufbouchra31_db_user:W2QALJu7FLr8eUHJ@ac-7zwglep-shard-00-00.kgsfljc.mongodb.net:27017,ac-7zwglep-shard-00-01.kgsfljc.mongodb.net:27017,ac-7zwglep-shard-00-02.kgsfljc.mongodb.net:27017/?ssl=true&replicaSet=atlas-rppohd-shard-0&authSource=admin&appName=Agrosence';

        await mongoose.connect(cloudURI, {
            tlsAllowInvalidCertificates: true, // Pour éviter les soucis de certificats
            connectTimeoutMS: 30000,           // Laisser le temps pour établir la connexion
        });

        console.log('☁️ Connecté à la base de données MongoDB Atlas (Stable) avec succès!');

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
                            validationProportion: 0,
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
        console.error('❌ Erreur de connexion au Cloud (Standard Mode):', err.message);
        process.exit(1);
    }
};

module.exports = connectDB;
