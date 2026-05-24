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
        if (args.sensitivity !== undefined) metrics.sensitivity = args.sensitivity;
        if (args.specificity !== undefined) metrics.specificity = args.specificity;
        if (args.tp !== undefined) metrics.tp = args.tp;
        if (args.tn !== undefined) metrics.tn = args.tn;
        if (args.fp !== undefined) metrics.fp = args.fp;
        if (args.fn !== undefined) metrics.fn = args.fn;
        if (args.test !== undefined) metrics.testProportion = args.test;

        metrics.updatedAt = new Date();
        await metrics.save();

        console.log('\n======================================================');
        console.log('✅ Métriques du modèle d\'IA mises à jour avec succès !');
        console.log('======================================================');
        console.log(`Proportion de test (Test %) : ${metrics.testProportion}%`);
        console.log(`Accuracy                    : ${metrics.accuracy}%`);
        console.log(`Sensitivity                 : ${metrics.sensitivity}%`);
        console.log(`Specificity                 : ${metrics.specificity}%`);
        console.log('------------------------------------------------------');
        console.log('Matrice de confusion :');
        console.log(`  TP (True Positive)  : ${metrics.tp}`);
        console.log(`  TN (True Negative)  : ${metrics.tn}`);
        console.log(`  FP (False Positive) : ${metrics.fp}`);
        console.log(`  FN (False Negative) : ${metrics.fn}`);
        console.log('======================================================\n');

        mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error('❌ Une erreur est survenue lors de la mise à jour :', err);
        process.exit(1);
    }
}

run();
