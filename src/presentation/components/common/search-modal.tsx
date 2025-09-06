import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Input,
  Card,
  CardBody,
  Button,
  Chip,
  Avatar,
  Spinner,
  Kbd,
  Divider
} from '@heroui/react';
import {
  Search,
  User,
  Target,
  Calendar,
  Github,
  Kanban,
  TrendingUp,
  Clock,
  Hash,
  Building,
  Zap
} from 'lucide-react';

type SearchResultType = 'member' | 'objective' | 'project' | 'repository' | 'pullRequest' | 'issue' | 'metric';

type SearchResult = {
  readonly id: string;
  readonly type: SearchResultType;
  readonly title: string;
  readonly subtitle?: string;
  readonly description?: string;
  readonly avatar?: string;
  readonly icon?: React.ComponentType<{ className?: string }>;
  readonly metadata?: {
    readonly status?: string;
    readonly date?: string;
    readonly assignee?: string;
    readonly value?: string | number;
  };
  readonly onClick: () => void;
};

type SearchModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onResultSelect?: (result: SearchResult) => void;
};

const typeIcons: Record<SearchResultType, React.ComponentType<{ className?: string }>> = {
  member: User,
  objective: Target,
  project: Building,
  repository: Github,
  pullRequest: Kanban,
  issue: Hash,
  metric: TrendingUp
};

const typeLabels: Record<SearchResultType, string> = {
  member: 'Team Member',
  objective: 'Objective',
  project: 'Project',
  repository: 'Repository',
  pullRequest: 'Pull Request',
  issue: 'Issue',
  metric: 'Metric'
};

const typeColors: Record<SearchResultType, 'primary' | 'secondary' | 'success' | 'warning' | 'danger'> = {
  member: 'primary',
  objective: 'success',
  project: 'secondary',
  repository: 'warning',
  pullRequest: 'primary',
  issue: 'danger',
  metric: 'success'
};

