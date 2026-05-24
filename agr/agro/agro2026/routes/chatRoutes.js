const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Message = require('../models/Message');
const User = require('../models/User');

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
        const unreadMessages = await Message.find({
            receiver: req.user.id,
            lu: false
        }).populate('sender', 'nom');
        res.json(unreadMessages);
    } catch (err) {
        res.status(500).send('Erreur serveur');
    }
});

// 2. تحديث الرسائل إلى "مقروءة" كي يدخل للمحادثة
router.put('/mark-read/:senderId', auth, async (req, res) => {
    try {
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
