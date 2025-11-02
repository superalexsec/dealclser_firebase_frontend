import React, { useState, useEffect } from 'react';
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
  TablePagination,
  TextField,
  debounce,
} from '@mui/material';

const ClientContractsPage: React.FC = () => {
  const { token } = useAuth();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search term
  useEffect(() => {
    const handler = debounce(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(0); // Reset to first page on new search
    }, 500); // 500ms delay
    handler();
    return () => {
      // Cleanup function to cancel the debounce on unmount or searchTerm change
      // (implementation of cancel would depend on the debounce function used)
    };
  }, [searchTerm]);


  // Fetch the list of client contracts with pagination and search
  const { data: contracts, isLoading, error, isError } = useQuery<ClientContractListItem[], Error>({
    queryKey: ['clientContracts', token, page, rowsPerPage, debouncedSearchTerm],
    queryFn: () => fetchClientContracts(token, page * rowsPerPage, rowsPerPage, debouncedSearchTerm),
    enabled: !!token, // Only run query if token is available
  });

  // NOTE: We assume the backend might provide a total count in the future.
  // For now, we can't show a proper total count without another API call or a modified response.
  // The pagination will still work for next/previous, but the total number of pages might be inaccurate.
  // We'll manage with the data we have for now.
  const totalContracts = contracts?.length === rowsPerPage ? -1 : page * rowsPerPage + (contracts?.length || 0);


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

  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Reset to first page
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Client Contracts Status
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        label="Search Contracts (Client Name, Phone, etc.)"
        placeholder="Type to search..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      {/* Display loading indicator */}
      {isLoading && <CircularProgress />}

      {/* Display error message if the query fails */}
      {isError && <Alert severity="error">Error loading contracts: {error?.message || 'Unknown error'}. (Note: Backend endpoint may not be available yet)</Alert>}

      {/* Display the table if data is successfully loaded */}
      {!isLoading && !isError && contracts && (
        <>
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
                  <TableCell colSpan={6} align="center">
                    {debouncedSearchTerm ? 'No contracts match your search.' : 'No contracts found.'}
                  </TableCell>
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
        <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={-1} // Backend doesn't provide total count, so we use -1 to disable specific page jumps
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to}`
            }
          />
        </>
      )}
    </Paper>
  );
};

export default ClientContractsPage; 