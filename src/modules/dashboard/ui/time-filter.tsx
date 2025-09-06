import React from 'react';
import { Select, SelectItem } from '@heroui/react';
import { Calendar } from 'lucide-react';

type TimeFilterOption = {
  readonly value: string;
  readonly label: string;
  readonly days: number;
};

type TimeFilterProps = {
  readonly selectedPeriod: string;
  readonly onPeriodChange: (period: string) => void;
};

const timeOptions: readonly TimeFilterOption[] = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '14d', label: 'Last 14 days', days: 14 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '60d', label: 'Last 60 days', days: 60 },
  { value: '90d', label: 'Last 90 days', days: 90 }
];

export const TimeFilter = ({ selectedPeriod, onPeriodChange }: TimeFilterProps) => {
  const handlePeriodChange = (keys: any) => {
    const selected = Array.from(keys)[0] as string;
    if (process.env.NODE_ENV === 'development') {
      console.log('🐛 Time Filter Change:');
      console.log('- Previous:', selectedPeriod);
      console.log('- Selected:', selected);
    }
    onPeriodChange(selected);
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Time Period:</span>
      </div>
      <Select
        selectedKeys={[selectedPeriod]}
        onSelectionChange={handlePeriodChange}
        className="w-40"
        size="sm"
        variant="bordered"
      >
        {timeOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
};

export const getTimeFilterDays = (period: string): number => {
  const option = timeOptions.find(opt => opt.value === period);
  const days = option?.days || 30;
  
  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('🐛 Time Filter Debug:');
    console.log('- Period:', period);
    console.log('- Days:', days);
    console.log('- All options:', timeOptions);
  }
  
  return days;
};