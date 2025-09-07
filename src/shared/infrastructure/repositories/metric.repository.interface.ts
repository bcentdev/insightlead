import type { MetricData, CreateMetricProps } from '@/shared/domain/metric.entity';

export interface IMetricRepository {
  // Read operations
  getAll(): Promise<MetricData[]>;
  getById(id: string): Promise<MetricData | null>;
  getByPeerId(peerId: string, startDate?: Date, endDate?: Date): Promise<MetricData[]>;
  getBySource(source: string): Promise<MetricData[]>;
  getByType(type: string): Promise<MetricData[]>;
  
  // Aggregated operations
  getSummaryByPeer(peerId: string, startDate?: Date, endDate?: Date): Promise<{
    source: string;
    type: string;
    totalValue: number;
    avgValue: number;
    count: number;
    lastUpdated: Date;
  }[]>;
  
  getTrends(peerId?: string, type?: string, period?: 'daily' | 'weekly' | 'monthly'): Promise<{
    period: string;
    type: string;
    totalValue: number;
    avgValue: number;
    count: number;
  }[]>;
  
  // Write operations
  create(metric: CreateMetricProps): Promise<MetricData>;
  createBulk(metrics: CreateMetricProps[]): Promise<MetricData[]>;
  delete(id: string): Promise<void>;
  
  // Cleanup operations
  deleteOldMetrics(beforeDate: Date): Promise<number>; // Returns count of deleted metrics
}