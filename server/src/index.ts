import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api', routes);

// Error Handling
app.use(errorHandler);

// Connect DB & start server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`===================================================`);
      console.log(`[HemaMatch Server] Running at: http://localhost:${PORT}`);
      console.log(`[API Base] http://localhost:${PORT}/api`);
      console.log(`[Health] http://localhost:${PORT}/api/health`);
      console.log(`===================================================`);
    });
  } catch (err) {
    console.error('Failed to launch server:', err);
    process.exit(1);
  }
};

startServer();
