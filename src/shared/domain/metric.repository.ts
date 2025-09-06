import { MetricData, MetricSource, MetricType } from './metric.entity';

export interface MetricFilters {
  peerId?: string;
  source?: MetricSource;
  type?: MetricType;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface MetricAggregation {
  peerId: string;
  metricType: MetricType;
  totalValue: number;
  averageValue: number;
  count: number;
  period: Date;
}

export interface MetricRepository {
  save(metric: MetricData): Promise<void>;
  saveMany(metrics: MetricData[]): Promise<void>;
  findById(id: string): Promise<MetricData | null>;
  findByPeerId(peerId: string): Promise<MetricData[]>;
  findByFilters(filters: MetricFilters): Promise<MetricData[]>;
  findAll(): Promise<MetricData[]>;
  delete(id: string): Promise<void>;
  deleteByPeerId(peerId: string): Promise<void>;
  
  // Aggregation methods
  getMetricSummaryByPeer(peerId: string, dateFrom?: Date, dateTo?: Date): Promise<MetricAggregation[]>;
  getMetricTrendByPeer(peerId: string, metricType: MetricType, dateFrom: Date, dateTo: Date): Promise<MetricData[]>;
  getTeamMetricSummary(peerIds: string[], dateFrom?: Date, dateTo?: Date): Promise<MetricAggregation[]>;
  
  // Cleanup methods
  deleteOldMetrics(olderThan: Date): Promise<void>;
}