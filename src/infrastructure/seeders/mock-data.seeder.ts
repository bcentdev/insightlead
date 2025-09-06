import { PeerRepository } from '../../domain/repositories/peer.repository';
import { TeamRepository } from '../../domain/repositories/team.repository';
import { ObjectiveRepository } from '../../domain/repositories/objective.repository';
import { createPeer, PEER_ROLES, SENIORITY_LEVELS } from '../../domain/entities/peer.entity';
import { createTeam, addTeamMember, changeTeamLead } from '../../domain/entities/team.entity';
import { createObjective } from '../../domain/entities/objective.entity';
import { createGitHubUsername } from '../../domain/value-objects/github-username.vo';
import { createObjectiveProgress } from '../../domain/value-objects/objective-progress.vo';

const seedTeams = async (teamRepository: TeamRepository): Promise<string> => {
  const team = createTeam({
    name: 'Engineering Team Alpha',
    description: 'Primary engineering team focused on product development',
    leadId: 'temp-lead-id', // Will be updated
    memberIds: [],
    department: 'Engineering'
  });

  await teamRepository.save(team);
  return team.id;
};

const seedPeers = async (peerRepository: PeerRepository, teamId: string): Promise<string[]> => {
  const mockPeersData = [
    {
      name: 'Sarah Chen',
      email: 'sarah.chen@company.com',
      role: PEER_ROLES.FRONTEND_DEVELOPER,
      seniority: SENIORITY_LEVELS.SENIOR,
      githubUsername: 'sarahchen',
      jiraUsername: 'sarah.chen',
      avatar: 'https://i.pravatar.cc/150?u=sarah'
    },
    {
      name: 'Marcus Rodriguez',
      email: 'marcus.rodriguez@company.com',
      role: PEER_ROLES.FRONTEND_DEVELOPER,
      seniority: SENIORITY_LEVELS.MID,
      githubUsername: 'marcusrod',
      jiraUsername: 'marcus.rodriguez',
      avatar: 'https://i.pravatar.cc/150?u=marcus'
    },
    {
      name: 'Emily Zhang',
      email: 'emily.zhang@company.com',
      role: PEER_ROLES.BACKEND_DEVELOPER,
      seniority: SENIORITY_LEVELS.SENIOR,
      githubUsername: 'emilyzhang',
      jiraUsername: 'emily.zhang',
      avatar: 'https://i.pravatar.cc/150?u=emily'
    },
    {
      name: 'David Kumar',
      email: 'david.kumar@company.com',
      role: PEER_ROLES.FULLSTACK_DEVELOPER,
      seniority: SENIORITY_LEVELS.JUNIOR,
      githubUsername: 'davidkumar',
      jiraUsername: 'david.kumar',
      avatar: 'https://i.pravatar.cc/150?u=david'
    },
    {
      name: 'Lisa Johnson',
      email: 'lisa.johnson@company.com',
      role: PEER_ROLES.QA_ENGINEER,
      seniority: SENIORITY_LEVELS.MID,
      githubUsername: 'lisajohnson',
      jiraUsername: 'lisa.johnson',
      avatar: 'https://i.pravatar.cc/150?u=lisa'
    }
  ];

  const peerIds: string[] = [];

  for (const peerData of mockPeersData) {
    const peer = createPeer({
      name: peerData.name,
      email: peerData.email,
      githubUsername: createGitHubUsername(peerData.githubUsername),
      jiraUsername: peerData.jiraUsername,
      teamId,
      role: peerData.role,
      seniority: peerData.seniority,
      avatar: peerData.avatar
    });

    await peerRepository.save(peer);
    peerIds.push(peer.id);
  }

  return peerIds;
};

