import { TrendChart } from './trend-chart.tsx';
import { format, subDays, eachDayOfInterval } from 'date-fns';

type MetricsTrendData = {
  readonly pullRequests: readonly number[];
  readonly mergeRate: readonly number[];
  readonly storiesCompleted: readonly number[];
  readonly bugsFixed: readonly number[];
  readonly dates: readonly string[];
};

type MetricsTrendViewProps = {
  readonly data: MetricsTrendData;
  readonly timePeriod: string;
  readonly selectedMember?: string | null;
};

export const MetricsTrendView = ({ data, timePeriod, selectedMember }: MetricsTrendViewProps) => {
  // Generate mock trend data for demo purposes
  // In a real implementation, this would come from your data source
  const generateMockTrendData = () => {
    const days = timePeriod === '7d' ? 7 : timePeriod === '30d' ? 30 : 90;
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    
    const dateRange = eachDayOfInterval({ start: startDate, end: endDate });
    
    return {
      pullRequests: dateRange.map((date, index) => ({
        date: format(date, 'yyyy-MM-dd'),
        value: Math.floor(Math.random() * 10) + index % 3,
      })),
      mergeRate: dateRange.map((date, index) => ({
        date: format(date, 'yyyy-MM-dd'),
        value: Math.floor(Math.random() * 20) + 70 + (index % 5),
      })),
      storiesCompleted: dateRange.map((date, index) => ({
        date: format(date, 'yyyy-MM-dd'),
        value: Math.floor(Math.random() * 5) + index % 2,
      })),
      bugsFixed: dateRange.map((date, index) => ({
        date: format(date, 'yyyy-MM-dd'),
        value: Math.floor(Math.random() * 3) + (index % 2),
      })),
    };
  };

  const trendData = generateMockTrendData();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">
          Tendencias de Métricas {selectedMember ? '(Miembro Seleccionado)' : '(Equipo)'}
        </h2>
        <div className="text-sm text-gray-600">
          Período: {timePeriod === '7d' ? '7 días' : timePeriod === '30d' ? '30 días' : '90 días'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendChart
          data={trendData.pullRequests}
          title="Pull Requests Diarios"
          color="#3B82F6"
          type="area"
        />
        
        <TrendChart
          data={trendData.mergeRate}
          title="Tasa de Merge (%)"
          color="#10B981"
          formatValue={(value) => `${value}%`}
        />
        
        <TrendChart
          data={trendData.storiesCompleted}
          title="Historias Completadas"
          color="#8B5CF6"
          type="area"
        />
        
        <TrendChart
          data={trendData.bugsFixed}
          title="Bugs Resueltos"
          color="#EF4444"
        />
      </div>
    </div>
  );
};