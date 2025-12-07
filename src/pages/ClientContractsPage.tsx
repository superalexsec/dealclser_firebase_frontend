import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchClientContracts, ClientContractListItem, ContractStatus, fetchPublicContractDetails } from '../lib/api';
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
  Chip,
  Button,
  TablePagination,
  TextField,
  debounce,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const ClientContractsPage: React.FC = () => {
  const { token } = useAuth();
  const { t } = useTranslation();
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
    };
  }, [searchTerm]);


  // Fetch the list of client contracts with pagination and search
  const { data: contracts, isLoading, error, isError } = useQuery<ClientContractListItem[], Error>({
    queryKey: ['clientContracts', token, page, rowsPerPage, debouncedSearchTerm],
    queryFn: () => fetchClientContracts(token, page * rowsPerPage, rowsPerPage, debouncedSearchTerm),
    enabled: !!token, // Only run query if token is available
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
        alert(`Could not retrieve PDF link: ${err.message}`);
    },
  });

  const handleViewPdf = (contractDbId: string) => {
    getViewablePdfLink(contractDbId);
  };

  const getStatusChip = (status: ContractStatus) => {
    switch (status) {
      case ContractStatus.SIGNED:
        return <Chip label={t('client_contracts.statuses.signed')} color="success" size="small" />;
      case ContractStatus.AWAITING_SIGNATURE:
        return <Chip label={t('client_contracts.statuses.awaiting')} color="warning" size="small" />;
      case ContractStatus.GENERATED:
          return <Chip label={t('client_contracts.statuses.generated')} color="info" size="small" />;
       case ContractStatus.ERROR:
          return <Chip label={t('client_contracts.statuses.error')} color="error" size="small" />;
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
        {t('client_contracts.title')}
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        label={t('client_contracts.search_placeholder')}
        placeholder={t('common.search')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      {/* Display loading indicator */}
      {isLoading && <CircularProgress />}

      {/* Display error message if the query fails */}
      {isError && <Alert severity="error">{t('common.api_error')}: {error?.message || t('common.unknown_error')}.</Alert>}

      {/* Display the table if data is successfully loaded */}
      {!isLoading && !isError && contracts && (
        <>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table sx={{ minWidth: 650 }} aria-label="client contracts table">
            <TableHead>
              <TableRow>
                <TableCell>{t('client_contracts.client_name')}</TableCell>
                <TableCell>{t('client_contracts.client_phone')}</TableCell>
                <TableCell>{t('client_contracts.status')}</TableCell>
                <TableCell>{t('client_contracts.generated_at')}</TableCell>
                <TableCell>{t('client_contracts.signed_at')}</TableCell>
                <TableCell align="right">{t('client_contracts.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {contracts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {debouncedSearchTerm ? t('client_contracts.no_match') : t('client_contracts.no_contracts')}
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
                        {t('client_contracts.view_pdf')}
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
            count={-1} // Backend doesn't provide total count
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to}`
            }
            labelRowsPerPage={t('common.page')} // Not exact match but ok for now or add new key
          />
        </>
      )}
    </Paper>
  );
};

export default ClientContractsPage;
