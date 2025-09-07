import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Teams table
export const teams = sqliteTable('teams', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  leadId: text('lead_id').references(() => peers.id),
  department: text('department'),
  jiraProjectKey: text('jira_project_key'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Peers table
export const peers = sqliteTable('peers', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  githubUsername: text('github_username').notNull(),
  jiraUsername: text('jira_username'),
  teamId: text('team_id').notNull().references(() => teams.id),
  role: text('role', { 
    enum: ['frontend_developer', 'backend_developer', 'fullstack_developer', 'qa_engineer', 'devops_engineer', 'product_manager', 'ui_ux_designer'] 
  }).notNull(),
  seniority: text('seniority', { 
    enum: ['junior', 'mid', 'senior', 'lead', 'principal'] 
  }).notNull(),
  avatar: text('avatar'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Objectives table
export const objectives = sqliteTable('objectives', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  peerId: text('peer_id').notNull().references(() => peers.id),
  category: text('category', { 
    enum: ['technical_skills', 'leadership', 'project_delivery', 'team_collaboration', 'process_improvement', 'mentoring', 'communication', 'innovation'] 
  }).notNull(),
  priority: text('priority', { 
    enum: ['low', 'medium', 'high', 'critical'] 
  }).notNull(),
  progress: integer('progress').notNull(), // 0-100
  targetDate: integer('target_date', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  tags: text('tags'), // JSON array of strings
});

// Objective metrics table (separate table for normalization)
export const objectiveMetrics = sqliteTable('objective_metrics', {
  id: text('id').primaryKey(),
  objectiveId: text('objective_id').notNull().references(() => objectives.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  target: real('target').notNull(),
  current: real('current').notNull(),
  unit: text('unit').notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Performance metrics table
export const metrics = sqliteTable('metrics', {
  id: text('id').primaryKey(),
  peerId: text('peer_id').notNull().references(() => peers.id),
  source: text('source', { 
    enum: ['github', 'jira', 'manual'] 
  }).notNull(),
  type: text('type', { 
    enum: [
      'pull_requests_created', 'pull_requests_merged', 'pull_requests_reviewed',
      'commits', 'lines_added', 'lines_deleted', 'issues_created', 'issues_resolved',
      'code_reviews_given', 'stories_completed', 'bugs_fixed', 'tasks_completed',
      'cycle_time', 'lead_time', 'team_meetings', 'one_on_ones', 'mentoring_sessions',
      'knowledge_sharing', 'process_improvements'
    ] 
  }).notNull(),
  value: real('value').notNull(),
  metadata: text('metadata'), // JSON object
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Users table for authentication
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatar: text('avatar'),
  peerId: text('peer_id').references(() => peers.id), // Link to peer if they are a team member
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Sessions table for authentication
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Relations types for better TypeScript support
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type Peer = typeof peers.$inferSelect;
export type NewPeer = typeof peers.$inferInsert;

export type Objective = typeof objectives.$inferSelect;
export type NewObjective = typeof objectives.$inferInsert;

export type ObjectiveMetric = typeof objectiveMetrics.$inferSelect;
export type NewObjectiveMetric = typeof objectiveMetrics.$inferInsert;

export type Metric = typeof metrics.$inferSelect;
export type NewMetric = typeof metrics.$inferInsert;

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;