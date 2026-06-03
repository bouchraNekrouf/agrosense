const Report = require('../models/Report');
const User = require('../models/User');

function isExpertRole(role) {
    const r = String(role || '').toLowerCase();
    return r === 'expert' || r === 'expertt';
}

function isFarmerRole(role) {
    return String(role || '').toLowerCase() === 'agriculteur';
}

function parsePdfDataUrl(pdfData) {
    const v = String(pdfData || '').trim();
    if (!v.startsWith('data:')) return null;
    const match = v.match(/^data:([^;]+)(?:;[^,]*)*;base64,(.+)$/i);
    if (!match) return null;
    const mimeType = match[1] || 'application/pdf';
    const base64 = match[2];
    return { mimeType, buffer: Buffer.from(base64, 'base64') };
}

function reportForFarmer(r) {
    const last = r.lastSentExpert && typeof r.lastSentExpert === 'object'
        ? { id: r.lastSentExpert._id, nom: r.lastSentExpert.nom || '', localisation: r.lastSentExpert.localisation || '' }
        : (r.lastSentExpert ? { id: r.lastSentExpert, nom: '', localisation: '' } : null);
    return {
        id: r._id,
        title: r.title || '',
        crop: r.crop || '',
        fertilizer: r.fertilizer || '',
        yieldEstimate: r.yieldEstimate || '',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        status: r.deliveries && r.deliveries.length > 0 ? 'Envoyé' : 'Non envoyé',
        lastSentExpert: last,
        deliveriesCount: (r.deliveries || []).length,
        inputs: r.inputs || null
    };
}

function reportForExpert(r, expertId) {
    const delivery = (r.deliveries || []).find(d => d.expert && d.expert.toString() === expertId.toString()) || null;
    return {
        id: r._id,
        title: r.title || '',
        crop: r.crop || '',
        fertilizer: r.fertilizer || '',
        yieldEstimate: r.yieldEstimate || '',
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        farmer: r.farmer,
        sentAt: delivery ? delivery.sentAt : null,
        comment: delivery ? delivery.comment : '',
        reply: delivery ? delivery.reply : '',
        commentedAt: delivery ? delivery.commentedAt : null,
        inputs: r.inputs || null
    };
}

