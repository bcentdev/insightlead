import React from 'react';
import { Card, CardBody, CardHeader, Avatar, Progress, Chip, Button } from '@heroui/react';
import { Users, X } from 'lucide-react';

type TeamMember = {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly seniority: string;
  readonly avatar?: string;
  readonly objectivesCompleted: number;
  readonly objectivesTotal: number;
  readonly completionRate: number;
  readonly keyMetrics?: {
    readonly pullRequests: number;
    readonly codeReviews: number;
    readonly storiesCompleted: number;
    readonly comments: number;
  };
};

type TeamMembersFilterProps = {
  readonly teamLead: TeamMember;
  readonly members: readonly TeamMember[];
  readonly selectedMember: string | null;
  readonly onMemberSelect: (memberId: string | null) => void;
};

export function TeamMembersFilter({ 
  teamLead, 
  members, 
  selectedMember, 
  onMemberSelect 
}: TeamMembersFilterProps) {
  const allMembers = [teamLead, ...members].filter(member => member.id);

  const clearFilter = () => {
    onMemberSelect(null);
  };

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Team Members</h3>
          </div>
          {selectedMember && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg">
                <span className="text-sm font-medium text-blue-700">
                  Filtered: {allMembers.find(m => m.id === selectedMember)?.name}
                </span>
              </div>
              <Button
                variant="light"
                size="sm"
                onPress={clearFilter}
                startContent={<X className="w-4 h-4" />}
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allMembers.map((member) => (
            <div
              key={member.id}
              className={`p-4 border rounded-lg transition-all cursor-pointer ${
                selectedMember === member.id
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => onMemberSelect(member.id === selectedMember ? null : member.id)}
            >
              <div className="flex items-center gap-3 mb-3">
                <Avatar
                  src={member.avatar}
                  name={member.name}
                  size="md"
                />
                <div>
                  <h4 className="font-medium">{member.name}</h4>
                  <div className="flex items-center gap-1 mt-1">
                    <Chip size="sm" variant="flat" color="default">
                      {member.role}
                    </Chip>
                    {member.id === teamLead.id && (
                      <Chip size="sm" variant="flat" color="primary">
                        Lead
                      </Chip>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progress</span>
                  <span className="font-medium">{Math.round(member.completionRate)}%</span>
                </div>
                <Progress
                  value={member.completionRate}
                  color={member.completionRate >= 80 ? 'success' : member.completionRate >= 60 ? 'warning' : 'danger'}
                  size="sm"
                />
                <div className="text-xs text-gray-500">
                  {member.objectivesCompleted} of {member.objectivesTotal} objectives completed
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}