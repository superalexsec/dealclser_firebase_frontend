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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Chip,
  SelectChangeEvent,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface Message {
  id: string;
  moduleId: string;
  content: string;
  type: 'text' | 'image' | 'document' | 'template';
  order: number;
  isActive: boolean;
  waitForResponse: boolean;
  responseTimeout?: number;
}

interface Module {
  id: string;
  name: string;
}

const MessageFlow = () => {
  const [modules] = useState<Module[]>([
    { id: '1', name: 'Welcome Messages' },
    { id: '2', name: 'Client Verification' },
    { id: '3', name: 'Thank You Messages' },
  ]);

  const [selectedModule, setSelectedModule] = useState<string>(modules[0].id);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      moduleId: '1',
      content: 'Welcome to our service! How can we help you today?',
      type: 'text',
      order: 1,
      isActive: true,
      waitForResponse: true,
      responseTimeout: 300,
    },
    {
      id: '2',
      moduleId: '1',
      content: 'Please provide your CPF or CNPJ for verification.',
      type: 'text',
      order: 2,
      isActive: true,
      waitForResponse: true,
      responseTimeout: 300,
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [newMessage, setNewMessage] = useState<Partial<Message>>({
    moduleId: selectedModule,
    content: '',
    type: 'text',
    order: messages.filter(m => m.moduleId === selectedModule).length + 1,
    isActive: true,
    waitForResponse: true,
    responseTimeout: 300,
  });

  const handleModuleChange = (event: SelectChangeEvent) => {
    setSelectedModule(event.target.value);
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const moduleMessages = messages.filter(m => m.moduleId === selectedModule);
    const [reorderedItem] = moduleMessages.splice(result.source.index, 1);
    moduleMessages.splice(result.destination.index, 0, reorderedItem);

    // Update order numbers
    const updatedMessages = moduleMessages.map((message, index) => ({
      ...message,
      order: index + 1,
    }));

    setMessages([
      ...messages.filter(m => m.moduleId !== selectedModule),
      ...updatedMessages,
    ]);
  };

  const handleAddMessage = () => {
    setEditingMessage(null);
    setNewMessage({
      moduleId: selectedModule,
      content: '',
      type: 'text',
      order: messages.filter(m => m.moduleId === selectedModule).length + 1,
      isActive: true,
      waitForResponse: true,
      responseTimeout: 300,
    });
    setOpenDialog(true);
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setNewMessage(message);
    setOpenDialog(true);
  };

  const handleSaveMessage = () => {
    if (editingMessage) {
      setMessages(messages.map(m => 
        m.id === editingMessage.id ? { ...newMessage, id: m.id } as Message : m
      ));
    } else {
      setMessages([...messages, { ...newMessage, id: Date.now().toString() } as Message]);
    }
    setOpenDialog(false);
  };

  const handleDeleteMessage = (id: string) => {
    setMessages(messages.filter(m => m.id !== id));
  };

  const handleMoveMessage = (id: string, direction: 'up' | 'down') => {
    const moduleMessages = messages.filter(m => m.moduleId === selectedModule);
    const index = moduleMessages.findIndex(m => m.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === moduleMessages.length - 1)
    ) {
      return;
    }

    const newMessages = [...moduleMessages];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    [newMessages[index], newMessages[newIndex]] = [newMessages[newIndex], newMessages[index]];

    // Update order numbers
    const updatedMessages = newMessages.map((message, i) => ({
      ...message,
      order: i + 1,
    }));

    setMessages([
      ...messages.filter(m => m.moduleId !== selectedModule),
      ...updatedMessages,
    ]);
  };

  const filteredMessages = messages.filter(m => m.moduleId === selectedModule);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Message Flow</Typography>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Select Module</InputLabel>
          <Select
            value={selectedModule}
            onChange={handleModuleChange}
            label="Select Module"
          >
            {modules.map((module) => (
              <MenuItem key={module.id} value={module.id}>
                {module.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Drag and drop messages to reorder them within the selected module. The order determines the sequence of messages sent to clients.
      </Alert>

      <Paper>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleAddMessage}
          >
            Add Message
          </Button>
        </Box>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="messages">
            {(provided) => (
              <List {...provided.droppableProps} ref={provided.innerRef}>
                {filteredMessages.map((message, index) => (
                  <Draggable key={message.id} draggableId={message.id} index={index}>
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
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body1">{message.content}</Typography>
                              <Chip
                                label={message.type}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                              {message.waitForResponse && (
                                <Chip
                                  label="Waits for response"
                                  size="small"
                                  color="secondary"
                                  variant="outlined"
                                />
                              )}
                            </Box>
                          }
                          secondary={`Order: ${message.order}`}
                        />
                        <ListItemSecondaryAction>
                          <IconButton
                            onClick={() => handleMoveMessage(message.id, 'up')}
                            disabled={index === 0}
                          >
                            <ArrowUpIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleMoveMessage(message.id, 'down')}
                            disabled={index === filteredMessages.length - 1}
                          >
                            <ArrowDownIcon />
                          </IconButton>
                          <IconButton onClick={() => handleEditMessage(message)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteMessage(message.id)}>
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
          {editingMessage ? 'Edit Message' : 'Add New Message'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message Content"
                multiline
                rows={3}
                value={newMessage.content}
                onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Message Type</InputLabel>
                <Select
                  value={newMessage.type}
                  onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value as Message['type'] })}
                  label="Message Type"
                >
                  <MenuItem value="text">Text</MenuItem>
                  <MenuItem value="image">Image</MenuItem>
                  <MenuItem value="document">Document</MenuItem>
                  <MenuItem value="template">Template</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Response Timeout (seconds)"
                type="number"
                value={newMessage.responseTimeout}
                onChange={(e) => setNewMessage({ ...newMessage, responseTimeout: parseInt(e.target.value) })}
                disabled={!newMessage.waitForResponse}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveMessage} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageFlow; 