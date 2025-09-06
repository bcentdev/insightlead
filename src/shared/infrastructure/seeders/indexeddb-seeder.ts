import { IndexedDBPeerRepository } from '@/modules/peers/infrastructure/repositories/indexeddb-peer.repository';
import { IndexedDBTeamRepository } from '@/modules/teams/infrastructure/repositories/indexeddb-team.repository';
import { IndexedDBObjectiveRepository } from '@/modules/objectives/infrastructure/repositories/indexeddb-objective.repository';
import { createPeer, PEER_ROLES, SENIORITY_LEVELS } from '@/modules/peers/domain/peer.entity';
import { createTeam, addTeamMember, changeTeamLead } from '@/modules/teams/domain/team.entity';
import { createObjective } from '@/modules/objectives/domain/objective.entity';
import { createGitHubUsername } from '@/shared/domain/value-objects/github-username.vo';
import { createObjectiveProgress } from '@/shared/domain/value-objects/objective-progress.vo';

export const seedIndexedDB = async (): Promise<void> => {
  console.log('🌱 Starting IndexedDB seeding...');

  const peerRepository = new IndexedDBPeerRepository();
  const teamRepository = new IndexedDBTeamRepository();
  const objectiveRepository = new IndexedDBObjectiveRepository();

  try {
    // Check if data already exists
    const existingPeers = await peerRepository.findAll();
    if (existingPeers.length > 0) {
      console.log('📊 Data already exists in IndexedDB, skipping seeding');
      return;
    }

    // Create team
    console.log('👥 Creating team...');
    const team = createTeam({
      name: 'Production Engineering Team',
      description: 'Real production team stored in IndexedDB - not mock data',
      leadId: 'temp-lead-id', // Will be updated
      memberIds: [],
      department: 'Engineering'
    });

    await teamRepository.save(team);
    console.log(`✅ Created team: ${team.name}`);

    // Create peers
    console.log('👤 Creating peers...');
    const mockPeersData = [
      {
        name: 'Alex Thompson [IndexedDB]',
        email: 'alex.thompson@company.com',
        role: PEER_ROLES.FRONTEND_DEVELOPER,
        seniority: SENIORITY_LEVELS.SENIOR,
        githubUsername: 'alexthompson',
        jiraUsername: 'alex.thompson',
        avatar: 'https://i.pravatar.cc/150?u=alex'
      },
      {
        name: 'Jordan Smith [IndexedDB]',
        email: 'jordan.smith@company.com',
        role: PEER_ROLES.BACKEND_DEVELOPER,
        seniority: SENIORITY_LEVELS.MID,
        githubUsername: 'jordansmith',
        jiraUsername: 'jordan.smith',
        avatar: 'https://i.pravatar.cc/150?u=jordan'
      },
      {
        name: 'Taylor Garcia [IndexedDB]',
        email: 'taylor.garcia@company.com',
        role: PEER_ROLES.FULLSTACK_DEVELOPER,
        seniority: SENIORITY_LEVELS.SENIOR,
        githubUsername: 'taylorgarcia',
        jiraUsername: 'taylor.garcia',
        avatar: 'https://i.pravatar.cc/150?u=taylor'
      },
      {
        name: 'Riley Williams [IndexedDB]',
        email: 'riley.williams@company.com',
        role: PEER_ROLES.QA_ENGINEER,
        seniority: SENIORITY_LEVELS.JUNIOR,
        githubUsername: 'rileywilliams',
        jiraUsername: 'riley.williams',
        avatar: 'https://i.pravatar.cc/150?u=riley'
      },
      {
        name: 'Casey Davis [IndexedDB]',
        email: 'casey.davis@company.com',
        role: PEER_ROLES.FRONTEND_DEVELOPER,
        seniority: SENIORITY_LEVELS.MID,
        githubUsername: 'caseydavis',
        jiraUsername: 'casey.davis',
        avatar: 'https://i.pravatar.cc/150?u=casey'
      }
    ];

    const peerIds: string[] = [];

    for (const peerData of mockPeersData) {
      const peer = createPeer({
        name: peerData.name,
        email: peerData.email,
        githubUsername: createGitHubUsername(peerData.githubUsername),
        jiraUsername: peerData.jiraUsername,
        teamId: team.id,
        role: peerData.role,
        seniority: peerData.seniority,
        avatar: peerData.avatar
      });

      await peerRepository.save(peer);
      peerIds.push(peer.id);
      console.log(`✅ Created peer: ${peer.name}`);
    }

    // Update team with leader and members
    console.log('🔄 Updating team with members...');
    let updatedTeam = { ...team, leadId: peerIds[0] };

    // Add all peers to team
    for (const peerId of peerIds) {
      updatedTeam = addTeamMember(updatedTeam, peerId);
    }

    // Set the leader
    updatedTeam = changeTeamLead(updatedTeam, peerIds[0]);

    await teamRepository.save(updatedTeam);
    console.log('✅ Updated team with leader and members');

    // Create objectives
    console.log('🎯 Creating objectives...');
    const now = new Date();
    const futureDate1 = new Date(now.getFullYear() + 1, 11, 31);
    const futureDate2 = new Date(now.getFullYear(), now.getMonth() + 3, 30);
    const futureDate3 = new Date(now.getFullYear(), now.getMonth() + 6, 15);

    const mockObjectives = [
      {
        title: 'IndexedDB: Production Deployment Pipeline',
        description: 'Set up automated deployment pipeline for production environment using IndexedDB storage',
        category: 'process_improvement' as const,
        priority: 'high' as const,
        progress: 85,
        targetDate: futureDate1,
        tags: ['deployment', 'automation', 'production'],
        peerId: peerIds[0] // Alex Thompson
      },
      {
        title: 'IndexedDB: Real-time Performance Monitoring',
        description: 'Implement real-time performance monitoring system with IndexedDB persistence',
        category: 'technical_skills' as const,
        priority: 'high' as const,
        progress: 70,
        targetDate: futureDate2,
        tags: ['monitoring', 'performance', 'real-time'],
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
      console.log(`✅ Created objective: ${objective.title}`);
    }

    console.log('🎉 IndexedDB seeding completed successfully!');
    console.log(`📊 Created ${peerIds.length} peers, 1 team, and ${mockObjectives.length} objectives`);

  } catch (error) {
    console.error('❌ Error seeding IndexedDB:', error);
    throw error;
  }
};