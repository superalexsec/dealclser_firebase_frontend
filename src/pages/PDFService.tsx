import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Description as DescriptionIcon } from '@mui/icons-material';

interface Document {
  id: string;
  title: string;
  type: 'contract' | 'agreement' | 'proposal';
  clientId: string;
  status: 'draft' | 'review' | 'approved' | 'signed';
  lastModified: string;
}

const PDFService: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      title: 'Service Agreement',
      type: 'contract',
      clientId: '1',
      status: 'draft',
      lastModified: '2024-03-20',
    },
  ]);

  const [openDialog, setOpenDialog] = useState(false);
  const [newDocument, setNewDocument] = useState<Partial<Document>>({
    title: '',
    type: 'contract',
    clientId: '',
    status: 'draft',
    lastModified: new Date().toISOString().split('T')[0],
  });

  const handleAddDocument = () => {
    setNewDocument({
      title: '',
      type: 'contract',
      clientId: '',
      status: 'draft',
      lastModified: new Date().toISOString().split('T')[0],
    });
    setOpenDialog(true);
  };

  const handleSaveDocument = () => {
    const newId = (documents.length + 1).toString();
    setDocuments([...documents, { ...newDocument, id: newId } as Document]);
    setOpenDialog(false);
  };

  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'draft':
        return 'default';
      case 'review':
        return 'warning';
      case 'approved':
        return 'info';
      case 'signed':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">PDF Service</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddDocument}
        >
          New Document
        </Button>
      </Box>

      <Grid container spacing={3}>
        {documents.map((document) => (
          <Grid item xs={12} md={6} lg={4} key={document.id}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">{document.title}</Typography>
                </Box>
                <Typography variant="body1">
                  Type: {document.type}
                </Typography>
                <Typography variant="body1">
                  Client ID: {document.clientId}
                </Typography>
                <Box display="flex" alignItems="center" mt={1}>
                  <Typography variant="body2" sx={{ mr: 1 }}>
                    Status:
                  </Typography>
                  <Chip
                    label={document.status}
                    color={getStatusColor(document.status)}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" mt={1}>
                  Last Modified: {document.lastModified}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>New Document</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Title"
            fullWidth
            value={newDocument.title}
            onChange={(e) => setNewDocument({ ...newDocument, title: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              value={newDocument.type}
              label="Type"
              onChange={(e) => setNewDocument({ ...newDocument, type: e.target.value as Document['type'] })}
            >
              <MenuItem value="contract">Contract</MenuItem>
              <MenuItem value="agreement">Agreement</MenuItem>
              <MenuItem value="proposal">Proposal</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Client ID"
            fullWidth
            value={newDocument.clientId}
            onChange={(e) => setNewDocument({ ...newDocument, clientId: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveDocument} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PDFService; 