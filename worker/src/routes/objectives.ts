import { Hono } from 'hono';
import { eq, and } from 'drizzle-orm';
import { objectives, objectiveMetrics, peers, type NewObjective, type NewObjectiveMetric } from '../../db/schema';
import { v4 as uuidv4 } from 'uuid';

type Variables = {
  db: any;
};

export const objectivesRouter = new Hono<{ Variables: Variables }>();

// GET /api/objectives - Get all objectives
objectivesRouter.get('/', async (c) => {
  try {
    const db = c.get('db');
    const peerId = c.req.query('peerId');

    let query = db
      .select({
        id: objectives.id,
        title: objectives.title,
        description: objectives.description,
        peerId: objectives.peerId,
        category: objectives.category,
        priority: objectives.priority,
        progress: objectives.progress,
        targetDate: objectives.targetDate,
        createdAt: objectives.createdAt,
        updatedAt: objectives.updatedAt,
        completedAt: objectives.completedAt,
        tags: objectives.tags,
        peerName: peers.name,
      })
      .from(objectives)
      .leftJoin(peers, eq(objectives.peerId, peers.id));

    if (peerId) {
      query = query.where(eq(objectives.peerId, peerId));
    }

    const allObjectives = await query;

    // Get metrics for each objective
    const objectivesWithMetrics = await Promise.all(
      allObjectives.map(async (objective) => {
        const metrics = await db
          .select()
          .from(objectiveMetrics)
          .where(eq(objectiveMetrics.objectiveId, objective.id));

        return {
          ...objective,
          tags: objective.tags ? JSON.parse(objective.tags) : [],
          metrics,
        };
      })
    );

    return c.json(objectivesWithMetrics);
  } catch (error) {
    console.error('Error fetching objectives:', error);
    return c.json({ error: 'Failed to fetch objectives' }, 500);
  }
});

// GET /api/objectives/:id - Get objective by ID
objectivesRouter.get('/:id', async (c) => {
  try {
    const db = c.get('db');
    const objectiveId = c.req.param('id');

    const objective = await db
      .select({
        id: objectives.id,
        title: objectives.title,
        description: objectives.description,
        peerId: objectives.peerId,
        category: objectives.category,
        priority: objectives.priority,
        progress: objectives.progress,
        targetDate: objectives.targetDate,
        createdAt: objectives.createdAt,
        updatedAt: objectives.updatedAt,
        completedAt: objectives.completedAt,
        tags: objectives.tags,
        peerName: peers.name,
      })
      .from(objectives)
      .leftJoin(peers, eq(objectives.peerId, peers.id))
      .where(eq(objectives.id, objectiveId))
      .limit(1);

    if (objective.length === 0) {
      return c.json({ error: 'Objective not found' }, 404);
    }

    // Get metrics
    const metrics = await db
      .select()
      .from(objectiveMetrics)
      .where(eq(objectiveMetrics.objectiveId, objectiveId));

    const result = {
      ...objective[0],
      tags: objective[0].tags ? JSON.parse(objective[0].tags) : [],
      metrics,
    };

    return c.json(result);
  } catch (error) {
    console.error('Error fetching objective:', error);
    return c.json({ error: 'Failed to fetch objective' }, 500);
  }
});

// POST /api/objectives - Create new objective
objectivesRouter.post('/', async (c) => {
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

    const newObjective: NewObjective = {
      id: body.id || uuidv4(),
      title: body.title,
      description: body.description,
      peerId: body.peerId,
      category: body.category,
      priority: body.priority,
      progress: body.progress || 0,
      targetDate: new Date(body.targetDate),
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: body.completedAt ? new Date(body.completedAt) : null,
      tags: body.tags ? JSON.stringify(body.tags) : null,
    };

    const [insertedObjective] = await db
      .insert(objectives)
      .values(newObjective)
      .returning();

    // Insert metrics if provided
    if (body.metrics && body.metrics.length > 0) {
      const metricsToInsert: NewObjectiveMetric[] = body.metrics.map((metric: any) => ({
        id: uuidv4(),
        objectiveId: insertedObjective.id,
        name: metric.name,
        target: metric.target,
        current: metric.current,
        unit: metric.unit,
        updatedAt: new Date(),
      }));

      await db.insert(objectiveMetrics).values(metricsToInsert);
    }

    return c.json({
      ...insertedObjective,
      tags: insertedObjective.tags ? JSON.parse(insertedObjective.tags) : [],
      metrics: body.metrics || [],
    }, 201);
  } catch (error) {
    console.error('Error creating objective:', error);
    return c.json({ error: 'Failed to create objective' }, 500);
  }
});

