import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    TextField,
    Autocomplete,
    CircularProgress,
    Alert,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Button,
    Paper,
    Divider,
} from '@mui/material';
import {
    ShoppingCart as ShoppingCartIcon,
    RemoveShoppingCart as RemoveShoppingCartIcon,
    DeleteForever as DeleteForeverIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
    fetchClients,
    fetchCart,
    removeFromCart,
    clearCart,
    Client,
    Cart,
    RemoveFromCartPayload,
    CartActionPayload,
} from '../lib/api'; // Adjust path if necessary

const CartPage: React.FC = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbarMessage, setSnackbarMessage] = useState(''); // For success/error messages
    const [showSnackbar, setShowSnackbar] = useState(false);

    // --- Fetch Clients for Autocomplete --- 
    const {
        data: clients = [],
        isLoading: isLoadingClients,
        error: clientsError,
    } = useQuery<Client[], Error>({ 
        queryKey: ['clientsSimple', token], // Use a different key for potentially simpler fetch
        queryFn: () => fetchClients(0, 100, token), // Use default limit (100) or smaller explicit limit
        enabled: !!token,
        staleTime: 5 * 60 * 1000,
    });

    // --- Fetch Cart for Selected Client --- 
    const {
        data: cartData,
        isLoading: isLoadingCart,
        error: cartError,
        refetch: refetchCart, // Function to manually refetch cart
    } = useQuery<Cart, Error>({ 
        queryKey: ['cart', selectedClient?.id, token], 
        queryFn: () => {
            console.log(`[CartPage] Attempting to fetch cart. Client Selected: ${!!selectedClient}, Client ID: ${selectedClient?.id}, Token Present: ${!!token}`);
            if (!selectedClient?.id || !token) {
                console.log('[CartPage] Skipping fetchCart: Client ID or Token missing.');
                return Promise.resolve(null as unknown as Cart); // Type hack for disabled state
            }
            return fetchCart(selectedClient.id, token);
        },
        enabled: !!selectedClient && !!token, // Only fetch if a client is selected
        staleTime: 1 * 60 * 1000,
        refetchOnWindowFocus: true, // Refetch if window regains focus
    });

    // --- Cart Mutations --- 
    const removeCartItemMutation = useMutation<Cart, Error, RemoveFromCartPayload>({ 
        mutationFn: (payload) => removeFromCart(payload, token), 
        onSuccess: (updatedCart, payload) => { 
            queryClient.setQueryData(['cart', payload.client_id, token], updatedCart); 
            setSnackbarMessage('Cart item removed.'); 
            setShowSnackbar(true); 
        }, 
        onError: (error) => { 
            console.error("Failed to remove cart item:", error); 
            setSnackbarMessage(`Error removing item: ${error.message}`); 
            setShowSnackbar(true); 
        }, 
    });

    const clearCartMutation = useMutation<Cart, Error, CartActionPayload>({ 
        mutationFn: (payload) => clearCart(payload, token), 
        onSuccess: (updatedCart, payload) => { 
            queryClient.setQueryData(['cart', payload.client_id, token], updatedCart); 
            setSnackbarMessage('Cart cleared successfully.'); 
            setShowSnackbar(true); 
        }, 
        onError: (error) => { 
            console.error("Failed to clear cart:", error); 
            setSnackbarMessage(`Error clearing cart: ${error.message}`); 
            setShowSnackbar(true); 
        }, 
    });

    // --- Handlers --- 
    const handleClientChange = (event: any, newValue: Client | null) => {
        setSelectedClient(newValue);
    };

    const handleRemoveItemClick = (productId: string) => {
        if (selectedClient) {
            removeCartItemMutation.mutate({ client_id: selectedClient.id, product_id: productId });
        }
    };

    const handleClearCartClick = () => {
        if (selectedClient) {
            clearCartMutation.mutate({ client_id: selectedClient.id });
        }
    };

    // Memoize options for Autocomplete
    const clientOptions = useMemo(() => clients, [clients]);
    
    const isCartMutating = removeCartItemMutation.isPending || clearCartMutation.isPending;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCartIcon sx={{ mr: 1 }} /> Client Cart Management
            </Typography>

            {/* Client Selection */} 
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>Select Client</Typography>
                {clientsError && (
                    <Alert severity="error" sx={{ mb: 2 }}>Failed to load clients: {clientsError.message}</Alert>
                )}
                <Autocomplete
                    options={clientOptions}
                    loading={isLoadingClients}
                    getOptionLabel={(option) => `${option.first_name} ${option.surname} (${option.client_identification})`}
                    value={selectedClient}
                    onChange={handleClientChange}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                        <TextField 
                            {...params} 
                            label="Search and Select Client" 
                            variant="outlined"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <React.Fragment>
                                        {isLoadingClients ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </React.Fragment>
                                ),
                            }}
                         />
                    )}
                />
            </Paper>

            {/* Cart Display */} 
            {selectedClient && (
                <Paper elevation={1} sx={{ p: 2 }}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                         <Typography variant="h6">Cart for: {selectedClient.first_name} {selectedClient.surname}</Typography>
                         {cartData && cartData.items.length > 0 && (
                             <Button
                                 size="small"
                                 color="error"
                                 variant="outlined"
                                 sx={{ ml: 'auto' }}
                                 startIcon={isCartMutating ? <CircularProgress size={16}/> : <RemoveShoppingCartIcon />}
                                 onClick={handleClearCartClick}
                                 disabled={isCartMutating || isLoadingCart}
                             >
                                 {isCartMutating ? 'Clearing...' : 'Clear Cart'}
                             </Button>
                         )}
                     </Box>
                    <Divider sx={{ mb: 2 }}/>
                    
                     {isLoadingCart && <Box sx={{textAlign: 'center', my: 2}}><CircularProgress /></Box>}
                     {cartError && <Alert severity="error">Failed to load cart: {(cartError as Error).message}</Alert>}
                     {!isLoadingCart && !cartError && (!cartData || cartData.items.length === 0) && (
                          <Typography sx={{ textAlign: 'center', color: 'text.secondary', my: 2 }}>
                              Cart is empty.
                          </Typography>
                      )}
                     {!isLoadingCart && !cartError && cartData && cartData.items.length > 0 && (
                         <List dense>
                             {cartData.items.map((item) => (
                                 <ListItem
                                     key={item.product_id}
                                     secondaryAction={ 
                                         <IconButton
                                             edge="end"
                                             aria-label="remove item"
                                             onClick={() => handleRemoveItemClick(item.product_id)}
                                             disabled={isCartMutating || isLoadingCart}
                                             color="error"
                                         >
                                             {isCartMutating ? <CircularProgress size={20}/> : <DeleteForeverIcon />}
                                         </IconButton>
                                     } 
                                 >
                                     <ListItemText
                                         primary={`Product ID: ${item.product_id}`} // TODO: Fetch product names?
                                         secondary={`Quantity: ${item.quantity}`}
                                     />
                                 </ListItem>
                             ))}
                         </List>
                     )}
                </Paper>
            )}

            {/* Snackbar for messages - TODO: Implement Snackbar component */} 
            {/* <Snackbar open={showSnackbar} autoHideDuration={4000} onClose={() => setShowSnackbar(false)} message={snackbarMessage} /> */} 
        </Box>
    );
};

export default CartPage;

// Ensure it's treated as a module
export {}; 