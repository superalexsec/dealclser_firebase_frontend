import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchContractTemplate, createContractTemplate, updateExistingContractTemplate, ContractTemplateRead } from '../lib/api';
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
  Grid,
} from '@mui/material';

const ContractTemplatePage: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [templateContent, setTemplateContent] = useState('');
  const [templateName, setTemplateName] = useState('Contract Template');
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [templateId, setTemplateId] = useState<string | null>(null);

  // Fetch the contract template
  const { data: templateData, isLoading, error, isError } = useQuery<ContractTemplateRead, Error>({
    queryKey: ['contractTemplate', token],
    queryFn: () => fetchContractTemplate(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, err: any) => {
      if (err.response && err.response.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
  });

  useEffect(() => {
    if (templateData) {
      if (templateData.id) {
        setTemplateContent(templateData.content);
        setTemplateName(templateData.name || 'Contract Template');
        setTemplateId(templateData.id);
      } else {
        setTemplateContent('<p>Enter your contract HTML here.</p>');
        setTemplateName('My Contract Template');
        setTemplateId(null);
      }
    }
  }, [templateData]);

  // Mutation for creating or updating the contract template
  const mutation = useMutation({
    mutationFn: (newContent: string) => {
      const payload = { content: newContent, name: templateName };
      if (templateId) {
        return updateExistingContractTemplate(payload, token);
      } else {
        return createContractTemplate(payload, token);
      }
    },
    onSuccess: (updatedOrCreatedTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['contractTemplate'] });
      setTemplateContent(updatedOrCreatedTemplate.content);
      setTemplateName(updatedOrCreatedTemplate.name);
      setTemplateId(updatedOrCreatedTemplate.id);
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

  if (isLoading) return <CircularProgress />;
  
  if (isError && templateData?.id === undefined) {
    if (!error?.message?.includes('No contract template found')) {
       return <Alert severity="error">Error loading template: {error?.message || 'Unknown error'}</Alert>;
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Contract Template Editor
      </Typography>
      
      {!templateId && !isLoading && (
          <Alert severity="info" sx={{mb:2}}>No template found. Saving will create a new one.</Alert>
      )}

      <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
        <TextField
          label="Template Name"
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          disabled={mutation.isPending}
        />
        <TextField
          label="Template HTML Content"
          multiline
          rows={20}
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
          disabled={mutation.isPending}
          sx={{ mt: 2 }}
        >
          {mutation.isPending ? 'Saving...' : (templateId ? 'Update Template' : 'Create Template')}
        </Button>
      </Box>

      {/* HTML Preview Area */}
      {templateContent && (
        <Grid item xs={12} sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Live Preview
          </Typography>
          <Paper elevation={2} sx={{ p: 2, border: '1px dashed #ccc', minHeight: '150px' }}>
            <div dangerouslySetInnerHTML={{ __html: templateContent }} />
          </Paper>
        </Grid>
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