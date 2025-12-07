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
    Grid,
} from '@mui/material';
import {
    ShoppingCart as ShoppingCartIcon,
    RemoveShoppingCart as RemoveShoppingCartIcon,
    DeleteForever as DeleteForeverIcon,
    AddShoppingCart as AddShoppingCartIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
    fetchClients,
    fetchProducts,
    fetchCart,
    removeFromCart,
    clearCart,
    addToCart,
    Client,
    Product,
    RemoveFromCartPayload,
    CartActionPayload,
    AddToCartPayload,
    CartViewResponse,
    CartItemView,
    CartActionResponse,
} from '../lib/api'; // Adjust path if necessary
import { useTranslation } from 'react-i18next';

const CartPage: React.FC = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const { t } = useTranslation();
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantityToAdd, setQuantityToAdd] = useState<number>(1);
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

    // --- Fetch Products for Autocomplete --- 
    const {
        data: productsData, 
        isLoading: isLoadingProducts,
        error: productsError,
    } = useQuery({ // Removed type args as PaginatedProductsResponse is inferred
        // Fetch *all* products for simplicity in the Autocomplete
        // Adjust page/pageSize if needed, or implement scrolling pagination later
        queryKey: ['productsSimple', token], 
        queryFn: () => fetchProducts(token, 1, null), // Fetch page 1, null categoryId
        enabled: !!token, 
        staleTime: 5 * 60 * 1000, // Cache for 5 mins
    });

    // --- Fetch Cart for Selected Client --- 
    const {
        data: cartData,
        isLoading: isLoadingCart,
        error: cartError,
        refetch: refetchCart, // Function to manually refetch cart
    } = useQuery<CartViewResponse, Error>({ 
        queryKey: ['cart', selectedClient?.id, token], 
        queryFn: () => {
            console.log(`[CartPage] Attempting to fetch cart. Client Selected: ${!!selectedClient}, Client ID: ${selectedClient?.id}, Token Present: ${!!token}`);
            if (!selectedClient?.id || !token) {
                console.log('[CartPage] Skipping fetchCart: Client ID or Token missing.');
                return Promise.resolve(null as unknown as CartViewResponse); // Update type hack
            }
            return fetchCart(selectedClient.id, token);
        },
        enabled: !!selectedClient && !!token, // Only fetch if a client is selected
        staleTime: 1 * 60 * 1000,
        refetchOnWindowFocus: true, // Refetch if window regains focus
    });

    // --- Add to Cart Mutation --- 
    const addToCartMutation = useMutation<CartActionResponse, Error, AddToCartPayload>({ 
        mutationFn: (payload) => addToCart(payload, token), 
        onSuccess: (data, payload) => { 
            if (data.success) {
                // Invalidate the cart query to refetch fresh data
                queryClient.invalidateQueries({ queryKey: ['cart', payload.client_id, token] });
                setSnackbarMessage(t('cart.item_added')); 
                // Reset add form
                setSelectedProduct(null);
                setQuantityToAdd(1);
            } else {
                // Handle backend reporting success: false
                setSnackbarMessage(t('cart.error_add')); 
            }
            setShowSnackbar(true); 
        }, 
        onError: (error) => { 
            console.error("Failed to add item to cart:", error); 
            setSnackbarMessage(`${t('cart.error_add')}: ${error.message}`); 
            setShowSnackbar(true); 
        }, 
    });

    // --- Remove/Clear Cart Mutations --- 
    const removeCartItemMutation = useMutation<CartActionResponse, Error, RemoveFromCartPayload>({ 
        mutationFn: (payload) => removeFromCart(payload, token), 
        onSuccess: (data, payload) => { 
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['cart', payload.client_id, token] });
                setSnackbarMessage(t('cart.item_removed')); 
            } else {
                setSnackbarMessage(t('cart.error_remove')); 
            }
            setShowSnackbar(true); 
        }, 
        onError: (error) => { 
            console.error("Failed to remove cart item:", error); 
            setSnackbarMessage(`${t('cart.error_remove')}: ${error.message}`); 
            setShowSnackbar(true); 
        }, 
    });

    const clearCartMutation = useMutation<CartActionResponse, Error, CartActionPayload>({ 
        mutationFn: (payload) => clearCart(payload, token), 
        onSuccess: (data, payload) => { 
            if (data.success) {
                queryClient.invalidateQueries({ queryKey: ['cart', payload.client_id, token] });
                setSnackbarMessage(t('cart.cart_cleared')); 
            } else {
                setSnackbarMessage(t('cart.error_clear')); 
            }
            setShowSnackbar(true); 
        }, 
        onError: (error) => { 
            console.error("Failed to clear cart:", error); 
            setSnackbarMessage(`${t('cart.error_clear')}: ${error.message}`); 
            setShowSnackbar(true); 
        }, 
    });

    // --- Handlers --- 
    const handleClientChange = (event: any, newValue: Client | null) => {
        setSelectedClient(newValue);
        // Reset add form when client changes
        setSelectedProduct(null);
        setQuantityToAdd(1);
    };

    const handleProductChange = (event: any, newValue: Product | null) => {
        setSelectedProduct(newValue);
    };

    const handleQuantityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(event.target.value, 10);
        setQuantityToAdd(value > 0 ? value : 1); // Ensure quantity is at least 1
    };

    const handleAddItemClick = () => {
        if (!selectedClient || !selectedProduct || quantityToAdd <= 0) {
            setSnackbarMessage(t('cart.required'));
            setShowSnackbar(true);
            return;
        }
        addToCartMutation.mutate({
            client_id: selectedClient.id,
            product_id: selectedProduct.id,
            quantity: quantityToAdd,
        });
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
    const productOptions = useMemo(() => productsData?.products || [], [productsData]);
    
    const isCartMutating = removeCartItemMutation.isPending || clearCartMutation.isPending || addToCartMutation.isPending;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ShoppingCartIcon sx={{ mr: 1 }} /> {t('cart.title')}
            </Typography>

            {/* Client Selection */} 
            <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>{t('cart.select_client')}</Typography>
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
                            label={t('cart.search_client')} 
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

            {/* Add Item Section - Only show if client is selected */} 
            {selectedClient && (
                <Paper elevation={1} sx={{ p: 2, mb: 3 }}>
                    <Typography variant="h6" gutterBottom>{t('cart.add_item_title')}</Typography>
                    {productsError && (
                        <Alert severity="warning" sx={{ mb: 2 }}>Could not load product list: {(productsError as Error).message}</Alert>
                    )}
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                            <Autocomplete
                                options={productOptions}
                                loading={isLoadingProducts}
                                getOptionLabel={(option) => `${option.name} (ID: ${option.id})`}
                                value={selectedProduct}
                                onChange={handleProductChange}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                renderInput={(params) => (
                                    <TextField 
                                        {...params} 
                                        label={t('cart.select_product')} 
                                        variant="outlined"
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <React.Fragment>
                                                    {isLoadingProducts ? <CircularProgress color="inherit" size={20} /> : null}
                                                    {params.InputProps.endAdornment}
                                                </React.Fragment>
                                            ),
                                        }}
                                     />
                                )}
                            />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <TextField
                                label={t('common.quantity')}
                                type="number"
                                value={quantityToAdd}
                                onChange={handleQuantityChange}
                                fullWidth
                                variant="outlined"
                                inputProps={{ min: 1 }}
                            />
                        </Grid>
                        <Grid item xs={6} sm={3}>
                            <Button
                                variant="contained"
                                onClick={handleAddItemClick}
                                disabled={!selectedProduct || isCartMutating}
                                startIcon={addToCartMutation.isPending ? <CircularProgress size={20} /> : <AddShoppingCartIcon />}
                                fullWidth
                            >
                                {addToCartMutation.isPending ? t('cart.adding') : t('cart.add_item_title')}
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Cart Display */} 
            {selectedClient && (
                <Paper elevation={1} sx={{ p: 2 }}>
                    <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                         <Typography variant="h6">{t('cart.cart_for')}: {selectedClient.first_name} {selectedClient.surname}</Typography>
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
                                 {isCartMutating ? t('cart.clearing') : t('cart.clear_cart')}
                             </Button>
                         )}
                     </Box>
                    <Divider sx={{ mb: 2 }}/>
                    
                     {isLoadingCart && <Box sx={{textAlign: 'center', my: 2}}><CircularProgress /></Box>}
                     {cartError && <Alert severity="error">Failed to load cart: {cartError?.message}</Alert>}
                     {!isLoadingCart && !cartError && (!cartData || cartData.items.length === 0) && (
                          <Typography sx={{ textAlign: 'center', color: 'text.secondary', my: 2 }}>
                              {t('cart.empty')}
                          </Typography>
                      )}
                     {!isLoadingCart && !cartError && cartData && cartData.items.length > 0 && (
                         <List dense>
                             {cartData.items.map((item: CartItemView) => (
                                 <ListItem
                                     key={`${item.name}-${item.quantity}`} 
                                     secondaryAction={ 
                                         <IconButton
                                             edge="end"
                                             aria-label="remove item"
                                             disabled={isCartMutating || isLoadingCart || true}
                                             color="error"
                                         >
                                             {isCartMutating ? <CircularProgress size={20}/> : <DeleteForeverIcon />}
                                         </IconButton>
                                     } 
                                 >
                                     <ListItemText
                                         primary={item.name}
                                         secondary={`Qty: ${item.quantity} @ ${item.price_at_addition}`}
                                     />
                                 </ListItem>
                             ))}
                             <ListItem sx={{ mt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                                 <ListItemText primaryTypographyProps={{fontWeight: 'bold'}} primary={`${t('common.total')}:`} />
                                 <Typography variant="body1" fontWeight="bold">{cartData.total}</Typography>
                             </ListItem>
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
