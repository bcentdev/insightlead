import { Card, CardBody, Tooltip } from '@heroui/react';
import { ReactNode } from 'react';
import { HelpCircle } from 'lucide-react';

type MetricCardProps = {
  readonly title: string;
  readonly value: string | number;
  readonly subtitle?: string;
  readonly icon: ReactNode;
  readonly gradient: string;
  readonly tooltip?: string;
  readonly trend?: {
    readonly value: number;
    readonly isPositive: boolean;
  };
  readonly onClick?: () => void;
  readonly isClickable?: boolean;
};

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  gradient, 
  tooltip, 
  trend,
  onClick,
  isClickable = false
}: MetricCardProps) {
  return (
    <div className={isClickable ? 'hover:scale-105 transition-transform duration-200' : ''}>
      <Card className={`border-none shadow-sm transition-all duration-200 dark:bg-gray-800 dark:border-gray-700 ${
        isClickable 
          ? 'hover:shadow-lg cursor-pointer' 
          : 'hover:shadow-md'
      }`}>
        <CardBody 
          className={`p-4 bg-gradient-to-br ${gradient} dark:from-gray-800 dark:to-gray-700 relative overflow-hidden`}
          onClick={onClick}
        >
          
          {/* Click indicator */}
          {isClickable && (
            <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
          
          <div className="flex items-start justify-between mb-3 relative z-10">
            <div className="p-2 bg-white/20 dark:bg-white/10 rounded-lg backdrop-blur-sm hover:scale-110 transition-transform">
              {icon}
            </div>
            {trend && (
              <div className={`flex items-center gap-1 text-sm font-medium ${
                trend.isPositive ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
              }`}>
                <span>{trend.isPositive ? '↗' : '↘'}</span>
                <span>{Math.abs(trend.value)}%</span>
              </div>
            )}
          </div>
          
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</h3>
              {tooltip && (
                <Tooltip content={tooltip} placement="top">
                  <div className="hover:scale-120 transition-transform">
                    <HelpCircle className="w-3 h-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 cursor-help transition-colors" />
                  </div>
                </Tooltip>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}