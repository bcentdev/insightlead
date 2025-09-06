import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardBody } from '@heroui/react';

type TrendDataPoint = {
  readonly date: string;
  readonly value: number;
  readonly label?: string;
};

type TrendChartProps = {
  readonly data: readonly TrendDataPoint[];
  readonly title: string;
  readonly color?: string;
  readonly type?: 'line' | 'area';
  readonly formatValue?: (value: number) => string;
  readonly height?: number;
};

export const TrendChart = ({ 
  data, 
  title, 
  color = '#3B82F6', 
  type = 'line',
  formatValue = (value) => value.toString(),
  height = 200
}: TrendChartProps) => {
  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardBody className="p-4">
          <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
          <div className="flex items-center justify-center h-32 text-gray-500">
            No hay datos disponibles
          </div>
        </CardBody>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{label}</p>
          <p className="text-sm" style={{ color }}>
            {`${title}: ${formatValue(payload[0].value)}`}
          </p>
        </div>
      );
    }
    return null;
  };

  const chartData = data.map(point => ({
    ...point,
    date: new Date(point.date).toLocaleDateString('es-ES', { 
      month: 'short', 
      day: 'numeric' 
    })
  }));

  return (
    <Card className="w-full">
      <CardBody className="p-4">
        <h3 className="font-semibold text-gray-900 mb-4">{title}</h3>
        <ResponsiveContainer width="100%" height={height}>
          {type === 'area' ? (
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#666"
                tickFormatter={formatValue}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </AreaChart>
          ) : (
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#666"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#666"
                tickFormatter={formatValue}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={2}
                dot={{ r: 4, fill: color }}
                activeDot={{ r: 6, fill: color }}
              />
            </LineChart>
          )}
        </ResponsiveContainer>
      </CardBody>
    </Card>
  );
};