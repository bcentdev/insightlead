import { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Progress,
  Slider,
  Textarea,
  Chip
} from '@heroui/react';
import { TrendingUp, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

// Types using functional programming approach
type ObjectiveProgressData = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly priority: string;
  readonly currentProgress: number;
  readonly targetDate: Date;
  readonly peerName: string;
  readonly tags: readonly string[];
};

type UpdateProgressModalProps = {
  readonly isOpen: boolean;
  readonly objective: ObjectiveProgressData | null;
  readonly onClose: () => void;
  readonly onUpdate: (objectiveId: string, newProgress: number, notes?: string) => Promise<void>;
};

type ProgressState = {
  readonly progress: number;
  readonly notes: string;
  readonly isLoading: boolean;
  readonly error: string | null;
};

// Pure functions
const createInitialState = (currentProgress: number): ProgressState => ({
  progress: currentProgress,
  notes: '',
  isLoading: false,
  error: null
});

const getProgressColor = (progress: number): 'primary' | 'success' | 'warning' | 'danger' => {
  if (progress >= 90) return 'success';
  if (progress >= 70) return 'success';
  if (progress >= 50) return 'warning';
  return 'primary';
};

const getProgressLabel = (progress: number): string => {
  if (progress === 0) return 'Not Started';
  if (progress === 100) return 'Completed';
  if (progress >= 90) return 'Almost Done';
  if (progress >= 70) return 'Good Progress';
  if (progress >= 50) return 'In Progress';
  if (progress >= 25) return 'Getting Started';
  return 'Just Started';
};

const formatCategoryText = (category: string): string =>
  category.replace('_', ' ');

const validateProgress = (progress: number): string | null => {
  if (progress < 0 || progress > 100) {
    return 'Progress must be between 0 and 100';
  }
  return null;
};

export const UpdateProgressModal = ({
  isOpen,
  objective,
  onClose,
  onUpdate
}: UpdateProgressModalProps) => {
  const [state, setState] = useState<ProgressState>(createInitialState(0));

  useEffect(() => {
    if (objective) {
      setState(createInitialState(objective.currentProgress));
    }
  }, [objective]);

  const handleProgressChange = (newProgress: number) => {
    setState(prev => ({ ...prev, progress: newProgress, error: null }));
  };

  const handleNotesChange = (notes: string) => {
    setState(prev => ({ ...prev, notes }));
  };

  const handleUpdate = async () => {
    if (!objective) return;

    const validationError = validateProgress(state.progress);
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      await onUpdate(
        objective.id,
        state.progress,
        state.notes.trim() || undefined
      );
      onClose();
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to update progress',
        isLoading: false
      }));
    }
  };

  const handleClose = () => {
    if (!state.isLoading) {
      setState(createInitialState(0));
      onClose();
    }
  };

  if (!objective) return null;

  const progressColor = getProgressColor(state.progress);
  const progressLabel = getProgressLabel(state.progress);
  const categoryText = formatCategoryText(objective.category);
  const canUpdate = state.progress !== objective.currentProgress || state.notes.trim().length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="2xl"
      scrollBehavior="inside"
      isDismissable={!state.isLoading}
      hideCloseButton={state.isLoading}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span>Update Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <Chip size="sm" variant="flat" color="primary">
              {categoryText}
            </Chip>
            <Chip size="sm" variant="flat" color="warning">
              {objective.priority}
            </Chip>
          </div>
        </ModalHeader>

        <ModalBody>
          {/* Objective Details */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {objective.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {objective.description}
              </p>
            </div>

            {/* Meta Information */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{objective.peerName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{format(objective.targetDate, 'MMM dd, yyyy')}</span>
              </div>
            </div>

            {/* Tags */}
            {objective.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {objective.tags.map((tag, index) => (
                  <Chip
                    key={index}
                    size="sm"
                    variant="flat"
                    color="default"
                    className="text-xs"
                  >
                    #{tag}
                  </Chip>
                ))}
              </div>
            )}

            {/* Current Progress */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-600">Current Progress</span>
                <span className="font-medium">{objective.currentProgress}%</span>
              </div>
              <Progress
                value={objective.currentProgress}
                color={getProgressColor(objective.currentProgress)}
                size="sm"
                className="w-full"
              />
            </div>

            {/* New Progress */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="font-medium text-gray-900">New Progress</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{state.progress}%</span>
                    <Chip size="sm" variant="flat" color={progressColor}>
                      {progressLabel}
                    </Chip>
                  </div>
                </div>
                
                <Slider
                  value={state.progress}
                  onChange={handleProgressChange}
                  min={0}
                  max={100}
                  step={5}
                  color={progressColor}
                  className="w-full"
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 25, label: '25%' },
                    { value: 50, label: '50%' },
                    { value: 75, label: '75%' },
                    { value: 100, label: '100%' }
                  ]}
                />
              </div>

              <Progress
                value={state.progress}
                color={progressColor}
                size="lg"
                className="w-full"
              />
            </div>

            {/* Progress Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Progress Notes (Optional)
              </label>
              <Textarea
                value={state.notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="Add any notes about this progress update..."
                rows={3}
                maxLength={500}
                disabled={state.isLoading}
              />
              <div className="text-xs text-gray-500 mt-1">
                {state.notes.length}/500 characters
              </div>
            </div>

            {/* Error Display */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{state.error}</p>
              </div>
            )}
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="flat"
            onPress={handleClose}
            disabled={state.isLoading}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleUpdate}
            disabled={!canUpdate || state.isLoading}
            isLoading={state.isLoading}
          >
            Update Progress
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};