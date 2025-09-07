import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { peers, teams, type NewPeer } from '../../db/schema';
import { v4 as uuidv4 } from 'uuid';

type Variables = {
  db: any;
};

export const peersRouter = new Hono<{ Variables: Variables }>();

// GET /api/peers - Get all peers
peersRouter.get('/', async (c) => {
  try {
    const db = c.get('db');
    const teamId = c.req.query('teamId');

    let query = db
      .select({
        id: peers.id,
        name: peers.name,
        email: peers.email,
        githubUsername: peers.githubUsername,
        jiraUsername: peers.jiraUsername,
        teamId: peers.teamId,
        role: peers.role,
        seniority: peers.seniority,
        avatar: peers.avatar,
        createdAt: peers.createdAt,
        updatedAt: peers.updatedAt,
        teamName: teams.name,
      })
      .from(peers)
      .leftJoin(teams, eq(peers.teamId, teams.id));

    if (teamId) {
      query = query.where(eq(peers.teamId, teamId));
    }

    const allPeers = await query;
    return c.json(allPeers);
  } catch (error) {
    console.error('Error fetching peers:', error);
    return c.json({ error: 'Failed to fetch peers' }, 500);
  }
});

// GET /api/peers/:id - Get peer by ID
peersRouter.get('/:id', async (c) => {
  try {
    const db = c.get('db');
    const peerId = c.req.param('id');

    const peer = await db
      .select({
        id: peers.id,
        name: peers.name,
        email: peers.email,
        githubUsername: peers.githubUsername,
        jiraUsername: peers.jiraUsername,
        teamId: peers.teamId,
        role: peers.role,
        seniority: peers.seniority,
        avatar: peers.avatar,
        createdAt: peers.createdAt,
        updatedAt: peers.updatedAt,
        teamName: teams.name,
      })
      .from(peers)
      .leftJoin(teams, eq(peers.teamId, teams.id))
      .where(eq(peers.id, peerId))
      .limit(1);

    if (peer.length === 0) {
      return c.json({ error: 'Peer not found' }, 404);
    }

    return c.json(peer[0]);
  } catch (error) {
    console.error('Error fetching peer:', error);
    return c.json({ error: 'Failed to fetch peer' }, 500);
  }
});

// POST /api/peers - Create new peer
peersRouter.post('/', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();

    // Validate team exists
    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, body.teamId))
      .limit(1);

    if (team.length === 0) {
      return c.json({ error: 'Team not found' }, 400);
    }

    const newPeer: NewPeer = {
      id: body.id || uuidv4(),
      name: body.name,
      email: body.email,
      githubUsername: body.githubUsername,
      jiraUsername: body.jiraUsername || null,
      teamId: body.teamId,
      role: body.role,
      seniority: body.seniority,
      avatar: body.avatar || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [insertedPeer] = await db
      .insert(peers)
      .values(newPeer)
      .returning();

    return c.json(insertedPeer, 201);
  } catch (error) {
    console.error('Error creating peer:', error);
    return c.json({ error: 'Failed to create peer' }, 500);
  }
});

// PUT /api/peers/:id - Update peer
peersRouter.put('/:id', async (c) => {
  try {
    const db = c.get('db');
    const peerId = c.req.param('id');
    const body = await c.req.json();

    // If updating teamId, validate team exists
    if (body.teamId) {
      const team = await db
        .select()
        .from(teams)
        .where(eq(teams.id, body.teamId))
        .limit(1);

      if (team.length === 0) {
        return c.json({ error: 'Team not found' }, 400);
      }
    }

    const [updatedPeer] = await db
      .update(peers)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(peers.id, peerId))
      .returning();

    if (!updatedPeer) {
      return c.json({ error: 'Peer not found' }, 404);
    }

    return c.json(updatedPeer);
  } catch (error) {
    console.error('Error updating peer:', error);
    return c.json({ error: 'Failed to update peer' }, 500);
  }
});

// DELETE /api/peers/:id - Delete peer
peersRouter.delete('/:id', async (c) => {
  try {
    const db = c.get('db');
    const peerId = c.req.param('id');

    // Check if peer is a team lead
    const teamAsLead = await db
      .select()
      .from(teams)
      .where(eq(teams.leadId, peerId));

    if (teamAsLead.length > 0) {
      return c.json({ error: 'Cannot delete peer who is a team lead' }, 400);
    }

    const [deletedPeer] = await db
      .delete(peers)
      .where(eq(peers.id, peerId))
      .returning();

    if (!deletedPeer) {
      return c.json({ error: 'Peer not found' }, 404);
    }

    return c.json({ message: 'Peer deleted successfully' });
  } catch (error) {
    console.error('Error deleting peer:', error);
    return c.json({ error: 'Failed to delete peer' }, 500);
  }
});