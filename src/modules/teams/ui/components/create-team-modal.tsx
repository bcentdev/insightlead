import { useState, useEffect } from 'react';
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
  Avatar,
  Divider,
  Chip,
  Spinner,
  Card,
  CardBody,
  Autocomplete,
  AutocompleteItem
} from '@heroui/react';
import { Users, Building, User, FileText, ExternalLink } from 'lucide-react';
import { jiraService } from '../../../infrastructure/services/jira.service';
import { initializeJiraConfig } from '../../../infrastructure/services/jira-config.service';
import type { JiraProject } from '../../../infrastructure/adapters/jira/jira-client';

// Types using functional programming approach
type CreateTeamFormData = {
  readonly id?: string;
  readonly name: string;
  readonly description: string;
  readonly leadId?: string;
  readonly memberIds: readonly string[];
  readonly department?: string;
  readonly jiraProjectKey?: string;
};

type PeerOption = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
  readonly seniority: string;
  readonly avatar?: string;
};

type CreateTeamModalProps = {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onSubmit: (teamData: CreateTeamFormData) => Promise<void>;
  readonly availablePeers: readonly PeerOption[];
  readonly initialData?: CreateTeamFormData | null;
  readonly mode?: 'create' | 'edit';
};

type ModalState = {
  readonly formData: CreateTeamFormData;
  readonly isSubmitting: boolean;
  readonly errors: Record<string, string>;
  readonly jiraProjects: readonly JiraProject[];
  readonly loadingProjects: boolean;
  readonly jiraConfigured: boolean;
};

// Pure functions
const createInitialFormData = (): CreateTeamFormData => ({
  name: '',
  description: '',
  leadId: undefined,
  memberIds: [],
  department: '',
  jiraProjectKey: undefined
});

const createInitialState = (): ModalState => ({
  formData: createInitialFormData(),
  isSubmitting: false,
  errors: {},
  jiraProjects: [],
  loadingProjects: false,
  jiraConfigured: false
});

const validateForm = (formData: CreateTeamFormData): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  if (!formData.name.trim()) {
    errors.name = 'Team name is required';
  }
  
  if (!formData.description.trim()) {
    errors.description = 'Team description is required';
  }
  
  // Team lead must be included in member list (if both are specified)
  if (formData.leadId && formData.memberIds.length > 0 && !formData.memberIds.includes(formData.leadId)) {
    errors.leadId = 'Team lead must be included as a team member';
  }
  
  return errors;
};

const updateFormField = <K extends keyof CreateTeamFormData>(
  formData: CreateTeamFormData,
  field: K,
  value: CreateTeamFormData[K]
): CreateTeamFormData => ({
  ...formData,
  [field]: value
});

const handleLeadChange = (formData: CreateTeamFormData, leadId: string): CreateTeamFormData => ({
  ...formData,
  leadId: leadId || undefined,
  // Automatically add lead to members if not already included
  memberIds: leadId && !formData.memberIds.includes(leadId) 
    ? [...formData.memberIds, leadId] 
    : formData.memberIds
});

const handleMemberToggle = (formData: CreateTeamFormData, memberId: string): CreateTeamFormData => {
  const currentMembers = formData.memberIds;
  const isCurrentlySelected = currentMembers.includes(memberId);
  
  if (isCurrentlySelected) {
    // If removing the current lead, clear lead selection
    const newMemberIds = currentMembers.filter(id => id !== memberId);
    return {
      ...formData,
      memberIds: newMemberIds,
      leadId: formData.leadId === memberId ? undefined : formData.leadId
    };
  } else {
    return {
      ...formData,
      memberIds: [...currentMembers, memberId]
    };
  }
};

const getSelectedPeers = (memberIds: readonly string[], availablePeers: readonly PeerOption[]): readonly PeerOption[] =>
  memberIds.map(id => availablePeers.find(peer => peer.id === id)).filter(Boolean) as readonly PeerOption[];

const getSelectedLead = (leadId: string | undefined, availablePeers: readonly PeerOption[]): PeerOption | undefined =>
  availablePeers.find(peer => peer.id === leadId);

const filterProjects = (projects: readonly JiraProject[], filter: string): readonly JiraProject[] => {
  if (!filter.trim()) return projects;
  
  const searchTerm = filter.toLowerCase();
  return projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm) ||
    project.key.toLowerCase().includes(searchTerm) ||
    (project.description && project.description.toLowerCase().includes(searchTerm))
  );
};

