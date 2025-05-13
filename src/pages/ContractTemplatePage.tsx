import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchContractTemplate, updateContractTemplate } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Snackbar,
} from '@mui/material';

const ContractTemplatePage: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [templateContent, setTemplateContent] = useState('');
  const [templateName, setTemplateName] = useState('Contract Template'); // Default or fetched name
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Fetch the contract template
  const { data: templateData, isLoading, error, isError, refetch } = useQuery({
    queryKey: ['contractTemplate', token],
    queryFn: () => fetchContractTemplate(token),
    enabled: !!token, // Only run query if token is available
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update local state when template data is fetched
  useEffect(() => {
    if (templateData) {
      setTemplateContent(templateData.content);
      setTemplateName(templateData.name || 'Contract Template');
    }
  }, [templateData]);

  // Mutation to update the contract template
  const mutation = useMutation({
    mutationFn: (newContent: string) => {
      return updateContractTemplate({ content: newContent, name: templateName }, token); // Include name if needed
    },
    onSuccess: (updatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['contractTemplate'] }); // Invalidate cache
      // Optionally update local state directly too
      setTemplateContent(updatedTemplate.content);
      setTemplateName(updatedTemplate.name);
      setSnackbarMessage('Template saved successfully!');
      setIsSnackbarOpen(true);
    },
    onError: (err: any) => {
      console.error('Error saving template:', err);
      setSnackbarMessage(`Error saving template: ${err.message || 'Unknown error'}`);
      setIsSnackbarOpen(true);
    },
  });

  const handleSave = () => {
    if (templateContent) {
      mutation.mutate(templateContent);
    } else {
      setSnackbarMessage('Cannot save empty template.');
      setIsSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setIsSnackbarOpen(false);
  };


  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Contract Template Editor
      </Typography>

      {isLoading && <CircularProgress />}
      {isError && <Alert severity="error">Error loading template: {error?.message || 'Unknown error'}</Alert>}

      {templateData && (
        <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
           {/* Optional: Allow editing name if needed */}
          {/* <TextField
            label="Template Name"
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            fullWidth
            sx={{ mb: 2 }}
            disabled={mutation.isPending}
          /> */}
          <TextField
            label="Template HTML Content"
            multiline
            rows={20} // Adjust rows as needed
            value={templateContent}
            onChange={(e) => setTemplateContent(e.target.value)}
            fullWidth
            variant="outlined"
            disabled={mutation.isPending}
            helperText="Edit the HTML content for your contract template."
          />
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={mutation.isPending || isLoading}
            sx={{ mt: 2 }}
          >
            {mutation.isPending ? 'Saving...' : 'Save Template'}
          </Button>
        </Box>
      )}

      <Snackbar
          open={isSnackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Paper>
  );
};

export default ContractTemplatePage; 