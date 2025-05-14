import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchClientContracts, ClientContractListItem, ContractStatus, fetchPublicContractDetails } from '../lib/api'; // Import necessary types and fetchPublicContractDetails
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip, // For displaying status
  Button, // For View PDF button
  Link as MuiLink, // For opening link in new tab
} from '@mui/material';

const ClientContractsPage: React.FC = () => {
  const { token } = useAuth();

  // Fetch the list of client contracts
  const { data: contracts, isLoading, error, isError, refetch: refetchContracts } = useQuery<ClientContractListItem[], Error>({
    queryKey: ['clientContracts', token],
    queryFn: () => fetchClientContracts(token),
    enabled: !!token, // Only run query if token is available
    staleTime: 60 * 1000, // Cache for 1 minute
  });

  // Mutation to fetch individual public contract details (for PDF link)
  const { mutate: getViewablePdfLink, isPending: isFetchingPdfLink } = useMutation<string, Error, string>({
    mutationFn: async (contractDbId: string) => {
        const details = await fetchPublicContractDetails(contractDbId); // No token needed for this public endpoint
        if (!details.pdf_download_url) {
            throw new Error('PDF download URL not found in contract details.');
        }
        return details.pdf_download_url;
    },
    onSuccess: (pdfUrl: string) => {
        window.open(pdfUrl, '_blank');
    },
    onError: (err: Error, contractDbId: string) => {
        console.error(`Error fetching PDF link for contract ${contractDbId}:`, err);
        // Optionally show a snackbar or alert to the user
        alert(`Could not retrieve PDF link: ${err.message}`);
    },
  });

  const handleViewPdf = (contractDbId: string) => {
    getViewablePdfLink(contractDbId);
  };

  const getStatusChip = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.SIGNED:
        return <Chip label="Signed" color="success" size="small" />;
      case ContractStatus.AWAITING_SIGNATURE:
        return <Chip label="Awaiting Signature" color="warning" size="small" />;
      case ContractStatus.GENERATED:
          return <Chip label="Generated" color="info" size="small" />;
       case ContractStatus.ERROR:
          return <Chip label="Error" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Client Contracts Status
      </Typography>

      {/* Display loading indicator */}
      {isLoading && <CircularProgress />}

      {/* Display error message if the query fails */}
      {isError && <Alert severity="error">Error loading contracts: {error?.message || 'Unknown error'}. (Note: Backend endpoint may not be available yet)</Alert>}

      {/* Display the table if data is successfully loaded */}
      {!isLoading && !isError && contracts && (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table sx={{ minWidth: 650 }} aria-label="client contracts table">
            <TableHead>
              <TableRow>
                <TableCell>Client Name</TableCell>
                <TableCell>Client Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Generated At</TableCell>
                <TableCell>Signed At</TableCell>
                <TableCell align="right">Actions</TableCell> {/* New column for View PDF button */}
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">No contracts found. (Or backend endpoint is pending)</TableCell>
                </TableRow>
              )}
              {contracts.map((contract) => (
                <TableRow
                  key={contract.contract_db_id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {contract.client_name}
                  </TableCell>
                   <TableCell>{contract.client_phone_number || 'N/A'}</TableCell>
                  <TableCell>{getStatusChip(contract.status)}</TableCell>
                  <TableCell>{new Date(contract.generated_at).toLocaleString()}</TableCell>
                  <TableCell>{contract.signed_at ? new Date(contract.signed_at).toLocaleString() : '-'}</TableCell>
                  <TableCell align="right">
                    <Button 
                        variant="outlined" 
                        size="small"
                        onClick={() => handleViewPdf(contract.contract_db_id)}
                        disabled={isFetchingPdfLink}
                    >
                        View PDF
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
};

export default ClientContractsPage; 