export const CreateTeamModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  availablePeers, 
  initialData, 
  mode = 'create' 
}: CreateTeamModalProps) => {
  const [state, setState] = useState<ModalState>(createInitialState());
  const [projectFilter, setProjectFilter] = useState('');

  useEffect(() => {
    if (initialData && mode === 'edit') {
      setState(prev => ({ ...prev, formData: initialData }));
    } else if (mode === 'create') {
      resetForm();
    }
  }, [initialData, mode, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadJiraProjects();
    }
  }, [isOpen]);

  const loadJiraProjects = async () => {
    // Initialize Jira configuration first
    await initializeJiraConfig();
    
    const jiraConfigured = jiraService.isConfigured();
    setState(prev => ({ ...prev, jiraConfigured }));

    if (!jiraConfigured) return;

    setState(prev => ({ ...prev, loadingProjects: true }));

    try {
      const projects = await jiraService.fetchProjects();
      setState(prev => ({ 
        ...prev, 
        jiraProjects: projects,
        loadingProjects: false 
      }));
    } catch (error) {
      console.error('Failed to load Jira projects:', error);
      setState(prev => ({ 
        ...prev, 
        loadingProjects: false 
      }));
    }
  };

  const resetForm = () => {
    setState(prev => ({
      ...prev,
      formData: createInitialFormData(),
      errors: {},
      isSubmitting: false
    }));
    setProjectFilter('');
  };

  const handleFormSubmit = async () => {
    const errors = validateForm(state.formData);
    setState(prev => ({ ...prev, errors }));
    
    if (Object.keys(errors).length > 0) return;
    
    setState(prev => ({ ...prev, isSubmitting: true }));
    
    try {
      await onSubmit(state.formData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating team:', error);
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const updateFormData = <K extends keyof CreateTeamFormData>(
    field: K, 
    value: CreateTeamFormData[K]
  ) => {
    setState(prev => ({
      ...prev,
      formData: updateFormField(prev.formData, field, value),
      errors: { ...prev.errors, [field]: undefined } // Clear field error
    }));
  };

  const handleLeadSelection = (leadId: string) => {
    setState(prev => ({
      ...prev,
      formData: handleLeadChange(prev.formData, leadId),
      errors: { ...prev.errors, leadId: undefined }
    }));
  };

  const handleMemberSelection = (memberId: string) => {
    setState(prev => ({
      ...prev,
      formData: handleMemberToggle(prev.formData, memberId)
    }));
  };

  const selectedPeers = getSelectedPeers(state.formData.memberIds, availablePeers);
  const selectedLead = getSelectedLead(state.formData.leadId, availablePeers);
  const selectedProject = state.jiraProjects.find(p => p.key === state.formData.jiraProjectKey);

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
            {mode === 'edit' ? 'Edit Team' : 'Create New Team'}
          </h2>
          <p className="text-sm text-gray-600">
            {mode === 'edit' 
              ? 'Update team information, members and leadership structure'
              : 'Set up a new team with members and leadership structure'
            }
          </p>
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-6">
            {/* Team Information */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Team Information</h3>
              <div className="space-y-4">
                <Input
                  label="Team Name"
                  placeholder="Engineering Team Alpha"
                  value={state.formData.name}
                  onValueChange={(value) => updateFormData('name', value)}
                  startContent={<Users className="w-4 h-4" />}
                  isInvalid={!!state.errors.name}
                  errorMessage={state.errors.name}
                />
                
                <Textarea
                  label="Description"
                  placeholder="Describe the team's purpose and responsibilities..."
                  value={state.formData.description}
                  onValueChange={(value) => updateFormData('description', value)}
                  startContent={<FileText className="w-4 h-4" />}
                  isInvalid={!!state.errors.description}
                  errorMessage={state.errors.description}
                  minRows={3}
                />

                <Input
                  label="Department (Optional)"
                  placeholder="Engineering"
                  value={state.formData.department || ''}
                  onValueChange={(value) => updateFormData('department', value)}
                  startContent={<Building className="w-4 h-4" />}
                />
              </div>
            </div>

            <Divider />

            {/* Jira Integration */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Jira Integration (Optional)</h3>
              
              {/* Mini Tutorial */}
              <div className="mb-4">
                <Card className="border-none bg-blue-50">
                  <CardBody className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <ExternalLink className="w-3 h-3 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-800 text-sm mb-1">About Jira Integration</h4>
                        <div className="text-xs text-blue-700 space-y-1">
                          <p>• Track team issues, bugs, and stories automatically</p>
                          <p>• Monitor progress with the query: <code className="bg-blue-200 px-1 rounded">project = BER AND assignee WAS [user] DURING (-30d, now())</code></p>
                          <p>• View issue types: Bugs, Stories, Spikes in the dashboard</p>
                          <p>• Requires Jira API configuration in Settings first</p>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {!state.jiraConfigured ? (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-orange-600" />
                    <p className="text-sm text-orange-800">
                      Configure Jira connection in Settings to enable project selection
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Select a Jira project to track team issues and progress. This will enable issue tracking for team members.
                  </p>
                  
                  <Autocomplete
                    label="Jira Project"
                    placeholder={state.loadingProjects ? "Loading projects..." : "Search and select a Jira project (optional)"}
                    selectedKey={state.formData.jiraProjectKey || null}
                    onSelectionChange={(key) => {
                      const projectKey = key as string;
                      updateFormData('jiraProjectKey', projectKey || undefined);
                    }}
                    onInputChange={setProjectFilter}
                    startContent={<ExternalLink className="w-4 h-4" />}
                    isDisabled={state.loadingProjects}
                    endContent={state.loadingProjects ? <Spinner size="sm" /> : undefined}
                    allowsCustomValue={false}
                    menuTrigger="input"
                    classNames={{
                      listboxWrapper: "max-h-[200px] overflow-auto"
                    }}
                  >
                    {filterProjects(state.jiraProjects, projectFilter).map((project) => (
                      <AutocompleteItem 
                        key={project.key} 
                        textValue={`${project.key} - ${project.name}`}
                        startContent={
                          project.avatarUrls?.['24x24'] ? (
                            <Avatar
                              src={project.avatarUrls['24x24']}
                              name={project.key}
                              size="sm"
                              className="w-6 h-6"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                              <ExternalLink className="w-3 h-3 text-blue-600" />
                            </div>
                          )
                        }
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{project.key}</span>
                          <span className="text-sm text-gray-500">{project.name}</span>
                          {project.description && (
                            <span className="text-xs text-gray-400 truncate max-w-[300px]">
                              {project.description}
                            </span>
                          )}
                        </div>
                      </AutocompleteItem>
                    ))}
                  </Autocomplete>

                  {selectedProject && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {selectedProject.avatarUrls?.['32x32'] ? (
                          <Avatar
                            src={selectedProject.avatarUrls['32x32']}
                            name={selectedProject.key}
                            size="sm"
                            className="w-8 h-8"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <ExternalLink className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-medium">{selectedProject.key}</div>
                          <div className="text-sm text-gray-600">{selectedProject.name}</div>
                          {selectedProject.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {selectedProject.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <Divider />

            {/* Team Lead Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Team Lead (Optional)</h3>
              <p className="text-sm text-gray-600 mb-3">
                You can assign a team lead now or later after adding team members.
              </p>
              <Select
                label="Select Team Lead"
                placeholder="Choose a team lead (optional)"
                selectedKeys={state.formData.leadId ? [state.formData.leadId] : []}
                onSelectionChange={(keys) => {
                  const leadId = Array.from(keys)[0] as string;
                  handleLeadSelection(leadId);
                }}
                startContent={<User className="w-4 h-4" />}
                isInvalid={!!state.errors.leadId}
                errorMessage={state.errors.leadId}
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

              {selectedLead && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Avatar src={selectedLead.avatar} name={selectedLead.name} size="sm" />
                    <div>
                      <div className="font-medium">{selectedLead.name}</div>
                      <div className="text-sm text-gray-600">{selectedLead.email}</div>
                      <div className="flex gap-2 mt-1">
                        <Chip size="sm" variant="flat" color="primary">{selectedLead.role}</Chip>
                        <Chip size="sm" variant="flat">{selectedLead.seniority}</Chip>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Divider />

            {/* Team Members Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Team Members (Optional)</h3>
              <p className="text-sm text-gray-600 mb-3">
                Select team members now or add them later. You can create an empty team and populate it afterward.
              </p>
              
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                {availablePeers.map((peer) => {
                  const isSelected = state.formData.memberIds.includes(peer.id);
                  const isLead = state.formData.leadId === peer.id;
                  
                  return (
                    <div
                      key={peer.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleMemberSelection(peer.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar src={peer.avatar} name={peer.name} size="sm" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{peer.name}</span>
                            {isLead && (
                              <Chip size="sm" color="warning" variant="flat">Lead</Chip>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{peer.email}</div>
                          <div className="flex gap-2 mt-1">
                            <Chip size="sm" variant="flat">{peer.role}</Chip>
                            <Chip size="sm" variant="flat">{peer.seniority}</Chip>
                          </div>
                        </div>
                        <div className={`w-4 h-4 rounded border-2 ${
                          isSelected 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-sm"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {selectedPeers.length > 0 && (
                <div className="mt-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Selected Members ({selectedPeers.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedPeers.map((peer) => (
                      <Chip
                        key={peer.id}
                        variant="flat"
                        color={state.formData.leadId === peer.id ? "warning" : "primary"}
                        onClose={() => handleMemberSelection(peer.id)}
                      >
                        {peer.name} {state.formData.leadId === peer.id && "(Lead)"}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
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
            onPress={handleFormSubmit}
            isLoading={state.isSubmitting}
          >
            {mode === 'edit' ? 'Update Team' : 'Create Team'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Export types
export type { CreateTeamFormData, PeerOption };