import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import qaRoutes from './routes/qa';
import postsRoutes from './routes/posts';
import usersRoutes from './routes/users';
import mockRoutes from './routes/mock';
import uploadRoutes, { uploadDir } from './routes/upload';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadDir));
app.use('/api/upload', uploadRoutes);

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/qa-community')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    console.log('⚠️  Server will continue running without database connection');
  });

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'QA Community API is running',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API Routes
// Use mock routes if MongoDB is not connected
if (mongoose.connection.readyState !== 1) {
  console.log('⚠️  Using mock data (MongoDB not connected)');
  app.use('/api', mockRoutes);
} else {
  app.use('/api/qa', qaRoutes);
  app.use('/api/posts', postsRoutes);
  app.use('/api/users', usersRoutes);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`📍 API base URL: http://localhost:${PORT}/api`);
});

export default app;
