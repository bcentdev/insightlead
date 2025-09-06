import { TeamRepository } from '../../../domain/repositories/team.repository';
import { PeerRepository } from '../../../domain/repositories/peer.repository';
import { MetricRepository, MetricAggregation } from '../../../domain/repositories/metric.repository';
import { ObjectiveRepository } from '../../../domain/repositories/objective.repository';
import { Peer } from '../../../domain/entities/peer.entity';

export interface GetTeamOverviewRequest {
  teamId: string;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface TeamMemberSummary {
  id: string;
  name: string;
  role: string;
  seniority: string;
  avatar?: string;
  objectivesTotal: number;
  objectivesCompleted: number;
  completionRate: number;
  keyMetrics: Record<string, number>;
}

export interface TeamOverview {
  teamId: string;
  teamName: string;
  teamLead: TeamMemberSummary;
  members: TeamMemberSummary[];
  totalMembers: number;
  teamMetrics: MetricAggregation[];
  averageCompletionRate: number;
  lastUpdated: Date;
}

export interface GetTeamOverviewResponse {
  success: boolean;
  data?: TeamOverview;
  error?: string;
}

export class GetTeamOverviewUseCase {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly peerRepository: PeerRepository,
    private readonly metricRepository: MetricRepository,
    private readonly objectiveRepository: ObjectiveRepository
  ) {}

  async execute(request: GetTeamOverviewRequest): Promise<GetTeamOverviewResponse> {
    try {
      // Find team
      const team = await this.teamRepository.findById(request.teamId);
      if (!team) {
        return {
          success: false,
          error: 'Team not found'
        };
      }

      // Get team members
      const members = await this.peerRepository.findByIds([...team.memberIds]);
      
      // Get team lead
      const teamLead = members.find(member => member.id === team.leadId);
      if (!teamLead) {
        return {
          success: false,
          error: 'Team lead not found'
        };
      }

      // Get member summaries
      const memberSummaries = await Promise.all(
        members.map(member => this.createMemberSummary(member, request.dateFrom, request.dateTo))
      );

      const teamLeadSummary = memberSummaries.find(summary => summary.id === teamLead.id)!;
      const otherMembers = memberSummaries.filter(summary => summary.id !== teamLead.id);

      // Get team metrics
      const teamMetrics = await this.metricRepository.getTeamMetricSummary(
        [...team.memberIds],
        request.dateFrom,
        request.dateTo
      );

      // Calculate average completion rate
      const averageCompletionRate = memberSummaries.reduce(
        (sum, member) => sum + member.completionRate,
        0
      ) / memberSummaries.length;

      const overview: TeamOverview = {
        teamId: team.id,
        teamName: team.name,
        teamLead: teamLeadSummary,
        members: otherMembers,
        totalMembers: members.length,
        teamMetrics,
        averageCompletionRate,
        lastUpdated: new Date()
      };

      return {
        success: true,
        data: overview
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async createMemberSummary(
    peer: Peer,
    dateFrom?: Date,
    dateTo?: Date
  ): Promise<TeamMemberSummary> {
    // Get objectives count
    const objectivesTotal = await this.objectiveRepository.countByPeerId(peer.id);
    const objectivesCompleted = await this.objectiveRepository.countCompletedByPeerId(peer.id);
    const completionRate = objectivesTotal > 0 ? (objectivesCompleted / objectivesTotal) * 100 : 0;

    // Get key metrics
    const metrics = await this.metricRepository.getMetricSummaryByPeer(peer.id, dateFrom, dateTo);
    const keyMetrics: Record<string, number> = {};
    
    metrics.forEach(metric => {
      keyMetrics[metric.metricType] = metric.totalValue;
    });

    return {
      id: peer.id,
      name: peer.name,
      role: peer.role,
      seniority: peer.seniority,
      avatar: peer.avatar,
      objectivesTotal,
      objectivesCompleted,
      completionRate,
      keyMetrics
    };
  }
}