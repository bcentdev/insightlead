import { Hono } from 'hono';
import { eq, and, gte, lte, sql } from 'drizzle-orm';
import { metrics, peers, type NewMetric } from '../../db/schema';
import { v4 as uuidv4 } from 'uuid';

type Variables = {
  db: any;
};

export const metricsRouter = new Hono<{ Variables: Variables }>();

// GET /api/metrics - Get all metrics with filtering
metricsRouter.get('/', async (c) => {
  try {
    const db = c.get('db');
    const peerId = c.req.query('peerId');
    const source = c.req.query('source');
    const type = c.req.query('type');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    let query = db
      .select({
        id: metrics.id,
        peerId: metrics.peerId,
        source: metrics.source,
        type: metrics.type,
        value: metrics.value,
        metadata: metrics.metadata,
        timestamp: metrics.timestamp,
        createdAt: metrics.createdAt,
        peerName: peers.name,
        peerGithubUsername: peers.githubUsername,
      })
      .from(metrics)
      .leftJoin(peers, eq(metrics.peerId, peers.id));

    // Apply filters
    const conditions = [];
    if (peerId) conditions.push(eq(metrics.peerId, peerId));
    if (source) conditions.push(eq(metrics.source, source));
    if (type) conditions.push(eq(metrics.type, type));
    if (startDate) conditions.push(gte(metrics.timestamp, new Date(startDate)));
    if (endDate) conditions.push(lte(metrics.timestamp, new Date(endDate)));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const allMetrics = await query.orderBy(metrics.timestamp);

    // Parse metadata JSON
    const metricsWithParsedMetadata = allMetrics.map(metric => ({
      ...metric,
      metadata: metric.metadata ? JSON.parse(metric.metadata) : {},
    }));

    return c.json(metricsWithParsedMetadata);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return c.json({ error: 'Failed to fetch metrics' }, 500);
  }
});

// GET /api/metrics/summary - Get metrics summary by peer
metricsRouter.get('/summary', async (c) => {
  try {
    const db = c.get('db');
    const peerId = c.req.query('peerId');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    let conditions = [];
    if (peerId) conditions.push(eq(metrics.peerId, peerId));
    if (startDate) conditions.push(gte(metrics.timestamp, new Date(startDate)));
    if (endDate) conditions.push(lte(metrics.timestamp, new Date(endDate)));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const summary = await db
      .select({
        peerId: metrics.peerId,
        peerName: peers.name,
        source: metrics.source,
        type: metrics.type,
        totalValue: sql<number>`SUM(${metrics.value})`,
        avgValue: sql<number>`AVG(${metrics.value})`,
        count: sql<number>`COUNT(*)`,
        lastUpdated: sql<Date>`MAX(${metrics.timestamp})`,
      })
      .from(metrics)
      .leftJoin(peers, eq(metrics.peerId, peers.id))
      .where(whereClause)
      .groupBy(metrics.peerId, metrics.source, metrics.type);

    return c.json(summary);
  } catch (error) {
    console.error('Error fetching metrics summary:', error);
    return c.json({ error: 'Failed to fetch metrics summary' }, 500);
  }
});

// GET /api/metrics/trends - Get metrics trends over time
metricsRouter.get('/trends', async (c) => {
  try {
    const db = c.get('db');
    const peerId = c.req.query('peerId');
    const type = c.req.query('type');
    const period = c.req.query('period') || 'daily'; // daily, weekly, monthly

    let dateFormat;
    switch (period) {
      case 'weekly':
        dateFormat = `strftime('%Y-W%W', ${metrics.timestamp})`;
        break;
      case 'monthly':
        dateFormat = `strftime('%Y-%m', ${metrics.timestamp})`;
        break;
      default:
        dateFormat = `strftime('%Y-%m-%d', ${metrics.timestamp})`;
    }

    let query = db
      .select({
        peerId: metrics.peerId,
        peerName: peers.name,
        type: metrics.type,
        period: sql`${sql.raw(dateFormat)}`,
        totalValue: sql<number>`SUM(${metrics.value})`,
        avgValue: sql<number>`AVG(${metrics.value})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(metrics)
      .leftJoin(peers, eq(metrics.peerId, peers.id));

    const conditions = [];
    if (peerId) conditions.push(eq(metrics.peerId, peerId));
    if (type) conditions.push(eq(metrics.type, type));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const trends = await query
      .groupBy(metrics.peerId, metrics.type, sql.raw(dateFormat))
      .orderBy(sql.raw(dateFormat));

    return c.json(trends);
  } catch (error) {
    console.error('Error fetching metrics trends:', error);
    return c.json({ error: 'Failed to fetch metrics trends' }, 500);
  }
});

// POST /api/metrics - Create new metric
metricsRouter.post('/', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();

    // Validate peer exists
    const peer = await db
      .select()
      .from(peers)
      .where(eq(peers.id, body.peerId))
      .limit(1);

    if (peer.length === 0) {
      return c.json({ error: 'Peer not found' }, 400);
    }

    const newMetric: NewMetric = {
      id: body.id || uuidv4(),
      peerId: body.peerId,
      source: body.source,
      type: body.type,
      value: body.value,
      metadata: body.metadata ? JSON.stringify(body.metadata) : null,
      timestamp: new Date(body.timestamp),
      createdAt: new Date(),
    };

    const [insertedMetric] = await db
      .insert(metrics)
      .values(newMetric)
      .returning();

    return c.json({
      ...insertedMetric,
      metadata: insertedMetric.metadata ? JSON.parse(insertedMetric.metadata) : {},
    }, 201);
  } catch (error) {
    console.error('Error creating metric:', error);
    return c.json({ error: 'Failed to create metric' }, 500);
  }
});

// POST /api/metrics/bulk - Create multiple metrics
metricsRouter.post('/bulk', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();
    const metricsData = body.metrics;

    if (!Array.isArray(metricsData)) {
      return c.json({ error: 'Expected an array of metrics' }, 400);
    }

    const newMetrics: NewMetric[] = metricsData.map(metric => ({
      id: metric.id || uuidv4(),
      peerId: metric.peerId,
      source: metric.source,
      type: metric.type,
      value: metric.value,
      metadata: metric.metadata ? JSON.stringify(metric.metadata) : null,
      timestamp: new Date(metric.timestamp),
      createdAt: new Date(),
    }));

    const insertedMetrics = await db
      .insert(metrics)
      .values(newMetrics)
      .returning();

    return c.json({
      message: `${insertedMetrics.length} metrics created successfully`,
      metrics: insertedMetrics.map(metric => ({
        ...metric,
        metadata: metric.metadata ? JSON.parse(metric.metadata) : {},
      })),
    }, 201);
  } catch (error) {
    console.error('Error creating bulk metrics:', error);
    return c.json({ error: 'Failed to create bulk metrics' }, 500);
  }
});

// DELETE /api/metrics/:id - Delete metric
metricsRouter.delete('/:id', async (c) => {
  try {
    const db = c.get('db');
    const metricId = c.req.param('id');

    const [deletedMetric] = await db
      .delete(metrics)
      .where(eq(metrics.id, metricId))
      .returning();

    if (!deletedMetric) {
      return c.json({ error: 'Metric not found' }, 404);
    }

    return c.json({ message: 'Metric deleted successfully' });
  } catch (error) {
    console.error('Error deleting metric:', error);
    return c.json({ error: 'Failed to delete metric' }, 500);
  }
});