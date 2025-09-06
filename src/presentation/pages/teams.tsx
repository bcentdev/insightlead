import { useState } from 'react';
import { Button, Card, CardBody, CardHeader, Avatar, Chip, Spinner, useDisclosure } from '@heroui/react';
import { Plus, Users, AlertCircle, Crown, Edit } from 'lucide-react';
import { CreateTeamModal, CreateTeamFormData, PeerOption } from '../components/teams/create-team-modal';
import { useTeams } from '../hooks/use-teams';
import { usePeers } from '../hooks/use-peers';

export default function TeamsPage() {
  const { teams, isLoading, error, createTeam, updateTeam } = useTeams();
  const { peers } = usePeers();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingTeam, setEditingTeam] = useState<CreateTeamFormData | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  const handleCreateTeam = async (teamData: CreateTeamFormData) => {
    try {
      if (modalMode === 'edit') {
        await updateTeam(teamData);
      } else {
        await createTeam(teamData);
      }
    } catch (error) {
      console.error('Error saving team:', error);
      throw error;
    }
  };

  const handleCreateNew = () => {
    setModalMode('create');
    setEditingTeam(null);
    onOpen();
  };

  const handleEditTeam = (team: any) => {
    setModalMode('edit');
    setEditingTeam({
      id: team.id,
      name: team.name,
      description: team.description,
      leadId: team.leadId,
      memberIds: team.memberIds || [],
      department: team.department,
      jiraProjectKey: team.jiraProjectKey
    });
    onOpen();
  };

  // Convert peers to options for the modal
  const peerOptions: PeerOption[] = peers.map(peer => ({
    id: peer.id,
    name: peer.name,
    email: peer.email,
    role: peer.role,
    seniority: peer.seniority,
    avatar: peer.avatar
  }));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Teams</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600 mt-1">
            Manage and organize your development teams
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={handleCreateNew}
        >
          Create Team
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-blue-600">{teams.length}</div>
            <div className="text-sm text-blue-700">Total Teams</div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {teams.reduce((sum, team) => sum + team.memberCount, 0)}
            </div>
            <div className="text-sm text-green-700">Total Members</div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(teams.reduce((sum, team) => sum + team.memberCount, 0) / teams.length) || 0}
            </div>
            <div className="text-sm text-purple-700">Avg Team Size</div>
          </CardBody>
        </Card>
      </div>

      {/* Teams Grid */}
      {teams.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 text-lg">No teams found</div>
          <p className="text-gray-400 mt-2">
            Create your first team to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map((team) => (
            <Card key={team.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between w-full">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                    {team.department && (
                      <Chip size="sm" variant="flat" color="primary" className="mt-1">
                        {team.department}
                      </Chip>
                    )}
                  </div>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onPress={() => handleEditTeam(team)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardBody className="pt-0">
                <p className="text-gray-600 text-sm mb-4">
                  {team.description}
                </p>

                {/* Team Lead */}
                <div className="mb-4">
                  {team.leadName ? (
                    <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                      <Avatar
                        src={team.leadAvatar}
                        name={team.leadName}
                        size="sm"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{team.leadName}</span>
                          <Crown className="w-3 h-3 text-orange-500" />
                        </div>
                        <div className="text-xs text-gray-600">Team Lead</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-gray-500" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-600">No Team Lead Assigned</div>
                        <div className="text-xs text-gray-500">Assign a team lead to manage this team</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Team Stats */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-600">
                      {team.memberCount} member{team.memberCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created {team.createdAt.toLocaleDateString()}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <CreateTeamModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleCreateTeam}
        availablePeers={peerOptions}
        initialData={editingTeam}
        mode={modalMode}
      />
    </div>
  );
}