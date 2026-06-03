const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const User = require('../models/User');

async function ensureFriends(userId, otherId) {
    if (!userId || !otherId) return false;
    const [u1, u2] = await Promise.all([
        User.findById(userId).select('friends'),
        User.findById(otherId).select('friends')
    ]);
    if (!u1 || !u2) return false;
    const f1 = (u1.friends || []).map(id => id.toString());
    const f2 = (u2.friends || []).map(id => id.toString());
    return f1.includes(otherId.toString()) && f2.includes(userId.toString());
}

// GET /api/chat/users/:role — Get list of users by role
router.get('/users/:role', auth, async (req, res) => {
    try {
        let query;
        if (req.params.role === 'agriculteur') {
            // Include users without role field (registered before role system)
            query = { $or: [{ role: 'agriculteur' }, { role: { $exists: false } }] };
        } else {
            query = { role: req.params.role };
        }
        const users = await User.find(query).select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});


// GET /api/chat/messages/:userId — Get messages between current user and another user
router.get('/messages/:userId', auth, async (req, res) => {
    try {
        const ok = await ensureFriends(req.user.id, req.params.userId);
        if (!ok) return res.status(403).json({ message: 'Connexion requise: invitation acceptée.' });

        const messages = await Message.find({
            $or: [
                { sender: req.user.id, receiver: req.params.userId },
                { sender: req.params.userId, receiver: req.user.id }
            ]
        }).sort({ timestamp: 1 });
        res.json(messages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// POST /api/chat/send — Send a message
router.post('/send', auth, async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const ok = await ensureFriends(req.user.id, receiverId);
        if (!ok) return res.status(403).json({ message: 'Connexion requise: invitation acceptée.' });

        const message = new Message({
            sender: req.user.id,
            receiver: receiverId,
            content: content
        });

        await message.save();
        res.status(201).json(message);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});

// GET /api/chat/conversations — Get list of users the current user has chatted with
router.get('/conversations', auth, async (req, res) => {
    try {
        const messages = await Message.find({
            $or: [
                { sender: req.user.id },
                { receiver: req.user.id }
            ]
        });

        // Get unique user IDs from conversations
        const userIds = new Set();
        messages.forEach(msg => {
            if (msg.sender.toString() !== req.user.id) userIds.add(msg.sender.toString());
            if (msg.receiver.toString() !== req.user.id) userIds.add(msg.receiver.toString());
        });

        const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('-password');
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Erreur serveur');
    }
});
// =======> ألصق الكود هنا <=======
// 1. جلب الرسائل لي مازالت ما تقراتش
router.get('/unread', auth, async (req, res) => {
    try {
        const me = await User.findById(req.user.id).select('friends');
        const friends = (me && me.friends) ? me.friends : [];
        const unreadMessages = await Message.find({
            receiver: req.user.id,
            lu: false,
            sender: { $in: friends }
        }).populate('sender', 'nom');
        res.json(unreadMessages);
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});

// 2. تحديث الرسائل إلى "مقروءة" كي يدخل للمحادثة
router.put('/mark-read/:senderId', auth, async (req, res) => {
    try {
        const ok = await ensureFriends(req.user.id, req.params.senderId);
        if (!ok) return res.status(403).json({ message: 'Connexion requise: invitation acceptée.' });

        await Message.updateMany(
            { receiver: req.user.id, sender: req.params.senderId, lu: false },
            { $set: { lu: true } }
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});



module.exports = router;
