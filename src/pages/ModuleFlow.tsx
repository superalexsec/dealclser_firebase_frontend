import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  CircularProgress,
  Button,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  Visibility as VisibilityOnIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  BackendModuleOrderEntry,
  ModuleOrderResponse,
  UpdateModuleOrderPayload,
  ModuleUI,
  fetchModuleOrder,
  updateModuleOrder,
} from '../lib/api';
import { useTranslation } from 'react-i18next';

const ModuleFlow = () => {
  const queryClient = useQueryClient();
  const { token } = useAuth(); // Get token from context
  const { t } = useTranslation();
  const backendUrl = window.runtimeConfig?.backendUrl;

  // Local state for the modules being ordered/toggled by the user
  const [displayModules, setDisplayModules] = useState<ModuleUI[]>([]);
  // State to track if local changes differ from fetched data
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch ALL module order entries (active and inactive)
  const {
    data: fetchedEntries = [], // Contains the full list as returned by API
    isLoading: isLoadingModules,
    isError: isErrorLoading,
    error: loadingError,
  } = useQuery<ModuleOrderResponse, Error, BackendModuleOrderEntry[]>({ // Fetch original type
    queryKey: ['moduleOrder', token],
    queryFn: () => token ? fetchModuleOrder(token) : Promise.reject(new Error('Not authenticated')), 
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000, 
  });

  // Effect to initialize/reset local display state when fetched data changes
  useEffect(() => {
    // console.log("Fetched Modules Data:", JSON.stringify(fetchedEntries, null, 2)); // Keep for debug if needed
    // Map ALL fetched entries to the UI state, initializing ui_is_active from fetched is_active
    const initialModules = fetchedEntries.map(entry => ({ ...entry, ui_is_active: entry.is_active }));
    setDisplayModules(initialModules);
    setHasChanges(false); // Reset changes on new fetch
  }, [fetchedEntries]);

  // Memoized calculation of original state string for comparison
  const originalStateString = useMemo(() => {
      const originalOrder = fetchedEntries.map(entry => entry.module_id); // Use module_id for order
      const originalActives = fetchedEntries.map(entry => entry.is_active); // Use actual is_active
      return JSON.stringify({ order: originalOrder, actives: originalActives });
  }, [fetchedEntries]);

  // Effect to check if local display state differs from original fetched state
  useEffect(() => {
      const currentOrder = displayModules.map(mod => mod.module_id);
      const currentActives = displayModules.map(mod => mod.ui_is_active);
      const currentStateString = JSON.stringify({ order: currentOrder, actives: currentActives });
      // Only set changes if not currently loading (prevents flicker on initial load)
      if (!isLoadingModules) { 
        setHasChanges(currentStateString !== originalStateString);
      }
  }, [displayModules, originalStateString, isLoadingModules]);

  // Update module order mutation
  const {
    mutate: updateOrderMutation,
    isPending: isUpdatingOrder,
    isError: isErrorUpdating,
    error: updatingError,
  } = useMutation<void, Error, ModuleUI[]>({ // Input is the full local list
    mutationFn: async (currentLocalModules: ModuleUI[]) => {
      if (!token) throw new Error('Not authenticated');
      const payload: UpdateModuleOrderPayload = {
        modules: currentLocalModules.map(mod => ({
          module_id: mod.module_id,
          is_active: mod.ui_is_active,
        })),
      };
      await updateModuleOrder(payload, token);
    },
    onSuccess: (data, currentLocalModules) => {
      queryClient.invalidateQueries({ queryKey: ['moduleOrder', token] });
      console.log('Module order updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update module order:', error);
      // Optionally show error notification
    },
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || result.destination.index === result.source.index) {
      return;
    }
    const items = Array.from(displayModules); // Use local display state
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setDisplayModules(items); // Update local state only
  };

  const handleMoveModule = (id: string, direction: 'up' | 'down') => {
    // Use the ID of the ModuleOrderEntry (tenant_module_order record)
    const index = displayModules.findIndex(m => m.id === id); 
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === displayModules.length - 1)
    ) {
      return;
    }
    const newModules = [...displayModules]; // Use local display state
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newModules[index], newModules[targetIndex]] = [newModules[targetIndex], newModules[index]];
    setDisplayModules(newModules); // Update local state only
  };

  // Save button triggers mutation with the current local display state
  const handleSaveChanges = () => {
    if (hasChanges) {
      updateOrderMutation(displayModules);
    }
  };

  // Reset button reverts local state to match the last fetched data
  const handleResetChanges = useCallback(() => {
    const initialModules = fetchedEntries.map(entry => ({ ...entry, ui_is_active: entry.is_active }));
    setDisplayModules(initialModules);
    setHasChanges(false);
  }, [fetchedEntries]);

  // Toggle the local UI active state for a module entry
  const handleToggleActive = (moduleOrderEntryId: string) => {
    setDisplayModules(currentModules => 
       currentModules.map(mod => 
         // Use the ID of the ModuleOrderEntry (tenant_module_order record)
         mod.id === moduleOrderEntryId ? { ...mod, ui_is_active: !mod.ui_is_active } : mod
       )
    );
  };

  // --- Render Logic ---

  if (isLoadingModules) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{t('common.loading')}</Typography>
      </Box>
    );
  }

  // Combine loading and updating errors for display
  const apiError = loadingError || updatingError;
  const hasApiError = isErrorLoading || isErrorUpdating;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{t('module_flow.title')}</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            onClick={handleResetChanges}
            disabled={!hasChanges || isUpdatingOrder}
          >
            {t('common.reset_order')}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveChanges}
            disabled={!hasChanges || isUpdatingOrder}
          >
            {isUpdatingOrder ? t('common.saving') : t('module_flow.save_changes')}
          </Button>
        </Stack>
      </Box>

      {hasApiError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {`${t('common.api_error')}: ${apiError instanceof Error ? apiError.message : t('common.unknown_error')}`}
        </Alert>
      )}

      {!hasApiError && isUpdatingOrder && (
         <Alert severity="info" sx={{ mb: 3 }}>{t('module_flow.updating')}</Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        {t('module_flow.instructions')}
      </Alert>

      <Paper sx={{ opacity: isUpdatingOrder ? 0.7 : 1 }}>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="modules">
            {(provided) => (
              <List {...provided.droppableProps} ref={provided.innerRef} sx={{ p: 2 }}>
                {displayModules.length === 0 && !isLoadingModules && !hasApiError && (
                  <ListItem>
                    <ListItemText primary={t('module_flow.no_modules')} />
                  </ListItem>
                )}
                {displayModules.map((moduleEntry, index) => {
                  return (
                    <Draggable key={moduleEntry.id} draggableId={moduleEntry.id} index={index}>
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
                            opacity: moduleEntry.ui_is_active ? 1 : 0.5,
                          }}
                          component={Paper}
                          elevation={snapshot.isDragging ? 3 : 1}
                        >
                          <Box {...provided.dragHandleProps} sx={{ mr: 2, display: 'flex', alignItems: 'center' }}>
                            <DragIcon />
                          </Box>
                          <ListItemText
                            primary={`${index + 1}. ${moduleEntry.module.name || `Module ${moduleEntry.module_id.substring(0, 8)}...`}`}
                            secondary={moduleEntry.module.description || 'No description available.'}
                            primaryTypographyProps={{ 
                              style: { textDecoration: moduleEntry.ui_is_active ? 'none' : 'line-through' } 
                            }}
                            secondaryTypographyProps={{
                              style: { textDecoration: moduleEntry.ui_is_active ? 'none' : 'line-through' } 
                            }}
                          />
                          <ListItemSecondaryAction sx={{ display: 'flex', alignItems: 'center' }}>
                            <Tooltip title={moduleEntry.ui_is_active ? t('module_flow.mark_inactive') : t('module_flow.mark_active')}>
                              <IconButton
                                onClick={() => handleToggleActive(moduleEntry.id)}
                                disabled={isUpdatingOrder}
                                color={moduleEntry.ui_is_active ? 'primary' : 'default'}
                              >
                                {moduleEntry.ui_is_active ? <VisibilityOnIcon /> : <VisibilityOffIcon />}
                              </IconButton>
                            </Tooltip>
                            <IconButton
                              onClick={() => handleMoveModule(moduleEntry.id, 'up')}
                              disabled={index === 0 || isUpdatingOrder}
                              aria-label={t('module_flow.move_up')}
                            >
                              <ArrowUpIcon />
                            </IconButton>
                            <IconButton
                              onClick={() => handleMoveModule(moduleEntry.id, 'down')}
                              disabled={index === displayModules.length - 1 || isUpdatingOrder}
                              aria-label={t('module_flow.move_down')}
                            >
                              <ArrowDownIcon />
                            </IconButton>
                          </ListItemSecondaryAction>
                        </ListItem>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </List>
            )}
          </Droppable>
        </DragDropContext>
      </Paper>
    </Box>
  );
};

export default ModuleFlow;
