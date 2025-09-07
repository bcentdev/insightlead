import type { MetricData, CreateMetricProps } from '@/shared/domain/metric.entity';
import type { IMetricRepository } from '../metric.repository.interface';

export class CloudMetricRepository implements IMetricRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}/api/metrics${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getAll(): Promise<MetricData[]> {
    return this.fetchApi('');
  }

  async getById(id: string): Promise<MetricData | null> {
    try {
      const metrics = await this.getAll();
      return metrics.find(m => m.id === id) || null;
    } catch (error) {
      return null;
    }
  }

  async getByPeerId(peerId: string, startDate?: Date, endDate?: Date): Promise<MetricData[]> {
    let query = `?peerId=${peerId}`;
    if (startDate) query += `&startDate=${startDate.toISOString()}`;
    if (endDate) query += `&endDate=${endDate.toISOString()}`;
    
    return this.fetchApi(query);
  }

  async getBySource(source: string): Promise<MetricData[]> {
    return this.fetchApi(`?source=${source}`);
  }

  async getByType(type: string): Promise<MetricData[]> {
    return this.fetchApi(`?type=${type}`);
  }

  async getSummaryByPeer(peerId: string, startDate?: Date, endDate?: Date): Promise<{
    source: string;
    type: string;
    totalValue: number;
    avgValue: number;
    count: number;
    lastUpdated: Date;
  }[]> {
    let query = `/summary?peerId=${peerId}`;
    if (startDate) query += `&startDate=${startDate.toISOString()}`;
    if (endDate) query += `&endDate=${endDate.toISOString()}`;
    
    return this.fetchApi(query);
  }

  async getTrends(peerId?: string, type?: string, period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<{
    period: string;
    type: string;
    totalValue: number;
    avgValue: number;
    count: number;
  }[]> {
    let query = `/trends?period=${period}`;
    if (peerId) query += `&peerId=${peerId}`;
    if (type) query += `&type=${type}`;
    
    return this.fetchApi(query);
  }

  async create(metric: CreateMetricProps): Promise<MetricData> {
    return this.fetchApi('', {
      method: 'POST',
      body: JSON.stringify(metric),
    });
  }

  async createBulk(metrics: CreateMetricProps[]): Promise<MetricData[]> {
    const result = await this.fetchApi<{ metrics: MetricData[] }>('/bulk', {
      method: 'POST',
      body: JSON.stringify({ metrics }),
    });
    return result.metrics;
  }

  async delete(id: string): Promise<void> {
    await this.fetchApi(`/${id}`, {
      method: 'DELETE',
    });
  }

  async deleteOldMetrics(beforeDate: Date): Promise<number> {
    // This would need a custom endpoint, for now we'll simulate it
    const allMetrics = await this.getAll();
    const oldMetrics = allMetrics.filter(m => new Date(m.timestamp) < beforeDate);
    
    for (const metric of oldMetrics) {
      await this.delete(metric.id);
    }
    
    return oldMetrics.length;
  }
}