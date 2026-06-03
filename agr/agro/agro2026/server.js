const express = require('express');
const cors = require('cors');
const http = require('http'); // 1. Requis pour Socket.io
const socketIo = require('socket.io'); // 2. Charger Socket.io
const connectDB = require('./config/db');
const Message = require('./models/Message'); // 3. Requis pour sauvegarder les messages via socket

const app = express();
const server = http.createServer(app); // 4. Créer le serveur HTTP
const io = socketIo(server, {
    cors: {
        origin: "*", // Autoriser toutes les connexions pour le développement
        methods: ["GET", "POST"]
    }
});

// Partage de l'instance IO et de la Map avec les controllers
app.set('io', io);
const userSocketMap = new Map();
app.set('userSocketMap', userSocketMap);

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Connexion DB
connectDB();

app.use(express.static(__dirname));

// Routes API
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));

// =============== GESTION DES SOCKETS (REAL-TIME) ===================

io.on('connection', (socket) => {
    console.log('🔌 Un utilisateur est connecté:', socket.id);

    // Quand l'utilisateur s'identifie (Backwards compatibility + Room joining)
    socket.on('join', (userId) => {
        if (userId) {
            socket.join(userId);
            userSocketMap.set(userId, socket.id);
            console.log(`👤 [SOCKET] User ${userId} joined room & updated map.`);
        }
    });

    socket.on('join_user_room', (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`📡 [SOCKET] Room joined successfully: ${userId}`);
        }
    });

    // Quand un utilisateur envoie un message
    socket.on('send_message', async (data) => {
        const { senderId, receiverId, content } = data;
        
        try {
            // 1. Sauvegarder dans MongoDB
            const newMessage = new Message({
                sender: senderId,
                receiver: receiverId,
                content: content,
                timestamp: new Date()
            });
            await newMessage.save();

            // 2. Lookup sender name for notification display
            let senderName = 'Utilisateur';
            try {
                const User = require('./models/User');
                const senderUser = await User.findById(senderId).select('nom');
                if (senderUser && senderUser.nom) senderName = senderUser.nom;
            } catch(e) {}

            const enrichedMessage = {
                ...newMessage.toObject(),
                senderName: senderName
            };

            // 3. Emit to receiver's ROOM (reaches ALL their connections: chat page + navbar)
            io.to(receiverId).emit('receive_message', enrichedMessage);
            console.log(`✉️ Message transmis de ${senderName} (${senderId}) à Room ${receiverId}`);

            // 4. Also emit via direct socket ID for backwards compatibility
            const receiverSocketId = userSocketMap.get(receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receive_message', enrichedMessage);
            }

            // 5. Renvoyer à l'expéditeur pour confirmation/mise à jour UI
            socket.emit('message_sent_confirm', enrichedMessage);

        } catch (err) {
            console.error('Erreur Socket Message Saving:', err);
            socket.emit('error', 'Impossible d\'envoyer le message');
        }
    });

    // Quand un utilisateur commence à écrire
    socket.on('typing', (data) => {
        const { senderId, receiverId } = data;
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user_typing', { senderId });
        }
    });

    // Quand un utilisateur s'arrête d'écrire
    socket.on('stop_typing', (data) => {
        const { senderId, receiverId } = data;
        const receiverSocketId = userSocketMap.get(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit('user_stop_typing', { senderId });
        }
    });

    socket.on('disconnect', () => {
        // Nettoyage de la map au débranchement
        for (let [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                console.log(`🚫 Utilisateur ${userId} déconnecté`);
                break;
            }
        }
    });
});
// ================================================================

// PREDICTION API (Gardée intacte)
app.post('/api/predict', async (req, res) => {
    try {
        const bodyData = req.body;
        const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:5000';
        const response = await fetch(`${pythonBackendUrl}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Fields for Crop model (Crop_recommendation.csv)
                Temperature:  bodyData.Temperature ?? bodyData.temperature,
                Temparature:  bodyData.Temperature ?? bodyData.temperature,
                Humidity:     bodyData.Humidity    ?? bodyData.humidity,
                ph:           bodyData.ph          ?? 6.5,
                Rainfall:     bodyData.Rainfall    ?? 100,
                Nitrogen:     bodyData.Nitrogen    ?? 20,
                Potassium:    bodyData.Potassium   ?? 20,
                Phosphorous:  bodyData.Phosphorous ?? 20,
                // Extra fields for Fertilizer model (data_core.csv)
                // Passing raw strings here to let app.py map Moisture/Soil Type properly
                Moisture:     bodyData.moisture,
                "Soil Type":  bodyData.soil_type,
            })
        });

        const pythonData = await response.json();
        if (pythonData.success) {
            res.json({
                crops: pythonData.crop + (pythonData.crop_confidence ? ` (${pythonData.crop_confidence})` : ''),
                fertilizer: pythonData.fertilizer + (pythonData.fertilizer_confidence ? ` (${pythonData.fertilizer_confidence})` : ''),
                yield: pythonData.yield_estimate
            });
        } else {
            res.status(500).json({ error: "Erreur Model Python: " + pythonData.error });
        }
    } catch (error) {
        res.status(500).json({ error: "Le serveur Python n'est pas disponible !" });
    }
});

app.get('/api/status', (req, res) => {
    res.json({ message: 'Le serveur fonctionne avec succès!' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Le serveur (Socket.io prêt) tourne sur : http://localhost:${PORT}`);
});