// PUT /api/objectives/:id - Update objective
objectivesRouter.put('/:id', async (c) => {
  try {
    const db = c.get('db');
    const objectiveId = c.req.param('id');
    const body = await c.req.json();

    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };

    if (body.tags) {
      updateData.tags = JSON.stringify(body.tags);
    }

    if (body.targetDate) {
      updateData.targetDate = new Date(body.targetDate);
    }

    if (body.completedAt) {
      updateData.completedAt = new Date(body.completedAt);
    }

    const [updatedObjective] = await db
      .update(objectives)
      .set(updateData)
      .where(eq(objectives.id, objectiveId))
      .returning();

    if (!updatedObjective) {
      return c.json({ error: 'Objective not found' }, 404);
    }

    return c.json({
      ...updatedObjective,
      tags: updatedObjective.tags ? JSON.parse(updatedObjective.tags) : [],
    });
  } catch (error) {
    console.error('Error updating objective:', error);
    return c.json({ error: 'Failed to update objective' }, 500);
  }
});

// DELETE /api/objectives/:id - Delete objective
objectivesRouter.delete('/:id', async (c) => {
  try {
    const db = c.get('db');
    const objectiveId = c.req.param('id');

    // Delete metrics first (cascade)
    await db
      .delete(objectiveMetrics)
      .where(eq(objectiveMetrics.objectiveId, objectiveId));

    const [deletedObjective] = await db
      .delete(objectives)
      .where(eq(objectives.id, objectiveId))
      .returning();

    if (!deletedObjective) {
      return c.json({ error: 'Objective not found' }, 404);
    }

    return c.json({ message: 'Objective deleted successfully' });
  } catch (error) {
    console.error('Error deleting objective:', error);
    return c.json({ error: 'Failed to delete objective' }, 500);
  }
});

// POST /api/objectives/:id/metrics - Add metric to objective
objectivesRouter.post('/:id/metrics', async (c) => {
  try {
    const db = c.get('db');
    const objectiveId = c.req.param('id');
    const body = await c.req.json();

    const newMetric: NewObjectiveMetric = {
      id: uuidv4(),
      objectiveId,
      name: body.name,
      target: body.target,
      current: body.current,
      unit: body.unit,
      updatedAt: new Date(),
    };

    const [insertedMetric] = await db
      .insert(objectiveMetrics)
      .values(newMetric)
      .returning();

    return c.json(insertedMetric, 201);
  } catch (error) {
    console.error('Error adding metric:', error);
    return c.json({ error: 'Failed to add metric' }, 500);
  }
});

// PUT /api/objectives/:id/metrics/:metricId - Update metric
objectivesRouter.put('/:id/metrics/:metricId', async (c) => {
  try {
    const db = c.get('db');
    const objectiveId = c.req.param('id');
    const metricId = c.req.param('metricId');
    const body = await c.req.json();

    const [updatedMetric] = await db
      .update(objectiveMetrics)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(objectiveMetrics.id, metricId),
          eq(objectiveMetrics.objectiveId, objectiveId)
        )
      )
      .returning();

    if (!updatedMetric) {
      return c.json({ error: 'Metric not found' }, 404);
    }

    return c.json(updatedMetric);
  } catch (error) {
    console.error('Error updating metric:', error);
    return c.json({ error: 'Failed to update metric' }, 500);
  }
});