import { ObjectiveData } from '@/modules/objectives/domain/objective.entity';
import { ObjectiveRepository } from '@/modules/objectives/domain/objective.repository';
import { objectiveProgressToNumber, createObjectiveProgress } from '@/modules/objectives/domain/objective-progress.vo';
import { createDatabase } from '@/shared/infrastructure/database/indexeddb.helper';

export class IndexedDBObjectiveRepository implements ObjectiveRepository {
  private readonly storeName = 'objectives';
  private db = createDatabase();

  async save(objective: ObjectiveData): Promise<ObjectiveData> {
    try {
      const objectiveData = {
        ...objective,
        progress: objectiveProgressToNumber(objective.progress),
        targetDate: objective.targetDate.toISOString(),
        createdAt: objective.createdAt.toISOString(),
        updatedAt: objective.updatedAt.toISOString()
      };
      await this.db.put(this.storeName, objectiveData);
      return objective;
    } catch (error) {
      throw error;
    }
  }

  async findAll(): Promise<readonly ObjectiveData[]> {
    try {
      const objectivesData = await this.db.getAll<any>(this.storeName);
      return objectivesData.map(data => this.toObjectiveEntity(data));
    } catch (error) {
      return [];
    }
  }

  async findByPeerId(peerId: string): Promise<readonly ObjectiveData[]> {
    try {
      const objectivesData = await this.db.getAllByIndex<any>(this.storeName, 'peerId', peerId);
      return objectivesData.map(data => this.toObjectiveEntity(data));
    } catch (error) {
      return [];
    }
  }

  async findById(id: string): Promise<ObjectiveData | null> {
    try {
      const objectiveData = await this.db.get<any>(this.storeName, id);
      if (!objectiveData) return null;
      return this.toObjectiveEntity(objectiveData);
    } catch (error) {
      return null;
    }
  }

  async update(objective: ObjectiveData): Promise<void> {
    await this.save(objective); // IndexedDB put() works as upsert
  }

  async delete(id: string): Promise<void> {
    try {
      await this.db.delete(this.storeName, id);
    } catch (error) {
      throw error;
    }
  }

  async findByFilters(): Promise<readonly ObjectiveData[]> {
    // For now, return all objectives
    // In a real implementation, this would support filtering
    return await this.findAll();
  }

  async countByPeerId(peerId: string): Promise<number> {
    const objectives = await this.findByPeerId(peerId);
    return objectives.length;
  }

  async countCompletedByPeerId(peerId: string): Promise<number> {
    const objectives = await this.findByPeerId(peerId);
    return objectives.filter(obj => objectiveProgressToNumber(obj.progress) >= 100).length;
  }

  async findOverdueObjectives(): Promise<readonly ObjectiveData[]> {
    const allObjectives = await this.findAll();
    const now = new Date();
    return allObjectives.filter(obj => 
      obj.targetDate < now && objectiveProgressToNumber(obj.progress) < 100
    );
  }

  private toObjectiveEntity(data: any): ObjectiveData {
    return {
      ...data,
      progress: createObjectiveProgress(data.progress),
      targetDate: typeof data.targetDate === 'string' ? new Date(data.targetDate) : data.targetDate,
      createdAt: typeof data.createdAt === 'string' ? new Date(data.createdAt) : data.createdAt,
      updatedAt: typeof data.updatedAt === 'string' ? new Date(data.updatedAt) : data.updatedAt
    };
  }
}