const seedObjectives = async (objectiveRepository: ObjectiveRepository, peerIds: string[]): Promise<void> => {
  const now = new Date();
  const futureDate1 = new Date(now.getFullYear() + 1, 11, 31);
  const futureDate2 = new Date(now.getFullYear(), now.getMonth() + 3, 30);
  const futureDate3 = new Date(now.getFullYear(), now.getMonth() + 6, 15);

  const mockObjectives = [
    {
      title: 'Improve Code Review Process',
      description: 'Implement automated code review tools and establish clear review guidelines to reduce review time by 30%',
      category: 'process_improvement' as const,
      priority: 'high' as const,
      progress: 75,
      targetDate: futureDate1,
      tags: ['automation', 'code-quality', 'efficiency'],
      peerId: peerIds[0] // Sarah Chen
    },
    {
      title: 'Lead Frontend Architecture Refactoring',
      description: 'Modernize the frontend codebase by implementing new component patterns and improving performance',
      category: 'technical_skills' as const,
      priority: 'high' as const,
      progress: 60,
      targetDate: futureDate2,
      tags: ['frontend', 'architecture', 'performance'],
      peerId: peerIds[0]
    },
    {
      title: 'Mentor Junior Developers',
      description: 'Provide mentorship to 2 junior developers, focusing on React best practices and testing methodologies',
      category: 'mentoring' as const,
      priority: 'medium' as const,
      progress: 90,
      targetDate: futureDate2,
      tags: ['mentoring', 'react', 'testing'],
      peerId: peerIds[1] // Marcus Rodriguez
    },
    {
      title: 'Complete Advanced React Certification',
      description: 'Obtain React advanced certification to deepen understanding of advanced patterns and performance optimization',
      category: 'technical_skills' as const,
      priority: 'medium' as const,
      progress: 45,
      targetDate: futureDate3,
      tags: ['react', 'certification', 'learning'],
      peerId: peerIds[1]
    },
    {
      title: 'Implement API Gateway',
      description: 'Design and implement a robust API gateway for microservices architecture',
      category: 'technical_skills' as const,
      priority: 'high' as const,
      progress: 80,
      targetDate: futureDate1,
      tags: ['backend', 'microservices', 'api'],
      peerId: peerIds[2] // Emily Zhang
    },
    {
      title: 'Database Performance Optimization',
      description: 'Optimize database queries and implement caching strategies to improve system performance',
      category: 'technical_skills' as const,
      priority: 'medium' as const,
      progress: 100,
      targetDate: now,
      tags: ['database', 'performance', 'optimization'],
      peerId: peerIds[2]
    },
    {
      title: 'Learn Full Stack Development',
      description: 'Gain proficiency in both frontend and backend technologies through hands-on projects',
      category: 'technical_skills' as const,
      priority: 'medium' as const,
      progress: 35,
      targetDate: futureDate3,
      tags: ['fullstack', 'learning', 'development'],
      peerId: peerIds[3] // David Kumar
    },
    {
      title: 'Implement Automated Testing Suite',
      description: 'Set up comprehensive automated testing including unit, integration, and E2E tests',
      category: 'process_improvement' as const,
      priority: 'high' as const,
      progress: 70,
      targetDate: futureDate2,
      tags: ['testing', 'automation', 'quality'],
      peerId: peerIds[4] // Lisa Johnson
    }
  ];

  for (const mockObj of mockObjectives) {
    const objective = createObjective({
      title: mockObj.title,
      description: mockObj.description,
      peerId: mockObj.peerId,
      category: mockObj.category,
      priority: mockObj.priority,
      progress: createObjectiveProgress(mockObj.progress),
      targetDate: mockObj.targetDate,
      tags: [...mockObj.tags]
    });

    await objectiveRepository.save(objective);
  }
};

const updateTeamWithLeader = async (
  teamRepository: TeamRepository,
  peerRepository: PeerRepository,
  teamId: string,
  leaderId: string
): Promise<void> => {
  const team = await teamRepository.findById(teamId);
  if (!team) return;

  const peers = await peerRepository.findByTeamId(teamId);
  let updatedTeam = { ...team, leadId: leaderId };

  // Add all peers to team
  for (const peer of peers) {
    updatedTeam = addTeamMember(updatedTeam, peer.id);
  }

  // Set the leader
  updatedTeam = changeTeamLead(updatedTeam, leaderId);

  await teamRepository.update(updatedTeam);
};

export const seedMockData = async (
  peerRepository: PeerRepository,
  teamRepository: TeamRepository,
  objectiveRepository: ObjectiveRepository
): Promise<void> => {
  const teamId = await seedTeams(teamRepository);
  const peerIds = await seedPeers(peerRepository, teamId);
  await seedObjectives(objectiveRepository, peerIds);
  await updateTeamWithLeader(teamRepository, peerRepository, teamId, peerIds[0]); // Make first peer the leader
};