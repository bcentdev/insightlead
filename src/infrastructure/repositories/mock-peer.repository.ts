import { PeerRepository } from '../../domain/repositories/peer.repository';
import { PeerData } from '../../domain/entities/peer.entity';

// Shared state across all repository instances
let mockPeersData: PeerData[] = [];

const findAll = async (): Promise<PeerData[]> => {
  return [...mockPeersData];
};

const findById = async (id: string): Promise<PeerData | null> => {
  return mockPeersData.find(peer => peer.id === id) || null;
};

const save = async (peer: PeerData): Promise<void> => {
  const existingIndex = mockPeersData.findIndex(p => p.id === peer.id);
  if (existingIndex >= 0) {
    mockPeersData[existingIndex] = peer;
  } else {
    mockPeersData.push(peer);
  }
};

const update = async (peer: PeerData): Promise<void> => {
  const index = mockPeersData.findIndex(p => p.id === peer.id);
  if (index >= 0) {
    mockPeersData[index] = peer;
  } else {
    throw new Error(`Peer with id ${peer.id} not found`);
  }
};

const deletePeer = async (id: string): Promise<void> => {
  mockPeersData = mockPeersData.filter(peer => peer.id !== id);
};

const findByTeamId = async (teamId: string): Promise<PeerData[]> => {
  return mockPeersData.filter(peer => peer.teamId === teamId);
};

export const clearMockPeersData = (): void => {
  mockPeersData = [];
};

export const createMockPeerRepository = (): PeerRepository => ({
  findAll,
  findById,
  save,
  update,
  delete: deletePeer,
  findByTeamId
});