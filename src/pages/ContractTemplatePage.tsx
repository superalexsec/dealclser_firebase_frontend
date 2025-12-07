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
import { useTranslation } from 'react-i18next';

const ContractTemplatePage: React.FC = () => {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const [templateContent, setTemplateContent] = useState('');
  const [templateName, setTemplateName] = useState(t('templates.default_name'));
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
        setTemplateName(templateData.name || t('templates.default_name'));
        setTemplateId(templateData.id);
      } else {
        setTemplateContent(t('templates.default_content'));
        setTemplateName(t('templates.default_name'));
        setTemplateId(null);
      }
    }
  }, [templateData, t]);

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
      setSnackbarMessage(t('templates.success_save'));
      setIsSnackbarOpen(true);
    },
    onError: (err: any) => {
      console.error('Error saving template:', err);
      setSnackbarMessage(`${t('templates.error_save')}: ${err.message || t('common.unknown_error')}`);
      setIsSnackbarOpen(true);
    },
  });

  const handleSave = () => {
    if (templateContent) {
      mutation.mutate(templateContent);
    } else {
      setSnackbarMessage(t('templates.empty_save'));
      setIsSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setIsSnackbarOpen(false);
  };

  if (isLoading) return <CircularProgress />;
  
  if (isError && templateData?.id === undefined) {
    if (!error?.message?.includes('No contract template found')) {
       return <Alert severity="error">{t('templates.error_load')}: {error?.message || t('common.unknown_error')}</Alert>;
    }
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {t('templates.title')}
      </Typography>
      
      {!templateId && !isLoading && (
          <Alert severity="info" sx={{mb:2}}>{t('templates.no_template')}</Alert>
      )}

      <Box component="form" noValidate autoComplete="off" sx={{ mt: 2 }}>
        <TextField
          label={t('templates.name_label')}
          value={templateName}
          onChange={(e) => setTemplateName(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
          disabled={mutation.isPending}
        />
        <TextField
          label={t('templates.content_label')}
          multiline
          rows={20}
          value={templateContent}
          onChange={(e) => setTemplateContent(e.target.value)}
          fullWidth
          variant="outlined"
          disabled={mutation.isPending}
          helperText={t('templates.content_helper')}
        />
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={mutation.isPending}
          sx={{ mt: 2 }}
        >
          {mutation.isPending ? t('common.saving') : (templateId ? t('templates.update_button') : t('templates.create_button'))}
        </Button>
      </Box>

      {/* HTML Preview Area */}
      {templateContent && (
        <Grid item xs={12} sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {t('templates.preview_title')}
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
