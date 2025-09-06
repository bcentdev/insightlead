import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Slider,
  Avatar,
  Divider,
  Chip,
} from '@heroui/react';
import { Target, User, Calendar, Flag, Tag, FileText, TrendingUp } from 'lucide-react';
import { OBJECTIVE_CATEGORIES, OBJECTIVE_PRIORITIES, ObjectiveCategory, ObjectivePriority } from '@/modules/objectives/domain/objective.entity';

export type CreateObjectiveFormData = {
  readonly title: string;
  readonly description: string;
  readonly peerId: string;
  readonly category: ObjectiveCategory;
  readonly priority: ObjectivePriority;
  readonly progress: number;
  readonly targetDate: Date;
  readonly tags: readonly string[];
};

export type PeerOption = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly seniority: string;
  readonly avatar?: string;
};

type CreateObjectiveModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (objectiveData: CreateObjectiveFormData) => Promise<void>;
  readonly availablePeers: readonly PeerOption[];
};

export function CreateObjectiveModal({ isOpen, onClose, onSubmit, availablePeers }: CreateObjectiveModalProps) {
  const [formData, setFormData] = useState<CreateObjectiveFormData>({
    title: '',
    description: '',
    peerId: '',
    category: OBJECTIVE_CATEGORIES.TECHNICAL_SKILLS,
    priority: OBJECTIVE_PRIORITIES.MEDIUM,
    progress: 0,
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    tags: []
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTag, setNewTag] = useState('');

  const categoryOptions = [
    { key: OBJECTIVE_CATEGORIES.TECHNICAL_SKILLS, label: 'Technical Skills', icon: '🛠️' },
    { key: OBJECTIVE_CATEGORIES.LEADERSHIP, label: 'Leadership', icon: '👥' },
    { key: OBJECTIVE_CATEGORIES.PROJECT_DELIVERY, label: 'Project Delivery', icon: '🚀' },
    { key: OBJECTIVE_CATEGORIES.TEAM_COLLABORATION, label: 'Team Collaboration', icon: '🤝' },
    { key: OBJECTIVE_CATEGORIES.PROCESS_IMPROVEMENT, label: 'Process Improvement', icon: '⚡' },
    { key: OBJECTIVE_CATEGORIES.MENTORING, label: 'Mentoring', icon: '🎓' },
    { key: OBJECTIVE_CATEGORIES.COMMUNICATION, label: 'Communication', icon: '💬' },
    { key: OBJECTIVE_CATEGORIES.INNOVATION, label: 'Innovation', icon: '💡' }
  ];

  const priorityOptions = [
    { key: OBJECTIVE_PRIORITIES.LOW, label: 'Low', color: 'default' as const },
    { key: OBJECTIVE_PRIORITIES.MEDIUM, label: 'Medium', color: 'primary' as const },
    { key: OBJECTIVE_PRIORITIES.HIGH, label: 'High', color: 'warning' as const },
    { key: OBJECTIVE_PRIORITIES.CRITICAL, label: 'Critical', color: 'danger' as const }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Objective title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Objective description is required';
    }
    
    if (!formData.peerId) {
      newErrors.peerId = 'Assignee is required';
    }
    
    if (formData.targetDate <= new Date()) {
      newErrors.targetDate = 'Target date must be in the future';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating objective:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      peerId: '',
      category: OBJECTIVE_CATEGORIES.TECHNICAL_SKILLS,
      priority: OBJECTIVE_PRIORITIES.MEDIUM,
      progress: 0,
      targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      tags: []
    });
    setErrors({});
    setNewTag('');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const addTag = () => {
    const tag = newTag.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const selectedPeer = availablePeers.find(peer => peer.id === formData.peerId);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="3xl"
      scrollBehavior="inside"
      classNames={{
        body: "py-6",
        backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Create New Objective
          </h2>
          <p className="text-sm text-gray-600">
            Set a new objective to track progress and achieve goals
          </p>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Basic Information</h3>
              <div className="space-y-4">
                <Input
                  label="Objective Title"
                  placeholder="e.g., Improve code review process by 30%"
                  value={formData.title}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, title: value }))}
                  startContent={<Target className="w-4 h-4" />}
                  isInvalid={!!errors.title}
                  errorMessage={errors.title}
                />
                
                <Textarea
                  label="Description"
                  placeholder="Describe the objective, success criteria, and expected outcomes..."
                  value={formData.description}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, description: value }))}
                  startContent={<FileText className="w-4 h-4" />}
                  isInvalid={!!errors.description}
                  errorMessage={errors.description}
                  minRows={3}
                />
              </div>
            </div>

            <Divider />

            {/* Assignment and Classification */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Assignment & Classification</h3>
              <div className="space-y-4">
                <Select
                  label="Assign to"
                  placeholder="Select team member"
                  selectedKeys={formData.peerId ? [formData.peerId] : []}
                  onSelectionChange={(keys) => setFormData(prev => ({ 
                    ...prev, 
                    peerId: Array.from(keys)[0] as string 
                  }))}
                  startContent={<User className="w-4 h-4" />}
                  isInvalid={!!errors.peerId}
                  errorMessage={errors.peerId}
                >
                  {availablePeers.map((peer) => (
                    <SelectItem key={peer.id} textValue={peer.name}>
                      <div className="flex items-center gap-3">
                        <Avatar src={peer.avatar} name={peer.name} size="sm" />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{peer.name}</span>
                          <span className="text-xs text-gray-500">{peer.role} • {peer.seniority}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </Select>

                {selectedPeer && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar src={selectedPeer.avatar} name={selectedPeer.name} size="sm" />
                      <div>
                        <div className="font-medium">{selectedPeer.name}</div>
                        <div className="text-sm text-gray-600">{selectedPeer.email}</div>
                        <div className="flex gap-2 mt-1">
                          <Chip size="sm" variant="flat" color="primary">{selectedPeer.role}</Chip>
                          <Chip size="sm" variant="flat">{selectedPeer.seniority}</Chip>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Category"
                    selectedKeys={[formData.category]}
                    onSelectionChange={(keys) => setFormData(prev => ({ 
                      ...prev, 
                      category: Array.from(keys)[0] as ObjectiveCategory 
                    }))}
                    startContent={<Tag className="w-4 h-4" />}
                  >
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.key} textValue={category.label}>
                        <div className="flex items-center gap-2">
                          <span>{category.icon}</span>
                          <span>{category.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>

                  <Select
                    label="Priority"
                    selectedKeys={[formData.priority]}
                    onSelectionChange={(keys) => setFormData(prev => ({ 
                      ...prev, 
                      priority: Array.from(keys)[0] as ObjectivePriority 
                    }))}
                    startContent={<Flag className="w-4 h-4" />}
                  >
                    {priorityOptions.map((priority) => (
                      <SelectItem key={priority.key} textValue={priority.label}>
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color={priority.color} variant="flat">
                            {priority.label}
                          </Chip>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <Divider />

            {/* Progress and Timeline */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Progress & Timeline</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Initial Progress: {formData.progress}%
                  </label>
                  <Slider
                    value={formData.progress}
                    onChange={(value) => setFormData(prev => ({ ...prev, progress: Array.isArray(value) ? value[0] : value }))}
                    maxValue={100}
                    step={5}
                    color="primary"
                    startContent={<TrendingUp className="w-4 h-4" />}
                    className="w-full"
                  />
                </div>

                <Input
                  label="Target Date"
                  type="date"
                  value={formData.targetDate.toISOString().split('T')[0]}
                  onValueChange={(value) => setFormData(prev => ({ 
                    ...prev, 
                    targetDate: new Date(value) 
                  }))}
                  startContent={<Calendar className="w-4 h-4" />}
                  isInvalid={!!errors.targetDate}
                  errorMessage={errors.targetDate}
                />
              </div>
            </div>

            <Divider />

            {/* Tags */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Tags</h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    label="Add tags"
                    placeholder="e.g., automation, react, testing"
                    value={newTag}
                    onValueChange={setNewTag}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button
                    variant="flat"
                    onPress={addTag}
                    isDisabled={!newTag.trim()}
                    className="mt-2"
                  >
                    Add
                  </Button>
                </div>

                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        variant="flat"
                        color="primary"
                        onClose={() => removeTag(tag)}
                      >
                        #{tag}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalBody>
        
        <ModalFooter>
          <Button 
            variant="light" 
            onPress={handleClose}
          >
            Cancel
          </Button>
          <Button 
            color="primary" 
            onPress={handleSubmit}
            isLoading={isSubmitting}
          >
            Create Objective
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}