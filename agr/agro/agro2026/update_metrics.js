const mongoose = require('mongoose');
const connectDB = require('./config/db');
const ModelMetrics = require('./models/ModelMetrics');

// Extraire les arguments passés au script
const args = {};
process.argv.forEach((val, index) => {
    if (val.startsWith('--')) {
        const key = val.substring(2);
        const nextVal = process.argv[index + 1];
        if (nextVal && !nextVal.startsWith('--')) {
            args[key] = parseFloat(nextVal);
        }
    }
});

async function run() {
    try {
        console.log('🔌 Connexion à la base de données MongoDB...');
        await connectDB();
        
        let metrics = await ModelMetrics.findOne();
        if (!metrics) {
            metrics = new ModelMetrics();
        }

        if (args.accuracy !== undefined) metrics.accuracy = args.accuracy;
        if (args.precision !== undefined) metrics.precision = args.precision;
        if (args.recall !== undefined) metrics.recall = args.recall;
        if (args.f1 !== undefined) metrics.f1 = args.f1;
        if (args.train !== undefined) metrics.trainProportion = args.train;
        if (args.validation !== undefined) metrics.validationProportion = args.validation;
        if (args.test !== undefined) metrics.testProportion = args.test;

        metrics.updatedAt = new Date();
        await metrics.save();

        console.log('\n======================================================');
        console.log('✅ Métriques du modèle d\'IA mises à jour avec succès !');
        console.log('======================================================');
        console.log(`Répartition : Train ${metrics.trainProportion}% | Val ${metrics.validationProportion}% | Test ${metrics.testProportion}%`);
        console.log(`Accuracy    : ${metrics.accuracy}`);
        console.log(`Precision   : ${metrics.precision}`);
        console.log(`Recall      : ${metrics.recall}`);
        console.log(`F1-Score    : ${metrics.f1}`);
        console.log('======================================================\n');

        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Une erreur est survenue lors de la mise à jour :', err);
        process.exit(1);
    }
}

run();