exports.createReport = async (req, res) => {
    try {
        if (!req.user || !isFarmerRole(req.user.role)) {
            return res.status(403).json({ message: "Accès refusé" });
        }

        const { title, crop, fertilizer, yieldEstimate, inputs, pdfData, fileName } = req.body || {};
        const parsed = parsePdfDataUrl(pdfData);
        if (!parsed || !parsed.buffer || parsed.buffer.length === 0) {
            return res.status(400).json({ message: "PDF invalide" });
        }

        const report = new Report({
            farmer: req.user.id,
            title: String(title || ''),
            crop: String(crop || ''),
            fertilizer: String(fertilizer || ''),
            yieldEstimate: String(yieldEstimate || ''),
            inputs: inputs ?? null,
            pdf: {
                data: parsed.buffer,
                mimeType: parsed.mimeType || 'application/pdf',
                fileName: String(fileName || 'rapport_agronomique.pdf')
            }
        });

        await report.save();
        res.status(201).json(reportForFarmer(report));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.listMyReports = async (req, res) => {
    try {
        if (!req.user || !isFarmerRole(req.user.role)) {
            return res.status(403).json({ message: "Accès refusé" });
        }

        const reports = await Report.find({ farmer: req.user.id, deletedByFarmer: { $ne: true } })
            .sort({ createdAt: -1 })
            .populate('lastSentExpert', 'nom localisation')
            .select('-pdf.data');

        res.json(reports.map(reportForFarmer));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.listReceivedReports = async (req, res) => {
    try {
        if (!req.user || !isExpertRole(req.user.role)) {
            return res.status(403).json({ message: "Accès refusé" });
        }

        const reports = await Report.find({ 'deliveries.expert': req.user.id })
            .sort({ updatedAt: -1 })
            .populate('farmer', 'nom email localisation')
            .select('-pdf.data');

        res.json(reports.map(r => reportForExpert(r, req.user.id)));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.sendReportToExpert = async (req, res) => {
    try {
        if (!req.user || !isFarmerRole(req.user.role)) {
            return res.status(403).json({ message: "Accès refusé" });
        }

        const { id } = req.params;
        const { expertId } = req.body || {};
        if (!expertId) return res.status(400).json({ message: "Expert requis" });

        const [me, other] = await Promise.all([
            User.findById(req.user.id).select('friends'),
            User.findById(expertId).select('friends role nom')
        ]);
        if (!me || !other) return res.status(400).json({ message: "Expert invalide" });
        if (!isExpertRole(other.role)) return res.status(400).json({ message: "Expert invalide" });

        const myFriends = (me.friends || []).map(x => x.toString());
        const otherFriends = (other.friends || []).map(x => x.toString());
        const isFriends = myFriends.includes(expertId.toString()) && otherFriends.includes(req.user.id.toString());
        if (!isFriends) return res.status(403).json({ message: "Vous ne pouvez envoyer un rapport qu'à un expert ami (invitation acceptée)." });

        const report = await Report.findOne({ _id: id, farmer: req.user.id });
        if (!report) return res.status(404).json({ message: "Rapport introuvable" });

        const already = (report.deliveries || []).some(d => d.expert && d.expert.toString() === expertId.toString());
        if (!already) {
            report.deliveries.push({ expert: expertId, sentAt: new Date() });
        } else {
            const idx = report.deliveries.findIndex(d => d.expert && d.expert.toString() === expertId.toString());
            if (idx !== -1) report.deliveries[idx].sentAt = new Date();
        }

        report.lastSentExpert = expertId;
        await report.save();

        res.json({ message: "Rapport envoyé", report: reportForFarmer(report) });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

async function canAccessReport(user, report) {
    if (!user || !report) return false;
    if (isFarmerRole(user.role) && report.farmer.toString() === user.id.toString()) return true;
    if (isExpertRole(user.role)) {
        return (report.deliveries || []).some(d => d.expert && d.expert.toString() === user.id.toString());
    }
    if (user.role === 'admin') return true;
    return false;
}

exports.downloadReport = async (req, res) => {
    try {
        const { id } = req.params;
        const report = await Report.findById(id);
        if (!report) return res.status(404).json({ message: "Rapport introuvable" });

        const ok = await canAccessReport(req.user, report);
        if (!ok) return res.status(403).json({ message: "Accès refusé" });

        const mime = (report.pdf && report.pdf.mimeType) ? report.pdf.mimeType : 'application/pdf';
        const fileName = (report.pdf && report.pdf.fileName) ? report.pdf.fileName : 'rapport_agronomique.pdf';
        res.setHeader('Content-Type', mime);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName.replace(/"/g, '')}"`);
        res.send(report.pdf.data);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.addFeedback = async (req, res) => {
    try {
        if (!req.user || !isExpertRole(req.user.role)) {
            return res.status(403).json({ message: "Accès refusé" });
        }

        const { id } = req.params;
        const { comment, reply } = req.body || {};
        const report = await Report.findById(id);
        if (!report) return res.status(404).json({ message: "Rapport introuvable" });

        const idx = (report.deliveries || []).findIndex(d => d.expert && d.expert.toString() === req.user.id.toString());
        if (idx === -1) return res.status(403).json({ message: "Accès refusé" });

        if (typeof comment === 'string') report.deliveries[idx].comment = comment;
        if (typeof reply === 'string') report.deliveries[idx].reply = reply;
        report.deliveries[idx].commentedAt = new Date();
        await report.save();

        res.json({ message: "Recommandations enregistrées" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};

exports.deleteReportForFarmer = async (req, res) => {
    try {
        if (!req.user || !isFarmerRole(req.user.role)) {
            return res.status(403).json({ message: "Accès refusé" });
        }

        const { id } = req.params;
        const report = await Report.findOne({ _id: id, farmer: req.user.id });
        if (!report) return res.status(404).json({ message: "Rapport introuvable" });

        report.deletedByFarmer = true;
        await report.save();

        res.json({ message: "Rapport supprimé" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Erreur serveur" });
    }
};
