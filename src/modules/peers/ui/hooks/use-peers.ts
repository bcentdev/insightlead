import { useState, useEffect } from 'react';
import { PeerData, updatePeerProfile } from '../../domain/entities/peer.entity';
import { createAddPeerUseCase } from '../../application/use-cases/peers/add-peer.use-case';
import { gitHubUsernameToString } from '../../domain/value-objects/github-username.vo';
import { AddPeerFormData } from '../components/peers/add-peer-modal';
import { getPeerRepository, getTeamRepository, getObjectiveRepository } from '../../infrastructure/factories/repository.factory';
import { PeerRepository } from '../../domain/repositories/peer.repository';
import { TeamRepository } from '../../domain/repositories/team.repository';
import { ObjectiveRepository } from '../../domain/repositories/objective.repository';
import { fetchTeamMetrics, getPeerMetricsFromTeam, type TeamMetrics } from '../../infrastructure/services/metrics.service';

export interface PeerWithMetrics {
  id: string;
  name: string;
  email: string;
  role: string;
  seniority: string;
  avatar: string;
  githubUsername: string;
  jiraUsername?: string;
  teamName: string;
  objectivesCompleted: number;
  objectivesTotal: number;
  completionRate: number;
  lastActive: Date;
  keyMetrics: {
    pullRequests: number;
    codeReviews: number;
    storiesCompleted: number;
    comments: number;
  };
}

