import { useState, useEffect } from 'react';
import { Button, Select, SelectItem, Input, Spinner, Card, CardBody, useDisclosure } from '@heroui/react';
import { Plus, Search, AlertCircle } from 'lucide-react';
import { ObjectiveCard } from '@/modules/objectives/ui/components/objective-card';
import { CreateObjectiveModal, CreateObjectiveFormData, PeerOption } from '@/modules/objectives/ui/components/create-objective-modal';
import { useObjectives, ObjectiveWithPeer } from '@/modules/objectives/ui/hooks/use-objectives';
import { usePeers } from '@/modules/peers/ui/hooks/use-peers';

export default function ObjectivesPage() {
  const { objectives, isLoading, error, createObjective } = useObjectives();
  const { peers } = usePeers();
  const [filteredObjectives, setFilteredObjectives] = useState<ObjectiveWithPeer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    let filtered = objectives;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(obj => 
        obj.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        obj.peerName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(obj => {
        switch (statusFilter) {
          case 'completed':
            return obj.isCompleted;
          case 'in_progress':
            return !obj.isCompleted && !obj.isOverdue;
          case 'overdue':
            return obj.isOverdue;
          default:
            return true;
        }
      });
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(obj => obj.priority === priorityFilter);
    }

    setFilteredObjectives(filtered);
  }, [objectives, searchTerm, statusFilter, priorityFilter]);

  const handleEditObjective = (id: string) => {
    console.log('Edit objective:', id);
    // TODO: Implement edit modal
  };

  const handleUpdateProgress = (id: string) => {
    console.log('Update progress for objective:', id);
    // TODO: Implement progress update modal
  };

  const handleCreateObjective = async (objectiveData: CreateObjectiveFormData) => {
    try {
      await createObjective(objectiveData);
    } catch (error) {
      console.error('Error creating objective:', error);
      throw error;
    }
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
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Objectives</h3>
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
          <h1 className="text-3xl font-bold text-gray-900">Objectives</h1>
          <p className="text-gray-600 mt-1">
            Track and manage team objectives and goals
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={onOpen}
        >
          New Objective
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Search objectives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<Search className="w-4 h-4 text-gray-400" />}
            className="w-full sm:w-80"
          />
          
          <div className="flex gap-2">
            <Select
              placeholder="Status"
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              className="w-32"
            >
              <SelectItem key="all">All Status</SelectItem>
              <SelectItem key="completed">Completed</SelectItem>
              <SelectItem key="in_progress">In Progress</SelectItem>
              <SelectItem key="overdue">Overdue</SelectItem>
            </Select>

            <Select
              placeholder="Priority"
              selectedKeys={[priorityFilter]}
              onSelectionChange={(keys) => setPriorityFilter(Array.from(keys)[0] as string)}
              className="w-32"
            >
              <SelectItem key="all">All Priority</SelectItem>
              <SelectItem key="critical">Critical</SelectItem>
              <SelectItem key="high">High</SelectItem>
              <SelectItem key="medium">Medium</SelectItem>
              <SelectItem key="low">Low</SelectItem>
            </Select>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-blue-100">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-blue-600">{objectives.length}</div>
            <div className="text-sm text-blue-700">Total Objectives</div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-green-50 to-green-100">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {objectives.filter(obj => obj.isCompleted).length}
            </div>
            <div className="text-sm text-green-700">Completed</div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-orange-50 to-orange-100">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {objectives.filter(obj => !obj.isCompleted && !obj.isOverdue).length}
            </div>
            <div className="text-sm text-orange-700">In Progress</div>
          </CardBody>
        </Card>
        <Card className="border-none shadow-sm bg-gradient-to-br from-red-50 to-red-100">
          <CardBody className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {objectives.filter(obj => obj.isOverdue).length}
            </div>
            <div className="text-sm text-red-700">Overdue</div>
          </CardBody>
        </Card>
      </div>

      {/* Objectives Grid */}
      {filteredObjectives.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">No objectives found</div>
          <p className="text-gray-400 mt-2">
            {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first objective to get started'
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredObjectives.map((objective) => (
            <ObjectiveCard
              key={objective.id}
              {...objective}
              onEdit={handleEditObjective}
              onUpdateProgress={handleUpdateProgress}
            />
          ))}
        </div>
      )}

      <CreateObjectiveModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={handleCreateObjective}
        availablePeers={peerOptions}
      />
    </div>
  );
}