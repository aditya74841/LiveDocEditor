// import 'dotenv/config';
// import express from 'express';
// import http from 'http';
// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';
// import rateLimit from 'express-rate-limit';
// import { Server } from 'socket.io';
// import jwt from 'jsonwebtoken';

// import { connectDB, closeDB } from './database/index.js';
// import { registerDocumentHandlers } from './sockets/documentHandlers.js';
// import logger from './utils/logger.js';

// const { CLIENT_ORIGIN, PORT = 9000, JWT_SECRET } = process.env;

// if (!CLIENT_ORIGIN) throw new Error('CLIENT_ORIGIN env variable missing');
// if (!JWT_SECRET) throw new Error('JWT_SECRET env variable missing');

// const app = express();

// // Basic rate limiter (e.g. apply to REST endpoints if any)
// const limiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   max: 60, // limit each IP to 60 requests per windowMs
// });
// app.use(limiter);

// app.use(helmet());
// app.use(cors({
//   origin: CLIENT_ORIGIN,
//   methods: ['GET', 'POST'],
// }));
// app.use(morgan('combined'));
// app.use(express.json({ limit: '1mb' }));
// app.use(express.urlencoded({ extended: true }));

// app.get('/health', (_req, res) => res.send('OK'));

// // Create HTTP and Socket.IO servers
// const httpServer = http.createServer(app);
// const io = new Server(httpServer, {
//   cors: {
//     origin: CLIENT_ORIGIN,
//     methods: ['GET', 'POST'],
//   }
// });

// // Socket.IO authentication middleware using JWT
// io.use((socket, next) => {
//   const token = socket.handshake.auth?.token;
//   if (!token) {
//     return next(new Error('Authentication error: token missing'));
//   }
//   try {
//     const payload = jwt.verify(token, JWT_SECRET);
//     socket.user = payload; // attach user info to socket object if needed
//     next();
//   } catch (err) {
//     return next(new Error('Authentication error: invalid token'));
//   }
// });

// // Register socket handlers on connection
// io.on('connection', (socket) => {
//   logger.info(`Socket connected: ${socket.id}, user: ${socket.user?.id || 'unknown'}`);
//   registerDocumentHandlers(io, socket);

//   socket.on('disconnect', () => {
//     logger.info(`Socket disconnected: ${socket.id}`);
//   });
// });

// // Start app after DB connection
// async function startServer() {
//   try {
//     await connectDB();

//     httpServer.listen(PORT, () => {
//       logger.info(`Server running on port ${PORT}`);
//     });
//   } catch (err) {
//     logger.error('Failed to start server', err);
//     process.exit(1);
//   }
// }
// startServer();

// // Graceful shutdown handling
// const shutdownSignals = ['SIGTERM', 'SIGINT'];

// shutdownSignals.forEach((signal) => {
//   process.on(signal, async () => {
//     try {
//       logger.info(`Received ${signal}. Closing server...`);
//       io.close();
//       await new Promise((resolve) => httpServer.close(resolve));
//       await closeDB();
//       logger.info('Server shutdown complete');
//       process.exit(0);
//     } catch (err) {
//       logger.error('Error during server shutdown', err);
//       process.exit(1);
//     }
//   });
// });

import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { Server } from "socket.io";

import { connectDB, closeDB } from "./database/index.js";
import { registerDocumentHandlers } from "./sockets/documentHandlers.js";
import logger from "./utils/logger.js";

const { CLIENT_ORIGIN, PORT = 9000 } = process.env;
if (!CLIENT_ORIGIN) throw new Error("CLIENT_ORIGIN env variable missing");

const app = express();

// Rate limiter for REST endpoints (optional)
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
});
app.use(limiter);

app.use(helmet());
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  })
);
app.use(morgan("combined"));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));


app.get("/", (_req, res) => res.send("<h1>Server is healthy </h1>"));


app.get("/health", (_req, res) => res.send("OK"));

// Create HTTP and Socket.IO servers
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
  pingInterval: 25000, // default is 25000 ms (25 seconds)
  pingTimeout: 60000, // default is 60000 ms (60 seconds)
});

// --- NO AUTH MIDDLEWARE: Open socket connection

// Register socket handlers on connection
io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id}`);
  registerDocumentHandlers(io, socket);

  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// Start after DB connection
async function startServer() {
  try {
    await connectDB();

    httpServer.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start server", err);
    process.exit(1);
  }
}
startServer();

// Graceful shutdown
["SIGTERM", "SIGINT"].forEach((signal) => {
  process.on(signal, async () => {
    try {
      logger.info(`Received ${signal}. Closing server...`);
      io.close();
      await new Promise((resolve) => httpServer.close(resolve));
      await closeDB();
      logger.info("Server shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error("Error during server shutdown", err);
      process.exit(1);
    }
  });
});