export function usePeers() {
  const [peers, setPeers] = useState<PeerWithMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultTeamId, setDefaultTeamId] = useState<string>('');
  const [repositories, setRepositories] = useState<{
    peerRepository: PeerRepository;
    teamRepository: TeamRepository; 
    objectiveRepository: ObjectiveRepository;
  } | null>(null);

  useEffect(() => {
    initializeRepositories();
  }, []);

  const initializeRepositories = async () => {
    try {
      const peerRepository = await getPeerRepository();
      const teamRepository = await getTeamRepository();
      const objectiveRepository = await getObjectiveRepository();
      
      setRepositories({ peerRepository, teamRepository, objectiveRepository });
      await loadPeers({ peerRepository, teamRepository, objectiveRepository });
    } catch (err) {
      setError('Failed to initialize repositories');
      setIsLoading(false);
    }
  };

  const loadPeers = async (repos?: {
    peerRepository: PeerRepository;
    teamRepository: TeamRepository;
    objectiveRepository: ObjectiveRepository;
  }) => {
    try {
      setIsLoading(true);
      setError(null);

      const currentRepos = repos || repositories;
      if (!currentRepos) {
        throw new Error('Repositories not initialized');
      }

      const peerEntities = await currentRepos.peerRepository.findAll();
      const teams = await currentRepos.teamRepository.findAll();
      const objectives = await currentRepos.objectiveRepository.findAll();

      console.log('👥 usePeers Debug:');
      console.log('- Repository type:', currentRepos.peerRepository.constructor.name);
      console.log('- Peers found:', peerEntities.length);
      console.log('- Teams found:', teams.length);
      if (teams.length > 0) {
        console.log('- First team name:', teams[0].name);
      }
      if (peerEntities.length > 0) {
        console.log('- First peer name:', peerEntities[0].name);
      }

      // Set default team ID (first team found)
      if (teams.length > 0) {
        setDefaultTeamId(teams[0].id);
      }

      // Fetch team metrics once for all peers
      const team = teams[0]; // Assuming single team for now
      const githubUsernames = peerEntities
        .map(peer => gitHubUsernameToString(peer.githubUsername))
        .filter(Boolean);
      const jiraUsernames = peerEntities
        .map(peer => peer.jiraUsername)
        .filter(Boolean);

      const teamMetrics = await fetchTeamMetrics(
        githubUsernames,
        jiraUsernames,
        team?.jiraProjectKey
      );

      // Convert to presentation format using team metrics
      const peersWithMetrics = peerEntities.map((peer) => {
        const peerTeam = teams.find(t => t.id === peer.teamId);
        return toPeerWithMetrics(peer, peerTeam?.name || 'Unknown Team', objectives, teamMetrics);
      });

      setPeers(peersWithMetrics);
    } catch (err) {
      setError('Failed to load team members');
    } finally {
      setIsLoading(false);
    }
  };

  const addPeer = async (peerData: AddPeerFormData): Promise<void> => {
    try {
      if (!repositories) {
        throw new Error('Repositories not initialized');
      }

      const addPeerUseCase = createAddPeerUseCase({
        peerRepository: repositories.peerRepository,
        teamRepository: repositories.teamRepository
      });

      const result = await addPeerUseCase({
        name: peerData.name,
        email: peerData.email,
        githubUsername: peerData.githubUsername,
        jiraUsername: peerData.jiraUsername,
        teamId: defaultTeamId || peerData.teamId,
        role: peerData.role,
        seniority: peerData.seniority,
        avatar: peerData.avatar
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      // Reload peers after adding
      await loadPeers();
    } catch (err) {
      throw err;
    }
  };

  const updatePeer = async (peerData: AddPeerFormData): Promise<void> => {
    try {
      if (!repositories) {
        throw new Error('Repositories not initialized');
      }

      if (!peerData.id) {
        throw new Error('Peer ID is required for update');
      }

      // Get the current peer
      const currentPeer = await repositories.peerRepository.findById(peerData.id);
      if (!currentPeer) {
        throw new Error('Peer not found');
      }

      // Update the peer profile
      const updatedPeer = updatePeerProfile(currentPeer, {
        name: peerData.name,
        email: peerData.email,
        avatar: peerData.avatar,
        role: peerData.role,
        seniority: peerData.seniority,
        jiraUsername: peerData.jiraUsername
      });

      // Save the updated peer
      await repositories.peerRepository.save(updatedPeer);

      // Reload peers after updating
      await loadPeers();
    } catch (err) {
      throw err;
    }
  };


  const toPeerWithMetrics = (peer: PeerData, teamName: string, objectives: readonly any[] = [], teamMetrics: TeamMetrics): PeerWithMetrics => {
    // Convert role enum to display string
    const roleDisplay = peer.role
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
    
    const seniorityDisplay = peer.seniority.charAt(0).toUpperCase() + peer.seniority.slice(1);

    // Calculate objective completion rates
    const peerObjectives = objectives.filter(obj => obj.peerId === peer.id);
    const completedObjectives = peerObjectives.filter(obj => obj.progress >= 100);
    const totalObjectives = peerObjectives.length;
    
    const objectivesCompleted = completedObjectives.length;
    const objectivesTotal = totalObjectives;
    const completionRate = totalObjectives > 0 ? Math.round((completedObjectives.length / totalObjectives) * 100) : 0;

    // Get real metrics from team metrics (no individual API calls)
    const realMetrics = getPeerMetricsFromTeam(
      teamMetrics,
      gitHubUsernameToString(peer.githubUsername),
      peer.jiraUsername
    );

    return {
      id: peer.id,
      name: peer.name,
      email: peer.email,
      role: roleDisplay,
      seniority: seniorityDisplay,
      avatar: peer.avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(peer.email)}`,
      githubUsername: gitHubUsernameToString(peer.githubUsername),
      jiraUsername: peer.jiraUsername,
      teamName,
      objectivesCompleted,
      objectivesTotal,
      completionRate,
      lastActive: realMetrics.lastActive,
      keyMetrics: {
        pullRequests: realMetrics.pullRequests,
        codeReviews: realMetrics.codeReviews,
        storiesCompleted: realMetrics.storiesCompleted,
        comments: realMetrics.comments
      }
    };
  };

  return {
    peers,
    isLoading,
    error,
    defaultTeamId,
    addPeer,
    updatePeer,
    loadPeers
  };
}