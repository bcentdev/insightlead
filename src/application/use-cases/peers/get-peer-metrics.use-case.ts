import { PeerRepository } from '../../../domain/repositories/peer.repository';
import { MetricRepository, MetricAggregation } from '../../../domain/repositories/metric.repository';
import { ObjectiveRepository } from '../../../domain/repositories/objective.repository';

export type GetPeerMetricsRequest = {
  peerId: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export type PeerMetricsSummary = {
  peerId: string;
  peerName: string;
  metrics: MetricAggregation[];
  objectivesTotal: number;
  objectivesCompleted: number;
  objectivesCompletionRate: number;
  lastUpdated: Date;
}

export type GetPeerMetricsResponse = {
  success: boolean;
  data?: PeerMetricsSummary;
  error?: string;
}

// Pure function to calculate completion rate
const calculateCompletionRate = (completed: number, total: number): number => 
  total > 0 ? (completed / total) * 100 : 0;

// Pure function to create peer metrics summary
const createPeerMetricsSummary = (
  peerId: string,
  peerName: string,
  metrics: MetricAggregation[],
  objectivesTotal: number,
  objectivesCompleted: number
): PeerMetricsSummary => ({
  peerId,
  peerName,
  metrics,
  objectivesTotal,
  objectivesCompleted,
  objectivesCompletionRate: calculateCompletionRate(objectivesCompleted, objectivesTotal),
  lastUpdated: new Date()
});

// Dependencies type for dependency injection
type GetPeerMetricsDependencies = {
  peerRepository: PeerRepository;
  metricRepository: MetricRepository;
  objectiveRepository: ObjectiveRepository;
}

// Main use case function
export const createGetPeerMetricsUseCase = (dependencies: GetPeerMetricsDependencies) => {
  const { peerRepository, metricRepository, objectiveRepository } = dependencies;
  
  return async (request: GetPeerMetricsRequest): Promise<GetPeerMetricsResponse> => {
    try {
      // Find peer
      const peer = await peerRepository.findById(request.peerId);
      if (!peer) {
        return {
          success: false,
          error: 'Peer not found'
        };
      }

      // Get metrics summary
      const metrics = await metricRepository.getMetricSummaryByPeer(
        request.peerId,
        request.dateFrom,
        request.dateTo
      );

      // Get objectives count
      const objectivesTotal = await objectiveRepository.countByPeerId(request.peerId);
      const objectivesCompleted = await objectiveRepository.countCompletedByPeerId(request.peerId);

      const summary = createPeerMetricsSummary(
        peer.id,
        peer.name,
        metrics,
        objectivesTotal,
        objectivesCompleted
      );

      return {
        success: true,
        data: summary
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  };
};
