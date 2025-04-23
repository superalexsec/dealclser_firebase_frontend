import React, { useState } from 'react';
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
  Divider,
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Module {
  id: string;
  name: string;
  description: string;
  order: number;
  isActive: boolean;
}

const ModuleFlow = () => {
  const [modules, setModules] = useState<Module[]>([
    {
      id: '1',
      name: 'Welcome Messages',
      description: 'Initial greeting and introduction messages',
      order: 1,
      isActive: true,
    },
    {
      id: '2',
      name: 'Client Verification',
      description: 'CPF/CNPJ verification and client data collection',
      order: 2,
      isActive: true,
    },
    {
      id: '3',
      name: 'Thank You Messages',
      description: 'Final messages and follow-up',
      order: 3,
      isActive: true,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [newModule, setNewModule] = useState<Partial<Module>>({
    name: '',
    description: '',
    order: modules.length + 1,
    isActive: true,
  });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(modules);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index + 1,
    }));

    setModules(updatedItems);
  };

  const handleAddModule = () => {
    setEditingModule(null);
    setNewModule({
      name: '',
      description: '',
      order: modules.length + 1,
      isActive: true,
    });
    setOpenDialog(true);
  };

  const handleEditModule = (module: Module) => {
    setEditingModule(module);
    setNewModule(module);
    setOpenDialog(true);
  };

  const handleSaveModule = () => {
    if (editingModule) {
      setModules(modules.map(m => 
        m.id === editingModule.id ? { ...newModule, id: m.id } as Module : m
      ));
    } else {
      setModules([...modules, { ...newModule, id: Date.now().toString() } as Module]);
    }
    setOpenDialog(false);
  };

  const handleDeleteModule = (id: string) => {
    setModules(modules.filter(m => m.id !== id));
  };

  const handleMoveModule = (id: string, direction: 'up' | 'down') => {
    const index = modules.findIndex(m => m.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === modules.length - 1)
    ) {
      return;
    }

    const newModules = [...modules];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newModules[index], newModules[newIndex]] = [newModules[newIndex], newModules[index]];

    // Update order numbers
    const updatedModules = newModules.map((module, i) => ({
      ...module,
      order: i + 1,
    }));

    setModules(updatedModules);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Module Flow</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddModule}
        >
          Add Module
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Drag and drop modules to reorder them. The order determines the sequence of messages sent to clients.
      </Alert>

      <Paper>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="modules">
            {(provided) => (
              <List {...provided.droppableProps} ref={provided.innerRef}>
                {modules.map((module, index) => (
                  <Draggable key={module.id} draggableId={module.id} index={index}>
                    {(provided) => (
                      <ListItem
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          mb: 1,
                          borderRadius: 1,
                        }}
                      >
                        <Box {...provided.dragHandleProps} sx={{ mr: 2 }}>
                          <DragIcon />
                        </Box>
                        <ListItemText
                          primary={module.name}
                          secondary={module.description}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            onClick={() => handleMoveModule(module.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUpIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleMoveModule(module.id, 'down')}
                            disabled={index === modules.length - 1}
                          >
                            <ArrowDownIcon />
                          </IconButton>
                          <IconButton onClick={() => handleEditModule(module)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteModule(module.id)}>
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
      </Paper>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingModule ? 'Edit Module' : 'Add New Module'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Module Name"
            fullWidth
            value={newModule.name}
            onChange={(e) => setNewModule({ ...newModule, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newModule.description}
            onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveModule} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ModuleFlow; 