import React from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Chip,
  Progress,
  Divider,
  Avatar,
  Link
} from '@heroui/react';
import { 
  GitPullRequest, 
  GitMerge, 
  Clock, 
  Users, 
  Code, 
  Eye,
  ExternalLink,
  Calendar,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { TrendChart } from './trend-chart.tsx';

type MetricType = 'pullRequests' | 'mergeRate' | 'cycleTime' | 'codeReviews' | 'commits' | 'storiesCompleted';

type MetricDetailData = {
  readonly title: string;
  readonly value: string | number;
  readonly subtitle: string;
  readonly trend?: {
    readonly value: number;
    readonly isPositive: boolean;
  };
  readonly breakdown: readonly {
    readonly label: string;
    readonly value: number;
    readonly percentage: number;
    readonly color?: string;
  }[];
  readonly timeline: readonly {
    readonly date: string;
    readonly value: number;
  }[];
  readonly contributors?: readonly {
    readonly name: string;
    readonly avatar?: string;
    readonly value: number;
    readonly change: number;
  }[];
  readonly relatedItems?: readonly {
    readonly title: string;
    readonly url: string;
    readonly status: string;
    readonly createdAt: string;
  }[];
};

type MetricDetailModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly metricType: MetricType;
  readonly data: MetricDetailData;
  readonly timePeriod: string;
};

const getMetricIcon = (type: MetricType) => {
  switch (type) {
    case 'pullRequests': return GitPullRequest;
    case 'mergeRate': return GitMerge;
    case 'cycleTime': return Clock;
    case 'codeReviews': return Eye;
    case 'commits': return Code;
    case 'storiesCompleted': return TrendingUp;
    default: return GitPullRequest;
  }
};

const getMetricColor = (type: MetricType) => {
  switch (type) {
    case 'pullRequests': return 'primary';
    case 'mergeRate': return 'success';
    case 'cycleTime': return 'warning';
    case 'codeReviews': return 'secondary';
    case 'commits': return 'primary';
    case 'storiesCompleted': return 'success';
    default: return 'primary';
  }
};

export const MetricDetailModal = ({
  isOpen,
  onClose,
  metricType,
  data,
  timePeriod
}: MetricDetailModalProps) => {
  const MetricIcon = getMetricIcon(metricType);
  const metricColor = getMetricColor(metricType);

  const formatTimePeriod = (period: string) => {
    switch (period) {
      case '7d': return 'Last 7 days';
      case '30d': return 'Last 30 days';
      case '90d': return 'Last 90 days';
      default: return 'Selected period';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-white",
        header: "border-b border-gray-200",
        body: "py-6",
        footer: "border-t border-gray-200"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${metricColor}-100`}>
            <MetricIcon className={`w-5 h-5 text-${metricColor}-600`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{data.title}</h2>
            <p className="text-sm text-gray-600">{formatTimePeriod(timePeriod)}</p>
          </div>
        </ModalHeader>

        <ModalBody>
          <div className="space-y-6">
            {/* Main Metric Card */}
            <Card className={`border-${metricColor}-200 bg-${metricColor}-50`}>
              <CardBody className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <span className="text-3xl font-bold text-gray-900">{data.value}</span>
                      {data.trend && (
                        <Chip
                          size="sm"
                          color={data.trend.isPositive ? 'success' : 'danger'}
                          variant="flat"
                          startContent={
                            data.trend.isPositive ? 
                              <TrendingUp className="w-3 h-3" /> : 
                              <TrendingDown className="w-3 h-3" />
                          }
                        >
                          {data.trend.value}%
                        </Chip>
                      )}
                    </div>
                    <p className="text-gray-600 mt-1">{data.subtitle}</p>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Timeline Chart */}
            {data.timeline.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trend Over Time</h3>
                <TrendChart
                  data={data.timeline}
                  title=""
                  color={metricColor === 'primary' ? '#3B82F6' : 
                         metricColor === 'success' ? '#10B981' :
                         metricColor === 'warning' ? '#F59E0B' : '#8B5CF6'}
                  type="area"
                  height={200}
                />
              </div>
            )}

            {/* Breakdown */}
            {data.breakdown.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Breakdown</h3>
                <div className="space-y-3">
                  {data.breakdown.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-sm font-medium text-gray-900 min-w-0 flex-1">
                          {item.label}
                        </span>
                        <span className="text-sm text-gray-600">{item.value}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress
                          value={item.percentage}
                          color={item.color as any || metricColor}
                          size="sm"
                          className="w-24"
                        />
                        <span className="text-xs text-gray-500 w-8 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Contributors */}
            {data.contributors && data.contributors.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Contributors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.contributors.map((contributor, index) => (
                    <Card key={index}>
                      <CardBody className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar
                              size="sm"
                              name={contributor.name}
                              src={contributor.avatar}
                            />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {contributor.name}
                              </p>
                              <p className="text-xs text-gray-600">
                                {contributor.value} contributions
                              </p>
                            </div>
                          </div>
                          <Chip
                            size="sm"
                            color={contributor.change >= 0 ? 'success' : 'danger'}
                            variant="flat"
                          >
                            {contributor.change >= 0 ? '+' : ''}{contributor.change}%
                          </Chip>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Related Items */}
            {data.relatedItems && data.relatedItems.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Items</h3>
                <div className="space-y-2">
                  {data.relatedItems.slice(0, 5).map((item, index) => (
                    <Card key={index}>
                      <CardBody className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="flex-1 min-w-0">
                              <Link 
                                href={item.url}
                                isExternal
                                className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <span className="truncate">{item.title}</span>
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </Link>
                              <div className="flex items-center gap-2 mt-1">
                                <Chip size="sm" variant="flat" color="default">
                                  {item.status}
                                </Chip>
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {new Date(item.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                  {data.relatedItems.length > 5 && (
                    <div className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        endContent={<ArrowRight className="w-4 h-4" />}
                      >
                        View {data.relatedItems.length - 5} more items
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            color="primary"
            variant="light"
            onPress={onClose}
          >
            Close
          </Button>
          <Button
            color="primary"
            endContent={<ExternalLink className="w-4 h-4" />}
          >
            View Full Report
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};