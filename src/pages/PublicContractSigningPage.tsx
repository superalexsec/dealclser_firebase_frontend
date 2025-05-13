import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  fetchPublicContractDetails,
  signContract,
  PublicContractDetails,
  ContractSigningPayload,
  DeviceInfo,
  ContractStatus,
} from '../lib/api';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Paper,
  Container,
  Snackbar,
} from '@mui/material';

const PublicContractSigningPage: React.FC = () => {
  const { contractDbId } = useParams<{ contractDbId: string }>();
  const [isSnackbarOpen, setIsSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Fetch public contract details
  const {
    data: contractDetails,
    isLoading,
    error,
    isError,
  } = useQuery<PublicContractDetails, Error>({
    queryKey: ['publicContract', contractDbId],
    queryFn: () => fetchPublicContractDetails(contractDbId!),
    enabled: !!contractDbId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: (failureCount, err: any) => {
        // Do not retry on 404 or if contract is already signed
        if (err.message === 'Mock contract not found' || (contractDetails && contractDetails.status === ContractStatus.SIGNED)) {
            return false;
        }
        return failureCount < 2;
    },
  });

  // Mutation for signing the contract
  const signingMutation = useMutation({
    mutationFn: (payload: ContractSigningPayload) => signContract(contractDbId!, payload),
    onSuccess: (data) => {
      setSnackbarMessage(data.message || 'Contract signed successfully!');
      setIsSnackbarOpen(true);
      // Potentially refetch contract details to show updated status, or redirect
    },
    onError: (err: any) => {
      setSnackbarMessage(`Error signing contract: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
      setIsSnackbarOpen(true);
    },
  });

  const handleSignContract = () => {
    if (!contractDetails) {
      setSnackbarMessage('Contract details not loaded.');
      setIsSnackbarOpen(true);
      return;
    }
    if (contractDetails.status === ContractStatus.SIGNED) {
        setSnackbarMessage('This contract has already been signed.');
        setIsSnackbarOpen(true);
        return;
    }

    const deviceInfo: DeviceInfo = {
      user_agent: navigator.userAgent,
      // IP address would ideally be captured by the backend.
      // We can add more client-side info if needed, e.g., screen resolution.
    };

    const payload: ContractSigningPayload = {
      client_id: contractDetails.client_id,
      client_phone_number: contractDetails.client_phone_number,
      device_info: deviceInfo,
    };
    signingMutation.mutate(payload);
  };

  const handleSnackbarClose = () => {
    setIsSnackbarOpen(false);
  };

  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      // Check if scrolled to near the bottom (e.g., within 10 pixels)
      if (scrollHeight - scrollTop <= clientHeight + 10) {
        setIsScrolledToEnd(true);
      }
    }
  };

  useEffect(() => {
    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
      // Initial check in case content is too short to scroll
      handleScroll();
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [contractDetails]); // Re-attach if content changes

  if (isLoading) {
    return <Container sx={{ textAlign: 'center', mt: 5 }}><CircularProgress size={60} /></Container>;
  }

  if (isError) {
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="error">
          Error loading contract: {error?.message || 'Unknown error'}. This link may be invalid or expired.
        </Alert>
      </Container>
    );
  }

  if (!contractDetails) {
    return (
      <Container sx={{ mt: 5 }}>
        <Alert severity="info">No contract details found.</Alert>
      </Container>
    );
  }

  const isAlreadySigned = contractDetails.status === ContractStatus.SIGNED;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: { xs: 2, md: 4 } }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
          Service Contract
        </Typography>

        {isAlreadySigned && (
          <Alert severity="success" sx={{ mb: 2 }}>
            This contract has already been signed on {contractDetails.signed_at ? new Date(contractDetails.signed_at).toLocaleString() : 'N/A'}.
          </Alert>
        )}

        <Box
          ref={contentRef}
          sx={{
            border: '1px solid #ccc',
            p: 2,
            mb: 3,
            maxHeight: '500px',
            overflowY: 'auto',
            backgroundColor: '#f9f9f9',
          }}
          dangerouslySetInnerHTML={{ __html: contractDetails.content || '<p>No content available.</p>' }}
        />

        {!isAlreadySigned && (
            <Typography variant="caption" display="block" gutterBottom sx={{textAlign: 'center', mb:1}}>
                Please scroll to the end of the contract to enable the signing button.
            </Typography>
        )}

        <Box sx={{ textAlign: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSignContract}
            disabled={signingMutation.isPending || isAlreadySigned || !isScrolledToEnd}
          >
            {signingMutation.isPending ? 'Processing...' : (isAlreadySigned ? 'Already Signed' : 'Li e Aceito os Termos')}
          </Button>
        </Box>

        <Snackbar
          open={isSnackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Paper>
    </Container>
  );
};

export default PublicContractSigningPage; 