export const SearchModal = ({ isOpen, onClose, onResultSelect }: SearchModalProps) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Mock data for demonstration
  const mockResults: SearchResult[] = [
    {
      id: '1',
      type: 'member',
      title: 'John Doe',
      subtitle: 'Senior Developer',
      description: 'Full-stack developer with 5+ years experience',
      avatar: 'https://i.pravatar.cc/40?img=1',
      metadata: { status: 'Active' },
      onClick: () => console.log('Navigate to John Doe')
    },
    {
      id: '2',
      type: 'objective',
      title: 'Improve API Performance',
      subtitle: 'Q4 2024',
      description: 'Reduce API response time by 30%',
      metadata: { status: 'In Progress', value: '75%' },
      onClick: () => console.log('Navigate to objective')
    },
    {
      id: '3',
      type: 'repository',
      title: 'frontend-app',
      subtitle: 'Main application repository',
      description: 'React TypeScript application',
      metadata: { status: 'Active', date: '2 hours ago' },
      onClick: () => console.log('Navigate to repository')
    },
    {
      id: '4',
      type: 'pullRequest',
      title: 'Add dark mode support',
      subtitle: '#123',
      description: 'Implement dark theme across components',
      metadata: { status: 'Open', assignee: 'Jane Smith' },
      onClick: () => console.log('Navigate to PR')
    }
  ];

  const filteredResults = mockResults.filter(result =>
    result.title.toLowerCase().includes(query.toLowerCase()) ||
    result.description?.toLowerCase().includes(query.toLowerCase()) ||
    result.subtitle?.toLowerCase().includes(query.toLowerCase())
  );

  const groupedResults = filteredResults.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<SearchResultType, SearchResult[]>);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selectedResult = filteredResults[selectedIndex];
      if (selectedResult) {
        handleResultClick(selectedResult);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [filteredResults, selectedIndex, onClose]);

  const handleResultClick = (result: SearchResult) => {
    result.onClick();
    onResultSelect?.(result);
    onClose();
  };

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setIsSearching(false);
    }
  }, [isOpen]);

  // Simulate search delay
  useEffect(() => {
    if (query) {
      setIsSearching(true);
      const timer = setTimeout(() => {
        setIsSearching(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [query]);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="2xl"
      placement="top"
      className="mt-20"
      classNames={{
        backdrop: "bg-black/50",
        wrapper: "items-start",
      }}
    >
      <ModalContent className="mx-4">
        <ModalHeader className="pb-2">
          <div className="flex items-center gap-2 w-full">
            <Search className="w-5 h-5 text-gray-400" />
            <span className="text-lg font-semibold">Search Dashboard</span>
            <div className="ml-auto flex items-center gap-1">
              <Kbd keys={["escape"]}>ESC</Kbd>
            </div>
          </div>
        </ModalHeader>
        <ModalBody className="pb-6">
          <Input
            placeholder="Search for team members, objectives, projects..."
            value={query}
            onValueChange={setQuery}
            onKeyDown={handleKeyDown}
            
            startContent={<Search className="w-4 h-4 text-gray-400" />}
            endContent={
              isSearching ? (
                <Spinner size="sm" />
              ) : (
                <div className="flex items-center gap-1">
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd>
                  <Kbd>↵</Kbd>
                </div>
              )
            }
            classNames={{
              input: "text-base",
              inputWrapper: "h-12"
            }}
          />

          {query && (
            <div className="max-h-96 overflow-y-auto space-y-4 mt-4">
              {Object.keys(groupedResults).length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No results found for "{query}"</p>
                  <p className="text-sm mt-1">Try searching for team members, objectives, or projects</p>
                </div>
              ) : (
                Object.entries(groupedResults).map(([type, results]) => {
                  const TypeIcon = typeIcons[type as SearchResultType];
                  
                  return (
                    <div key={type}>
                      <div className="flex items-center gap-2 mb-2">
                        <TypeIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {typeLabels[type as SearchResultType]}s
                        </span>
                        <Chip size="sm" variant="flat" color={typeColors[type as SearchResultType]}>
                          {results.length}
                        </Chip>
                      </div>
                      
                      <div className="space-y-2">
                        {results.map((result, index) => {
                          const globalIndex = filteredResults.findIndex(r => r.id === result.id);
                          const isSelected = globalIndex === selectedIndex;
                          const ResultIcon = result.icon || typeIcons[result.type];
                          
                          return (
                            <Card
                              key={result.id}
                              className={`cursor-pointer transition-all duration-150 ${
                                isSelected 
                                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                                  : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                              onPress={() => handleResultClick(result)}
                            >
                              <CardBody className="p-3">
                                <div className="flex items-start gap-3">
                                  {result.avatar ? (
                                    <Avatar
                                      src={result.avatar}
                                      size="sm"
                                      className="flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                      <ResultIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                    </div>
                                  )}
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                        {result.title}
                                      </h4>
                                      {result.metadata?.status && (
                                        <Chip 
                                          size="sm" 
                                          variant="flat"
                                          color={typeColors[result.type]}
                                          className="text-xs"
                                        >
                                          {result.metadata.status}
                                        </Chip>
                                      )}
                                    </div>
                                    
                                    {result.subtitle && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                        {result.subtitle}
                                      </p>
                                    )}
                                    
                                    {result.description && (
                                      <p className="text-xs text-gray-500 dark:text-gray-500 line-clamp-2">
                                        {result.description}
                                      </p>
                                    )}
                                    
                                    {result.metadata && (
                                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-500">
                                        {result.metadata.date && (
                                          <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            <span>{result.metadata.date}</span>
                                          </div>
                                        )}
                                        {result.metadata.assignee && (
                                          <div className="flex items-center gap-1">
                                            <User className="w-3 h-3" />
                                            <span>{result.metadata.assignee}</span>
                                          </div>
                                        )}
                                        {result.metadata.value && (
                                          <div className="flex items-center gap-1">
                                            <TrendingUp className="w-3 h-3" />
                                            <span>{result.metadata.value}</span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </CardBody>
                            </Card>
                          );
                        })}
                      </div>
                      
                      {Object.keys(groupedResults).indexOf(type) < Object.keys(groupedResults).length - 1 && (
                        <Divider className="mt-4" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {!query && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">Quick Search</p>
              <p className="text-sm">
                Search for team members, objectives, projects, and more
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 text-xs">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <span>to navigate</span>
                <Kbd>↵</Kbd>
                <span>to select</span>
                <Kbd>ESC</Kbd>
                <span>to close</span>
              </div>
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};