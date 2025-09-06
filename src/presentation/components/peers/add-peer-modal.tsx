import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Avatar,
  Divider,
  Chip
} from '@heroui/react';
import { User, Mail, Github, AtSign, Briefcase, Award, Image, TestTube, Users } from 'lucide-react';
import { PeerRole, Seniority, PEER_ROLES, SENIORITY_LEVELS } from '../../../domain/entities/peer.entity';

type AddPeerModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (peerData: AddPeerFormData) => Promise<void>;
  readonly availableTeams?: readonly TeamOption[];
  readonly defaultTeamId?: string;
  readonly initialData?: AddPeerFormData | null;
  readonly mode?: 'create' | 'edit';
};

export type AddPeerFormData = {
  readonly id?: string;
  readonly name: string;
  readonly email: string;
  readonly githubUsername: string;
  readonly jiraUsername?: string;
  readonly teamId: string;
  readonly role: PeerRole;
  readonly seniority: Seniority;
  readonly avatar?: string;
};

export type TeamOption = {
  readonly id: string;
  readonly name: string;
  readonly leadName: string;
  readonly memberCount: number;
};

export function AddPeerModal({ isOpen, onClose, onSubmit, availableTeams = [], defaultTeamId = '', initialData, mode = 'create' }: AddPeerModalProps) {
  const [formData, setFormData] = useState<AddPeerFormData>({
    name: '',
    email: '',
    githubUsername: '',
    jiraUsername: '',
    teamId: defaultTeamId,
    role: PEER_ROLES.FRONTEND_DEVELOPER,
    seniority: SENIORITY_LEVELS.MID,
    avatar: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [testingGithub, setTestingGithub] = useState(false);
  const [githubValid, setGithubValid] = useState<boolean | null>(null);
  const [fetchingAvatar, setFetchingAvatar] = useState(false);

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setFormData(initialData);
    } else if (mode === 'create') {
      resetForm();
    }
  }, [initialData, mode, isOpen]);

  const roleOptions = [
    { key: PEER_ROLES.FRONTEND_DEVELOPER, label: 'Frontend Developer', icon: '⚛️' },
    { key: PEER_ROLES.BACKEND_DEVELOPER, label: 'Backend Developer', icon: '🔧' },
    { key: PEER_ROLES.FULLSTACK_DEVELOPER, label: 'Full Stack Developer', icon: '🌐' },
    { key: PEER_ROLES.QA_ENGINEER, label: 'QA Engineer', icon: '🧪' },
    { key: PEER_ROLES.DEVOPS_ENGINEER, label: 'DevOps Engineer', icon: '🚀' },
    { key: PEER_ROLES.PRODUCT_MANAGER, label: 'Product Manager', icon: '📊' },
    { key: PEER_ROLES.UI_UX_DESIGNER, label: 'UI/UX Designer', icon: '🎨' }
  ];

  const seniorityOptions = [
    { key: SENIORITY_LEVELS.JUNIOR, label: 'Junior', color: 'default' as const },
    { key: SENIORITY_LEVELS.MID, label: 'Mid', color: 'primary' as const },
    { key: SENIORITY_LEVELS.SENIOR, label: 'Senior', color: 'warning' as const },
    { key: SENIORITY_LEVELS.LEAD, label: 'Lead', color: 'danger' as const },
    { key: SENIORITY_LEVELS.PRINCIPAL, label: 'Principal', color: 'secondary' as const }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.githubUsername.trim()) {
      newErrors.githubUsername = 'GitHub username is required';
    }
    
    if (!formData.teamId) {
      newErrors.teamId = 'Team selection is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const testGithubUsername = async () => {
    if (!formData.githubUsername.trim()) return;
    
    setTestingGithub(true);
    try {
      // Simulate GitHub API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      // For demo purposes, assume usernames starting with 'invalid' are invalid
      const isValid = !formData.githubUsername.toLowerCase().startsWith('invalid');
      setGithubValid(isValid);
    } catch {
      setGithubValid(false);
    } finally {
      setTestingGithub(false);
    }
  };

  const fetchGitHubAvatar = async () => {
    if (!formData.githubUsername.trim()) return;
    
    setFetchingAvatar(true);
    try {
      // Simulate GitHub API call to fetch user profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, generate GitHub avatar URL
      const avatarUrl = `https://github.com/${formData.githubUsername}.png`;
      setFormData(prev => ({ ...prev, avatar: avatarUrl }));
    } catch (error) {
      console.error('Error fetching GitHub avatar:', error);
    } finally {
      setFetchingAvatar(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error adding peer:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      githubUsername: '',
      jiraUsername: '',
      teamId: defaultTeamId,
      role: PEER_ROLES.FRONTEND_DEVELOPER,
      seniority: SENIORITY_LEVELS.MID,
      avatar: ''
    });
    setErrors({});
    setGithubValid(null);
    setFetchingAvatar(false);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const generateAvatar = () => {
    if (formData.email) {
      const avatar = `https://i.pravatar.cc/150?u=${encodeURIComponent(formData.email)}`;
      setFormData(prev => ({ ...prev, avatar }));
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        body: "py-6",
        backdrop: "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20"
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {mode === 'edit' ? 'Edit Team Member' : 'Add Team Member'}
          </h2>
          <p className="text-sm text-gray-600">
            {mode === 'edit' 
              ? 'Update team member information and settings'
              : 'Add a new team member to track their performance and objectives'
            }
          </p>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={formData.name}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, name: value }))}
                  startContent={<User className="w-4 h-4" />}
                  isInvalid={!!errors.name}
                  errorMessage={errors.name}
                />
                
                <Input
                  label="Email Address"
                  placeholder="john.doe@company.com"
                  value={formData.email}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                  startContent={<Mail className="w-4 h-4" />}
                  isInvalid={!!errors.email}
                  errorMessage={errors.email}
                />

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      label="Avatar URL (Optional)"
                      placeholder="https://example.com/avatar.jpg"
                      value={formData.avatar}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, avatar: value }))}
                      startContent={<Image className="w-4 h-4" />}
                      className="flex-1"
                    />
                    <Button
                      variant="flat"
                      onPress={generateAvatar}
                      className="mt-2"
                    >
                      Generate
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="flat"
                      startContent={<Github className="w-4 h-4" />}
                      onPress={fetchGitHubAvatar}
                      isLoading={fetchingAvatar}
                      isDisabled={!formData.githubUsername.trim()}
                      className="flex-1"
                    >
                      Use GitHub Avatar
                    </Button>
                  </div>
                </div>

                {formData.avatar && (
                  <div className="flex items-center gap-3">
                    <Avatar src={formData.avatar} size="sm" />
                    <span className="text-sm text-gray-600">Avatar preview</span>
                  </div>
                )}
              </div>
            </div>

            <Divider />

            {/* Integration Settings */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Integration Settings</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    label="GitHub Username"
                    placeholder="johndoe123"
                    value={formData.githubUsername}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, githubUsername: value }))}
                    startContent={<Github className="w-4 h-4" />}
                    isInvalid={!!errors.githubUsername}
                    errorMessage={errors.githubUsername}
                    className="flex-1"
                  />
                  <Button
                    variant="flat"
                    startContent={<TestTube className="w-4 h-4" />}
                    onPress={testGithubUsername}
                    isLoading={testingGithub}
                    className="mt-2"
                  >
                    Test
                  </Button>
                </div>

                {githubValid !== null && (
                  <div className="flex items-center gap-2">
                    <Chip
                      color={githubValid ? 'success' : 'danger'} 
                      variant="flat"
                      size="sm"
                    >
                      {githubValid ? 'GitHub user found' : 'GitHub user not found'}
                    </Chip>
                  </div>
                )}
                
                <Input
                  label="Jira Username (Optional)"
                  placeholder="john.doe@company.com"
                  value={formData.jiraUsername}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, jiraUsername: value }))}
                  startContent={<AtSign className="w-4 h-4" />}
                />
              </div>
            </div>

            <Divider />

            {/* Role & Seniority */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Role & Seniority</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Role"
                  selectedKeys={[formData.role]}
                  onSelectionChange={(keys) => setFormData(prev => ({ 
                    ...prev, 
                    role: Array.from(keys)[0] as PeerRole 
                  }))}
                  startContent={<Briefcase className="w-4 h-4" />}
                >
                  {roleOptions.map((role) => (
                    <SelectItem key={role.key} textValue={role.label}>
                      <div className="flex items-center gap-2">
                        <span>{role.icon}</span>
                        <span>{role.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Seniority Level"
                  selectedKeys={[formData.seniority]}
                  onSelectionChange={(keys) => setFormData(prev => ({ 
                    ...prev, 
                    seniority: Array.from(keys)[0] as Seniority 
                  }))}
                  startContent={<Award className="w-4 h-4" />}
                >
                  {seniorityOptions.map((seniority) => (
                    <SelectItem key={seniority.key} textValue={seniority.label}>
                      <div className="flex items-center gap-2">
                        <Chip size="sm" color={seniority.color} variant="flat">
                          {seniority.label}
                        </Chip>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            <Divider />

            {/* Team Assignment */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Team Assignment</h3>
              <Select
                label="Team"
                placeholder="Select a team"
                selectedKeys={formData.teamId ? [formData.teamId] : []}
                onSelectionChange={(keys) => setFormData(prev => ({ 
                  ...prev, 
                  teamId: Array.from(keys)[0] as string 
                }))}
                startContent={<Users className="w-4 h-4" />}
                isInvalid={!!errors.teamId}
                errorMessage={errors.teamId}
              >
                {availableTeams.map((team) => (
                  <SelectItem key={team.id} textValue={team.name}>
                    <div className="flex flex-col">
                      <span className="font-medium">{team.name}</span>
                      <span className="text-sm text-gray-500">
                        Lead: {team.leadName} • {team.memberCount} members
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </Select>
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
            {mode === 'edit' ? 'Update Team Member' : 'Add Team Member'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}