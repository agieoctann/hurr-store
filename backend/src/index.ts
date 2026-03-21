import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import session from 'express-session';
import { Server } from 'socket.io';
import prisma from './lib/prisma';
import { setIO } from './lib/socket';
import passport from './lib/passport';

import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import financeRoutes from './routes/finance.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/users.routes';
import paymentRoutes from './routes/payment.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});
setIO(io); // Share io instance with controllers

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(session({
  secret: process.env.SESSION_SECRET || 'hurr-session-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production', maxAge: 10 * 60 * 1000 }, // 10 min — only needed during OAuth flow
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Root endpoint
app.get('/', (_req: Request, res: Response) => {
  res.json({ status: 'ok', message: 'Hurr Store API v1', endpoints: ['/api/auth', '/api/products', '/api/orders', '/api/finance', '/api/users'] });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);

app.get('/health', async (req: Request, res: Response) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', error });
  }
});

// Socket.io Setup
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_room', (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // Admin joins a central admin_room to receive all user notifications
  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log(`Admin ${socket.id} joined admin_room`);
  });

  socket.on('send_message', (data) => {
    // Broadcast to the user's room
    io.to(data.room).emit('receive_message', data);
    // If the sender is a user (not admin), notify admin_room
    if (data.senderRole !== 'ADMIN') {
      io.to('admin_room').emit('new_user_message', {
        room: data.room,
        senderId: data.senderId,
        text: data.text,
        timestamp: data.timestamp,
      });
    }
  });

  socket.on('typing', (data: { room: string; senderId: string }) => {
    socket.to(data.room).emit('typing', { senderId: data.senderId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;


server.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
