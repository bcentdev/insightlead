import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { drizzle } from 'drizzle-orm/d1';
import { teams, peers, objectives, metrics } from '../db/schema';
import { teamsRouter } from './routes/teams';
import { peersRouter } from './routes/peers';
import { objectivesRouter } from './routes/objectives';
import { metricsRouter } from './routes/metrics';

type Bindings = {
  DB: D1Database;
  ASSETS: Fetcher;
  NODE_ENV: string;
  VITE_STORAGE_TYPE: string;
  VITE_API_BASE_URL: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware for API routes only
app.use('/api/*', cors({
  origin: ['https://insightlead.example.workers.dev', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Initialize database middleware for API routes
app.use('/api/*', async (c, next) => {
  const db = drizzle(c.env.DB);
  c.set('db', db);
  await next();
});

// API Routes
app.route('/api/teams', teamsRouter);
app.route('/api/peers', peersRouter);
app.route('/api/objectives', objectivesRouter);
app.route('/api/metrics', metricsRouter);

// API Health check
app.get('/api/health', (c) => {
  return c.json({ 
    message: 'InsightLead API is running',
    environment: c.env.NODE_ENV,
    storageType: c.env.VITE_STORAGE_TYPE 
  });
});

// Serve static assets (frontend)
app.get('*', async (c) => {
  try {
    // Try to get the asset from the ASSETS binding
    const asset = await c.env.ASSETS.fetch(c.req.url);
    
    if (asset.status === 404) {
      // If asset not found, serve index.html for SPA routing
      const indexAsset = await c.env.ASSETS.fetch(new URL('/index.html', c.req.url).toString());
      return indexAsset;
    }
    
    return asset;
  } catch (error) {
    console.error('Error serving static asset:', error);
    return c.text('Asset not found', 404);
  }
});

export default app;