import React, { useState, useMemo, useCallback } from 'react';
import {
  Input,
  Card,
  CardBody,
  Button,
  Chip,
  Avatar,
  Spinner,
  Kbd,
  Popover,
  PopoverTrigger,
  PopoverContent,
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

type IntelligentSearchProps = {
  readonly onResultSelect?: (result: SearchResult) => void;
  readonly placeholder?: string;
  readonly className?: string;
};

// Mock data for demonstration
const mockSearchData = {
  members: [
    { id: '1', name: 'Alice Johnson', role: 'Senior Developer', avatar: undefined },
    { id: '2', name: 'Bob Smith', role: 'Tech Lead', avatar: undefined },
    { id: '3', name: 'Carol Davis', role: 'Frontend Developer', avatar: undefined },
    { id: '4', name: 'David Wilson', role: 'Backend Developer', avatar: undefined },
  ],
  objectives: [
    { id: '1', title: 'Improve test coverage', progress: 75, deadline: '2024-02-15' },
    { id: '2', title: 'Migrate to React 18', progress: 45, deadline: '2024-03-01' },
    { id: '3', title: 'Optimize bundle size', progress: 90, deadline: '2024-01-30' },
  ],
  projects: [
    { id: '1', name: 'InsightLead Dashboard', status: 'Active' },
    { id: '2', name: 'Mobile App MVP', status: 'Planning' },
    { id: '3', name: 'API Refactor', status: 'In Progress' },
  ],
  repositories: [
    { id: '1', name: 'frontend-app', stars: 45, lastCommit: '2024-01-20' },
    { id: '2', name: 'backend-api', stars: 28, lastCommit: '2024-01-19' },
    { id: '3', name: 'mobile-client', stars: 12, lastCommit: '2024-01-18' },
  ],
  pullRequests: [
    { id: '1', title: 'Add dashboard filters', status: 'Open', author: 'Alice Johnson' },
    { id: '2', title: 'Fix responsive layout', status: 'Merged', author: 'Bob Smith' },
    { id: '3', title: 'Update dependencies', status: 'Draft', author: 'Carol Davis' },
  ],
  issues: [
    { id: '1', title: 'Button not clickable on mobile', status: 'Open', assignee: 'David Wilson' },
    { id: '2', title: 'Performance issues on large datasets', status: 'In Progress', assignee: 'Alice Johnson' },
    { id: '3', title: 'Dark mode toggle not working', status: 'Closed', assignee: 'Carol Davis' },
  ],
  metrics: [
    { id: '1', name: 'Pull Request Merge Rate', value: '87%', trend: 'up' },
    { id: '2', name: 'Code Review Coverage', value: '92%', trend: 'stable' },
    { id: '3', name: 'Average Cycle Time', value: '3.2 days', trend: 'down' },
  ],
};

const getResultIcon = (type: SearchResultType) => {
  switch (type) {
    case 'member': return User;
    case 'objective': return Target;
    case 'project': return Building;
    case 'repository': return Github;
    case 'pullRequest': return Github;
    case 'issue': return Kanban;
    case 'metric': return TrendingUp;
    default: return Search;
  }
};

const getResultColor = (type: SearchResultType) => {
  switch (type) {
    case 'member': return 'primary';
    case 'objective': return 'success';
    case 'project': return 'secondary';
    case 'repository': return 'warning';
    case 'pullRequest': return 'primary';
    case 'issue': return 'danger';
    case 'metric': return 'success';
    default: return 'default';
  }
};

export const IntelligentSearch = ({
  onResultSelect,
  placeholder = "Search members, objectives, projects...",
  className = ""
}: IntelligentSearchProps) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const results: SearchResult[] = [];
    const searchTerm = query.toLowerCase();

    // Search members
    mockSearchData.members
      .filter(member => 
        member.name.toLowerCase().includes(searchTerm) ||
        member.role.toLowerCase().includes(searchTerm)
      )
      .forEach(member => {
        results.push({
          id: `member-${member.id}`,
          type: 'member',
          title: member.name,
          subtitle: member.role,
          avatar: member.avatar,
          onClick: () => console.log('Navigate to member:', member.name)
        });
      });

    // Search objectives
    mockSearchData.objectives
      .filter(objective => 
        objective.title.toLowerCase().includes(searchTerm)
      )
      .forEach(objective => {
        results.push({
          id: `objective-${objective.id}`,
          type: 'objective',
          title: objective.title,
          subtitle: `${objective.progress}% complete`,
          metadata: {
            status: objective.progress >= 100 ? 'Completed' : 'In Progress',
            date: objective.deadline
          },
          onClick: () => console.log('Navigate to objective:', objective.title)
        });
      });

    // Search projects
    mockSearchData.projects
      .filter(project => 
        project.name.toLowerCase().includes(searchTerm)
      )
      .forEach(project => {
        results.push({
          id: `project-${project.id}`,
          type: 'project',
          title: project.name,
          subtitle: project.status,
          metadata: {
            status: project.status
          },
          onClick: () => console.log('Navigate to project:', project.name)
        });
      });

    // Search repositories
    mockSearchData.repositories
      .filter(repo => 
        repo.name.toLowerCase().includes(searchTerm)
      )
      .forEach(repo => {
        results.push({
          id: `repo-${repo.id}`,
          type: 'repository',
          title: repo.name,
          subtitle: `${repo.stars} stars`,
          metadata: {
            date: repo.lastCommit
          },
          onClick: () => console.log('Navigate to repository:', repo.name)
        });
      });

    // Search pull requests
    mockSearchData.pullRequests
      .filter(pr => 
        pr.title.toLowerCase().includes(searchTerm) ||
        pr.author.toLowerCase().includes(searchTerm)
      )
      .forEach(pr => {
        results.push({
          id: `pr-${pr.id}`,
          type: 'pullRequest',
          title: pr.title,
          subtitle: `by ${pr.author}`,
          metadata: {
            status: pr.status
          },
          onClick: () => console.log('Navigate to PR:', pr.title)
        });
      });

    // Search issues
    mockSearchData.issues
      .filter(issue => 
        issue.title.toLowerCase().includes(searchTerm) ||
        issue.assignee.toLowerCase().includes(searchTerm)
      )
      .forEach(issue => {
        results.push({
          id: `issue-${issue.id}`,
          type: 'issue',
          title: issue.title,
          subtitle: `assigned to ${issue.assignee}`,
          metadata: {
            status: issue.status
          },
          onClick: () => console.log('Navigate to issue:', issue.title)
        });
      });

    // Search metrics
    mockSearchData.metrics
      .filter(metric => 
        metric.name.toLowerCase().includes(searchTerm)
      )
      .forEach(metric => {
        results.push({
          id: `metric-${metric.id}`,
          type: 'metric',
          title: metric.name,
          subtitle: metric.value,
          metadata: {
            value: metric.value
          },
          onClick: () => console.log('Navigate to metric:', metric.name)
        });
      });

    return results.slice(0, 10); // Limit to 10 results
  }, [query]);

  const handleInputChange = useCallback((value: string) => {
    setQuery(value);
    setSelectedIndex(0);
    setIsOpen(value.trim().length > 0);
    
    if (value.trim().length > 0) {
      setIsLoading(true);
      // Simulate search delay
      setTimeout(() => setIsLoading(false), 300);
    }
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || searchResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleResultClick(searchResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        break;
    }
  }, [isOpen, searchResults, selectedIndex]);

  const handleResultClick = useCallback((result: SearchResult) => {
    result.onClick();
    onResultSelect?.(result);
    setIsOpen(false);
    setQuery('');
  }, [onResultSelect]);

  const groupedResults = useMemo(() => {
    const groups: Record<SearchResultType, SearchResult[]> = {
      member: [],
      objective: [],
      project: [],
      repository: [],
      pullRequest: [],
      issue: [],
      metric: []
    };

    searchResults.forEach(result => {
      groups[result.type].push(result);
    });

    return Object.entries(groups).filter(([_, results]) => results.length > 0);
  }, [searchResults]);

  return (
    <div className={`relative ${className}`}>
      <Popover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        placement="bottom-start"
        offset={8}
        classNames={{
          content: "p-0 w-full min-w-[400px] max-w-[600px]"
        }}
      >
        <PopoverTrigger>
          <div>
            <Input
              placeholder={placeholder}
              value={query}
              onValueChange={handleInputChange}
              onKeyDown={handleKeyDown}
              startContent={
                isLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <Search className="w-4 h-4 text-gray-400" />
                )
              }
              endContent={
                <div className="flex items-center gap-1">
                  <Kbd keys={['cmd']}>K</Kbd>
                </div>
              }
              classNames={{
                input: "text-sm",
                inputWrapper: "h-10"
              }}
            />
          </div>
        </PopoverTrigger>

        <PopoverContent>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-6">
                <Spinner size="sm" />
                <span className="ml-2 text-sm text-gray-600">Searching...</span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="py-2">
                {groupedResults.map(([type, results], groupIndex) => (
                  <div key={type}>
                    {groupIndex > 0 && <Divider className="my-2" />}
                    <div className="px-3 py-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {type}s
                      </p>
                    </div>
                    {results.map((result, index) => {
                      const globalIndex = searchResults.findIndex(r => r.id === result.id);
                      const Icon = getResultIcon(result.type);
                      const isSelected = globalIndex === selectedIndex;
                      
                      return (
                        <Button
                          key={result.id}
                          variant="ghost"
                          className={`w-full justify-start h-auto p-3 ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                          onPress={() => handleResultClick(result)}
                        >
                          <div className="flex items-start gap-3 w-full">
                            {result.avatar ? (
                              <Avatar
                                size="sm"
                                name={result.title}
                                src={result.avatar}
                              />
                            ) : (
                              <div className={`p-2 rounded-lg bg-${getResultColor(result.type)}-100`}>
                                <Icon className={`w-4 h-4 text-${getResultColor(result.type)}-600`} />
                              </div>
                            )}
                            
                            <div className="flex-1 text-left min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {result.title}
                              </p>
                              {result.subtitle && (
                                <p className="text-sm text-gray-600 truncate">
                                  {result.subtitle}
                                </p>
                              )}
                              {result.metadata && (
                                <div className="flex items-center gap-2 mt-1">
                                  {result.metadata.status && (
                                    <Chip size="sm" variant="flat" color={getResultColor(result.type)}>
                                      {result.metadata.status}
                                    </Chip>
                                  )}
                                  {result.metadata.date && (
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {result.metadata.date}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </Button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : query.trim() ? (
              <div className="flex items-center justify-center p-6">
                <div className="text-center">
                  <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No results found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Try searching for team members, objectives, or projects
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-sm text-gray-600 mb-3">Quick actions:</p>
                <div className="space-y-1">
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <Target className="w-4 h-4 mr-2" />
                    View all objectives
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" />
                    Browse team members
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    View metrics dashboard
                  </Button>
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};