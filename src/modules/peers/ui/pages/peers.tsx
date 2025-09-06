import { useState, useEffect } from 'react';
import { Button, Input, Select, SelectItem, Card, CardBody, CardHeader, Avatar, Chip, Progress, Spinner, useDisclosure } from '@heroui/react';
import { Plus, Search, Github, ExternalLink, Calendar, AlertCircle, Edit } from 'lucide-react';
import { AddPeerModal, AddPeerFormData, TeamOption } from '@/modules/peers/ui/components/add-peer-modal';
import { usePeers, PeerWithMetrics } from '@/modules/peers/ui/hooks/use-peers';
import { useTeams } from '@/modules/teams/ui/hooks/use-teams';

export default function PeersPage() {
  const { peers, isLoading, error, addPeer, updatePeer, defaultTeamId } = usePeers();
  const { teams } = useTeams();
  const [filteredPeers, setFilteredPeers] = useState<PeerWithMetrics[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [seniorityFilter, setSeniorityFilter] = useState('all');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingPeer, setEditingPeer] = useState<AddPeerFormData | null>(null);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  useEffect(() => {
    let filtered = peers;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(peer => 
        peer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        peer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        peer.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(peer => peer.role.toLowerCase().replace(/\s+/g, '_') === roleFilter);
    }

    // Apply seniority filter
    if (seniorityFilter !== 'all') {
      filtered = filtered.filter(peer => peer.seniority.toLowerCase() === seniorityFilter);
    }

    setFilteredPeers(filtered);
  }, [peers, searchTerm, roleFilter, seniorityFilter]);

  const getRoleColor = (role: string) => {
    const roleMap: Record<string, any> = {
      'Engineering Lead': 'primary',
      'Frontend Developer': 'success',
      'Backend Developer': 'warning',
      'Full Stack Developer': 'secondary',
      'QA Engineer': 'danger'
    };
    return roleMap[role] || 'default';
  };

  const getSeniorityColor = (seniority: string) => {
    const seniorityMap: Record<string, any> = {
      'Junior': 'default',
      'Mid': 'primary',
      'Senior': 'warning',
      'Lead': 'danger'
    };
    return seniorityMap[seniority] || 'default';
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const handleAddPeer = async (peerData: AddPeerFormData) => {
    try {
      if (modalMode === 'edit') {
        await updatePeer(peerData);
      } else {
        await addPeer(peerData);
      }
    } catch (error) {
      console.error('Error saving peer:', error);
      throw error;
    }
  };

  const handleCreateNew = () => {
    setModalMode('create');
    setEditingPeer(null);
    onOpen();
  };

  const handleEditPeer = (peer: PeerWithMetrics) => {
    setModalMode('edit');
    setEditingPeer({
      id: peer.id,
      name: peer.name,
      email: peer.email,
      githubUsername: peer.githubUsername,
      jiraUsername: peer.jiraUsername,
      teamId: defaultTeamId, // We'll need to get this from the peer data
      role: peer.role.toLowerCase().replace(/\s+/g, '_') as any,
      seniority: peer.seniority.toLowerCase() as any,
      avatar: peer.avatar
    });
    onOpen();
  };

  // Convert teams to options for the modal
  const teamOptions: TeamOption[] = teams.map(team => ({
    id: team.id,
    name: team.name,
    leadName: team.leadName,
    memberCount: team.memberCount
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Team Members</h3>
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
          <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
          <p className="text-gray-600 mt-1">
            Manage and track your team members' performance
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={handleCreateNew}
        >
          Add Member
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <Input
          placeholder="Search team members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          startContent={<Search className="w-4 h-4 text-gray-400" />}
          className="w-full sm:w-80"
        />
        
        <div className="flex gap-2">
          <Select
            placeholder="Role"
            selectedKeys={[roleFilter]}
            onSelectionChange={(keys) => setRoleFilter(Array.from(keys)[0] as string)}
            className="w-48"
          >
            <SelectItem key="all">All Roles</SelectItem>
            <SelectItem key="engineering_lead">Engineering Lead</SelectItem>
            <SelectItem key="frontend_developer">Frontend Developer</SelectItem>
            <SelectItem key="backend_developer">Backend Developer</SelectItem>
            <SelectItem key="full_stack_developer">Full Stack Developer</SelectItem>
            <SelectItem key="qa_engineer">QA Engineer</SelectItem>
          </Select>

          <Select
            placeholder="Seniority"
            selectedKeys={[seniorityFilter]}
            onSelectionChange={(keys) => setSeniorityFilter(Array.from(keys)[0] as string)}
            className="w-32"
          >
            <SelectItem key="all">All Levels</SelectItem>
            <SelectItem key="junior">Junior</SelectItem>
            <SelectItem key="mid">Mid</SelectItem>
            <SelectItem key="senior">Senior</SelectItem>
            <SelectItem key="lead">Lead</SelectItem>
          </Select>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-blue-600">{peers.length}</div>
            <div className="text-sm text-blue-700">Total Members</div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {Math.round(peers.reduce((sum, peer) => sum + peer.completionRate, 0) / peers.length)}%
            </div>
            <div className="text-sm text-green-700">Avg Completion Rate</div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-purple-50 to-purple-100">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-purple-600">
              {peers.reduce((sum, peer) => sum + peer.objectivesTotal, 0)}
            </div>
            <div className="text-sm text-purple-700">Active Objectives</div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {peers.reduce((sum, peer) => sum + peer.keyMetrics.pullRequests, 0)}
            </div>
            <div className="text-sm text-orange-700">PRs This Month</div>
          </CardBody>
        </Card>
      </div>

      {/* Members Grid */}
      {filteredPeers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No team members found</div>
          <p className="text-gray-400 mt-2">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredPeers.map((peer) => (
            <Card key={peer.id} className="border-none shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start gap-4 w-full">
                  <Avatar
                    src={peer.avatar}
                    name={peer.name}
                    size="lg"
                    className="flex-shrink-0"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{peer.name}</h3>
                        <p className="text-sm text-gray-600">{peer.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          as="a"
                          href={`https://github.com/${peer.githubUsername}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          isIconOnly
                          variant="light"
                          size="sm"
                        >
                          <Github className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                          onPress={() => handleEditPeer(peer)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getRoleColor(peer.role)}
                      >
                        {peer.role}
                      </Chip>
                      <Chip
                        size="sm"
                        variant="flat"
                        color={getSeniorityColor(peer.seniority)}
                      >
                        {peer.seniority}
                      </Chip>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardBody className="pt-0">
                {/* Objectives Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">Objectives Progress</span>
                    <span className="font-medium">
                      {peer.objectivesCompleted}/{peer.objectivesTotal} ({Math.round(peer.completionRate)}%)
                    </span>
                  </div>
                  <Progress
                    value={peer.completionRate}
                    color={peer.completionRate >= 80 ? 'success' : peer.completionRate >= 60 ? 'warning' : 'danger'}
                    size="sm"
                    className="w-full"
                  />
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">
                      {peer.keyMetrics.pullRequests}
                    </div>
                    <div className="text-xs text-gray-600">Pull Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">
                      {peer.keyMetrics.codeReviews}
                    </div>
                    <div className="text-xs text-gray-600">Code Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      {peer.keyMetrics.storiesCompleted}
                    </div>
                    <div className="text-xs text-gray-600">Stories Done</div>
                  </div>
                </div>

                {/* Last Active */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Last active: {formatDate(peer.lastActive)}</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <AddPeerModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleAddPeer}
        availableTeams={teamOptions}
        defaultTeamId={defaultTeamId}
        initialData={editingPeer}
        mode={modalMode}
      />
    </div>
  );
}