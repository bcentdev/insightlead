import type { ObjectiveData, CreateObjectiveProps } from '@/modules/objectives/domain/objective.entity';
import type { IObjectiveRepository } from '../objective.repository.interface';

export class CloudObjectiveRepository implements IObjectiveRepository {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}/api/objectives${endpoint}`;
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

  async getAll(): Promise<ObjectiveData[]> {
    return this.fetchApi('');
  }

  async getById(id: string): Promise<ObjectiveData | null> {
    try {
      return await this.fetchApi<ObjectiveData>(`/${id}`);
    } catch (error) {
      if (error instanceof Error && error.message.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getByPeerId(peerId: string): Promise<ObjectiveData[]> {
    return this.fetchApi(`?peerId=${peerId}`);
  }

  async getByCategory(category: string): Promise<ObjectiveData[]> {
    const objectives = await this.getAll();
    return objectives.filter(obj => obj.category === category);
  }

  async getOverdue(): Promise<ObjectiveData[]> {
    const objectives = await this.getAll();
    const now = new Date();
    return objectives.filter(obj => 
      new Date(obj.targetDate) < now && obj.progress < 100
    );
  }

  async getCompleted(): Promise<ObjectiveData[]> {
    const objectives = await this.getAll();
    return objectives.filter(obj => obj.progress >= 100 || obj.completedAt);
  }

  async create(objective: CreateObjectiveProps): Promise<ObjectiveData> {
    return this.fetchApi('', {
      method: 'POST',
      body: JSON.stringify(objective),
    });
  }

  async update(id: string, updates: Partial<CreateObjectiveProps>): Promise<ObjectiveData> {
    return this.fetchApi(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async delete(id: string): Promise<void> {
    await this.fetchApi(`/${id}`, {
      method: 'DELETE',
    });
  }

  async updateProgress(id: string, progress: number): Promise<ObjectiveData> {
    return this.update(id, { progress });
  }

  async markCompleted(id: string): Promise<ObjectiveData> {
    return this.update(id, { 
      progress: 100, 
      completedAt: new Date() 
    });
  }

  async addMetric(objectiveId: string, metric: { name: string; target: number; current: number; unit: string }): Promise<void> {
    await this.fetchApi(`/${objectiveId}/metrics`, {
      method: 'POST',
      body: JSON.stringify(metric),
    });
  }

  async updateMetric(objectiveId: string, metricId: string, current: number): Promise<void> {
    await this.fetchApi(`/${objectiveId}/metrics/${metricId}`, {
      method: 'PUT',
      body: JSON.stringify({ current }),
    });
  }

  async removeMetric(objectiveId: string, metricId: string): Promise<void> {
    await this.fetchApi(`/${objectiveId}/metrics/${metricId}`, {
      method: 'DELETE',
    });
  }
}