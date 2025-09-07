import { Hono } from 'hono';
import { eq, sql } from 'drizzle-orm';
import { teams, peers, type NewTeam } from '../../db/schema';
import { v4 as uuidv4 } from 'uuid';

type Variables = {
  db: any;
};

export const teamsRouter = new Hono<{ Variables: Variables }>();

// GET /api/teams - Get all teams
teamsRouter.get('/', async (c) => {
  try {
    const db = c.get('db');
    const allTeams = await db
      .select({
        id: teams.id,
        name: teams.name,
        description: teams.description,
        leadId: teams.leadId,
        department: teams.department,
        jiraProjectKey: teams.jiraProjectKey,
        createdAt: teams.createdAt,
        updatedAt: teams.updatedAt,
        memberCount: sql<number>`(SELECT COUNT(*) FROM ${peers} WHERE ${peers.teamId} = ${teams.id})`,
      })
      .from(teams);

    return c.json(allTeams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    return c.json({ error: 'Failed to fetch teams' }, 500);
  }
});

// GET /api/teams/:id - Get team by ID
teamsRouter.get('/:id', async (c) => {
  try {
    const db = c.get('db');
    const teamId = c.req.param('id');

    const team = await db
      .select()
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1);

    if (team.length === 0) {
      return c.json({ error: 'Team not found' }, 404);
    }

    // Get team members
    const members = await db
      .select()
      .from(peers)
      .where(eq(peers.teamId, teamId));

    return c.json({
      ...team[0],
      members,
      memberIds: members.map(m => m.id)
    });
  } catch (error) {
    console.error('Error fetching team:', error);
    return c.json({ error: 'Failed to fetch team' }, 500);
  }
});

// POST /api/teams - Create new team
teamsRouter.post('/', async (c) => {
  try {
    const db = c.get('db');
    const body = await c.req.json();

    const newTeam: NewTeam = {
      id: body.id || uuidv4(),
      name: body.name,
      description: body.description,
      leadId: body.leadId || null,
      department: body.department || null,
      jiraProjectKey: body.jiraProjectKey || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const [insertedTeam] = await db
      .insert(teams)
      .values(newTeam)
      .returning();

    return c.json(insertedTeam, 201);
  } catch (error) {
    console.error('Error creating team:', error);
    return c.json({ error: 'Failed to create team' }, 500);
  }
});

// PUT /api/teams/:id - Update team
teamsRouter.put('/:id', async (c) => {
  try {
    const db = c.get('db');
    const teamId = c.req.param('id');
    const body = await c.req.json();

    const [updatedTeam] = await db
      .update(teams)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, teamId))
      .returning();

    if (!updatedTeam) {
      return c.json({ error: 'Team not found' }, 404);
    }

    return c.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    return c.json({ error: 'Failed to update team' }, 500);
  }
});

// DELETE /api/teams/:id - Delete team
teamsRouter.delete('/:id', async (c) => {
  try {
    const db = c.get('db');
    const teamId = c.req.param('id');

    // Check if team has members
    const members = await db
      .select()
      .from(peers)
      .where(eq(peers.teamId, teamId));

    if (members.length > 0) {
      return c.json({ error: 'Cannot delete team with members' }, 400);
    }

    const [deletedTeam] = await db
      .delete(teams)
      .where(eq(teams.id, teamId))
      .returning();

    if (!deletedTeam) {
      return c.json({ error: 'Team not found' }, 404);
    }

    return c.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    return c.json({ error: 'Failed to delete team' }, 500);
  }
});