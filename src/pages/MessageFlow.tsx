import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  SelectChangeEvent,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient,
{
  BackendModuleOrderEntry,
  ModuleOrderResponse,
  BackendMessageFlow,
  MessageFlowsResponse,
  MessageFlowStep,
  UpdateMessageFlowStepsPayload,
  fetchModuleOrder,
  fetchMessageFlowsForModule,
  updateMessageFlowSteps,
} from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

// --- Component --- 

// Simplified step type for UI state
interface StepUI {
  id: string; // Use index or generate temp ID for react key/dnd
  message_content: string;
}

const MessageFlow = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [currentFlowId, setCurrentFlowId] = useState<string | null>(null);
  const [steps, setSteps] = useState<StepUI[]>([]); // Local state for editing steps
  const [originalSteps, setOriginalSteps] = useState<StepUI[]>([]);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStep, setEditingStep] = useState<StepUI | null>(null);
  const [newStepContent, setNewStepContent] = useState<string>('');

  // --- Queries --- 

  // Query for fetching modules (to populate the dropdown)
  const {
    data: modules = [],
    isLoading: isLoadingModules,
    isError: isErrorLoadingModules,
    error: moduleLoadingError,
  } = useQuery<ModuleOrderResponse, Error, BackendModuleOrderEntry[]>({ 
    queryKey: ['moduleOrder', token],
    queryFn: () => token ? fetchModuleOrder(token) : Promise.reject(new Error('Not authenticated')),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes 
    gcTime: 15 * 60 * 1000, // 15 minutes (gcTime replaces cacheTime in v4/v5)
  });

  // Query for fetching message flows when a module is selected
  const {
    data: messageFlows = [],
    isLoading: isLoadingFlows,
    isFetching: isFetchingFlows,
    isError: isErrorLoadingFlows,
    error: flowLoadingError,
  } = useQuery<MessageFlowsResponse, Error>({ 
    queryKey: ['messageFlows', selectedModuleId, token],
    queryFn: () => 
      token && selectedModuleId 
        ? fetchMessageFlowsForModule(selectedModuleId, token) 
        : Promise.reject(new Error('Module not selected or not authenticated')),
    enabled: !!selectedModuleId && !!token,
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // --- Mutations --- 

  // Mutation for updating message flow steps
  const {
    mutate: updateStepsMutation,
    isPending: isUpdatingSteps,
    isError: isErrorUpdatingSteps,
    error: updatingStepsError,
  } = useMutation<void, Error, StepUI[]>({ // Input is the new list of steps
    mutationFn: async (updatedSteps: StepUI[]) => {
      if (!currentFlowId) throw new Error('Cannot update steps without a selected flow ID.');
      if (!token) throw new Error('Not authenticated');
      
      const payload: UpdateMessageFlowStepsPayload = {
        steps: updatedSteps.map(step => ({ message_content: step.message_content }))
      };
      await updateMessageFlowSteps(currentFlowId, payload, token);
    },
    onSuccess: (data, updatedSteps) => {
      queryClient.invalidateQueries({ queryKey: ['messageFlows', selectedModuleId, token] });
      setHasChanges(false);
      console.log('Message flow steps updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update message flow steps:', error);
    },
  });

  // --- Effects --- 

  // Effect to reset state when module selection changes OR after successful fetch
  useEffect(() => {
    setCurrentFlowId(null);
    setSteps([]);
    setOriginalSteps([]);
    setHasChanges(false);

    // If a module is selected, try to find the first active flow
    if (selectedModuleId && messageFlows.length > 0) {
        const activeFlow = messageFlows.find(flow => flow.is_active);
        const flowToEdit = activeFlow || messageFlows[0]; 
        
        if (flowToEdit) {
          setCurrentFlowId(flowToEdit.id);
          // Map backend steps to simplified UI steps with temporary IDs
          const initialSteps = flowToEdit.steps.map((step, index) => ({
             id: `step-${index}-${Date.now()}-${Math.random()}`, // Improve uniqueness slightly
             message_content: step.message_content,
          }));
          setSteps(initialSteps);
          setOriginalSteps(initialSteps);
        }
    }
  }, [selectedModuleId, messageFlows]); // Rerun when selection or fetched flows change

  // --- NEW: Effect to track changes ---
  useEffect(() => {
      // Compare current steps to original steps (simple JSON comparison)
      // This relies on the temporary IDs being stable between renders until a fetch
      const originalString = JSON.stringify(originalSteps.map(s => s.message_content));
      const currentString = JSON.stringify(steps.map(s => s.message_content));
      // Only set changes if not currently loading/updating (prevents flicker)
      if (!isLoadingFlows && !isUpdatingSteps) {
          setHasChanges(originalString !== currentString);
      }
  }, [steps, originalSteps, isLoadingFlows, isUpdatingSteps]);

  // --- Event Handlers --- 

  const handleModuleChange = (event: SelectChangeEvent) => {
    setSelectedModuleId(event.target.value);
    // State resets are handled by the useEffect
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }
    const items = Array.from(steps);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSteps(items);
  };

  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    const index = steps.findIndex(s => s.id === stepId);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === steps.length - 1)
    ) {
      return;
    }

    const newSteps = [...steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    setSteps(newSteps);
  };

  const handleAddStep = () => {
    setEditingStep(null);
    setNewStepContent('');
    setOpenDialog(true);
  };

  const handleEditStep = (step: StepUI) => {
    setEditingStep(step);
    setNewStepContent(step.message_content);
    setOpenDialog(true);
  };

  const handleSaveStep = () => {
    if (!newStepContent.trim()) return; // Basic validation

    let updatedSteps: StepUI[];
    if (editingStep) {
      // Update existing step
      updatedSteps = steps.map(s => 
        s.id === editingStep.id ? { ...s, message_content: newStepContent } : s
      );
    } else {
      // Add new step to the end
      const newStep: StepUI = {
        id: `new-step-${Date.now()}-${Math.random()}`, // Temporary ID
        message_content: newStepContent,
      };
      updatedSteps = [...steps, newStep];
    }
    setOpenDialog(false);
    setSteps(updatedSteps);
  };

  const handleDeleteStep = (stepId: string) => {
    const updatedSteps = steps.filter(s => s.id !== stepId);
    setSteps(updatedSteps);
  };

  // --- NEW: Save and Reset Handlers ---
  const handleSaveChanges = () => {
    if (hasChanges && currentFlowId) {
      updateStepsMutation(steps);
    }
  };

  const handleResetChanges = useCallback(() => {
    setSteps(originalSteps);
    setHasChanges(false);
  }, [originalSteps]);

  // --- Render Logic --- 

  // Memoize filtered modules for dropdown to avoid re-renders
  const availableModules = useMemo(() => {
     // Can add filtering here if needed (e.g., only show modules that *can* have flows)
     return modules;
  }, [modules]);

  // Determine combined loading/error states
  const isLoading = isLoadingModules || (selectedModuleId && isFetchingFlows);
  const hasLoadingError = isErrorLoadingModules || isErrorLoadingFlows;
  const loadingError = moduleLoadingError || flowLoadingError;
  const hasUpdateError = isErrorUpdatingSteps;
  const updateError = updatingStepsError;

  return (
    <Box>
      <Grid container spacing={2} sx={{ mb: 3, alignItems: 'center' }}>
        <Grid item>
           <Typography variant="h4">Message Flow Steps</Typography>
        </Grid>
        <Grid item xs>
          <FormControl fullWidth disabled={isLoadingModules || isUpdatingSteps}>
            <InputLabel id="module-select-label">Select Module</InputLabel>
            <Select
              labelId="module-select-label"
              value={selectedModuleId}
              onChange={handleModuleChange}
              label="Select Module"
            >
              {isLoadingModules && <MenuItem disabled><em>Loading modules...</em></MenuItem>}
              {!isLoadingModules && availableModules.length === 0 && <MenuItem disabled><em>No modules found</em></MenuItem>}
              {availableModules.map((moduleEntry) => (
                 // Use module_id for key/value
                <MenuItem key={moduleEntry.module_id} value={moduleEntry.module_id}>
                  {/* Access nested module name */}
                  {moduleEntry.module.name || `Module ${moduleEntry.module_id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item>
           {/* --- NEW: Save/Reset Buttons --- */}
           <Button
             variant="outlined"
             onClick={handleResetChanges}
             disabled={!hasChanges || isUpdatingSteps || isLoadingFlows}
             startIcon={<CancelIcon />}
             sx={{ mr: 1 }} // Add margin
           >
            Reset Changes
          </Button>
           <Button
             variant="contained"
             color="primary"
             onClick={handleSaveChanges}
             disabled={!hasChanges || isUpdatingSteps || isLoadingFlows}
             startIcon={<SaveIcon />}
           >
            {isUpdatingSteps ? 'Saving...' : 'Save Changes'}
          </Button>
         </Grid>
        <Grid item>
          <Button
             variant="contained"
             color="primary"
             startIcon={<AddIcon />}
             onClick={handleAddStep}
             disabled={!currentFlowId || isLoading || isUpdatingSteps}
           >
            Add Message Step
          </Button>
        </Grid>
      </Grid>

      {/* --- Alerts --- */} 
      {hasLoadingError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {`Failed to load data: ${loadingError?.message || 'Unknown error'}`}
        </Alert>
      )}
      {hasUpdateError && (
         <Alert severity="error" sx={{ mb: 2 }}>
           {`Failed to update steps: ${updateError?.message || 'Unknown error'}`}
         </Alert>
       )}
      {!hasLoadingError && !hasUpdateError && isUpdatingSteps && (
          <Alert severity="info" sx={{ mb: 2 }}>Saving changes...</Alert>
       )}
      {selectedModuleId && !isLoadingFlows && !currentFlowId && !hasLoadingError && (
         <Alert severity="warning" sx={{ mb: 2 }}>
           No message flow found or configured for the selected module.
         </Alert>
      )}
      {currentFlowId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Editing steps for flow: {messageFlows.find(f => f.id === currentFlowId)?.name || currentFlowId.substring(0,8)}
        </Alert>
      )}

      {/* --- Steps List --- */} 
      <Paper sx={{ opacity: isUpdatingSteps ? 0.7 : 1 }}>
         {/* Show skeletons while loading flows for a selected module */} 
         {isLoadingFlows && selectedModuleId && (
           <Box sx={{ p: 2 }}>
             {[1, 2, 3].map(i => <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1 }} />)}
           </Box>
         )}

         {/* Show steps list only if not loading flows and a flow is selected */} 
         {!isLoadingFlows && currentFlowId && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="steps">
                {(provided) => (
                  <List {...provided.droppableProps} ref={provided.innerRef} sx={{ p: 2 }}>
                    {steps.length === 0 && !isLoading && !hasLoadingError && (
                      <ListItem>
                        <ListItemText primary="No steps defined for this flow yet. Click 'Add Message Step' to begin." />
                      </ListItem>
                    )}
                    {steps.map((step, index) => (
                      <Draggable key={step.id} draggableId={step.id} index={index}>
                        {(provided, snapshot) => (
                          <ListItem
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            sx={{
                              border: '1px solid',
                              borderColor: 'divider',
                              mb: 1,
                              borderRadius: 1,
                              bgcolor: snapshot.isDragging ? 'action.hover' : 'background.paper',
                              userSelect: 'none',
                            }}
                            component={Paper}
                            elevation={snapshot.isDragging ? 3 : 1}
                          >
                            <Box {...provided.dragHandleProps} sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                              <DragIcon />
                            </Box>
                            <ListItemText
                               primary={`${index + 1}. ${step.message_content}`}
                            />
                            <ListItemSecondaryAction>
                              <IconButton
                                 onClick={() => handleMoveStep(step.id, 'up')}
                                 disabled={index === 0 || isUpdatingSteps}
                                 aria-label="Move Up"
                              >
                                <ArrowUpIcon />
                              </IconButton>
                              <IconButton
                                 onClick={() => handleMoveStep(step.id, 'down')}
                                 disabled={index === steps.length - 1 || isUpdatingSteps}
                                 aria-label="Move Down"
                              >
                                <ArrowDownIcon />
                              </IconButton>
                               <IconButton 
                                 onClick={() => handleEditStep(step)} 
                                 disabled={isUpdatingSteps}
                                 aria-label="Edit Step"
                               >
                                 <EditIcon />
                               </IconButton>
                               <IconButton 
                                 onClick={() => handleDeleteStep(step.id)} 
                                 disabled={isUpdatingSteps}
                                 aria-label="Delete Step"
                               >
                                 <DeleteIcon />
                               </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </List>
                )}
              </Droppable>
            </DragDropContext>
         )}
       </Paper>

      {/* --- Edit/Add Dialog --- */} 
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStep ? 'Edit Message Step' : 'Add New Message Step'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Message Content"
            fullWidth
            multiline
            rows={4}
            value={newStepContent}
            onChange={(e) => setNewStepContent(e.target.value)}
            helperText="Enter the exact text message to be sent."
          />
          {/* Removed other fields like type, wait for response etc. */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={isUpdatingSteps}>Cancel</Button>
          <Button 
            onClick={handleSaveStep} 
            variant="contained" 
            color="primary"
            disabled={!newStepContent.trim() || isUpdatingSteps}
          >
            {isUpdatingSteps ? 'Saving...' : 'Save Step'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageFlow; 