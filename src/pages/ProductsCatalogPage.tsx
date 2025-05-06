import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    Button,
    CircularProgress,
    Alert,
    Stack,
    CardActionArea,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Snackbar,
    CardActions,
    CardMedia,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
    fetchCategories,
    fetchProducts,
    createCategory,
    createProduct,
    updateProduct,
    deleteProduct,
    ProductListResponse,
    Category,
    Product,
    CategoryCreate,
    ProductCreate,
    ProductUpdate
} from '../lib/api';
import AddCategoryDialog from '../components/AddCategoryDialog';
import AddProductDialog from '../components/AddProductDialog';
import ProductDetailModal from '../components/ProductDetailModal';

// Interface combining product data and files for mutation
interface ProductMutationPayload {
  productData: ProductCreate;
  files: File[] | null;
}

// Interface for the data passed from AddProductDialog
interface ProductSaveData extends ProductCreate {
    files?: File[];
}

const ProductsCatalogPage: React.FC = () => {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isAddCategoryDialogOpen, setIsAddCategoryDialogOpen] = useState(false);
    const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [showSuccessSnackbar, setShowSuccessSnackbar] = useState(false);
    const [showErrorSnackbar, setShowErrorSnackbar] = useState(false);
    const [errorSnackbarMessage, setErrorSnackbarMessage] = useState('');

    // Fetch Categories
    const { data: categories = [], isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[], Error>({
        queryKey: ['categories', token],
        queryFn: () => fetchCategories(token),
        enabled: !!token,
        staleTime: 5 * 60 * 1000, // Cache categories for 5 minutes
    });

    // Fetch Products - Use placeholderData: keepPreviousData for v5
    const { 
        data: currentProductPage, 
        isLoading: isLoadingProducts, 
        error: productsError, 
        isPlaceholderData, // Use isPlaceholderData in v5
    } = useQuery<ProductListResponse, Error>({
        queryKey: ['products', token, currentPage, selectedCategory], 
        queryFn: () => {
            console.log(`Fetching products: Page ${currentPage}, Category ${selectedCategory}`);
            return fetchProducts(token, currentPage, selectedCategory);
        }, 
        enabled: !!token, 
        placeholderData: keepPreviousData, // Correct v5 option
        staleTime: 1 * 60 * 1000, 
    });

    // Update local product list - Use optional chaining
    useEffect(() => {
        if (currentProductPage?.products) { // Keep optional chaining
            setAllProducts(currentProductPage.products);
        }
    }, [currentProductPage]);

    // Use optional chaining for hasMore
    const hasMore = currentProductPage?.has_more ?? false;

    const loadMoreProducts = () => {
        if (hasMore && !isFetchingNextPage) {
            setIsFetchingNextPage(true);
            setCurrentPage(prevPage => prevPage + 1); // Increment page number to trigger query
        }
    }; 

    // --- Mutations --- 
    const { mutate: createCategoryMutate, isPending: isAddingCategory, error: addCategoryError } = useMutation<Category, Error, CategoryCreate>({
        mutationFn: (categoryData) => createCategory(categoryData, token),
        onSuccess: (newCategory) => {
            queryClient.invalidateQueries({ queryKey: ['categories', token] });
            setIsAddCategoryDialogOpen(false);
            setSnackbarMessage(`Category "${newCategory.name}" created successfully!`);
            setShowSuccessSnackbar(true);
        },
        onError: (error) => {
            console.error("Error creating category:", error);
            // Error state is passed to dialog
        },
    });

    const { mutate: createProductMutate, isPending: isAddingProduct, error: addProductError } = useMutation<Product, Error, ProductMutationPayload>({
        mutationFn: ({ productData, files }) => createProduct(productData, files, token),
        onSuccess: (newProduct) => {
            // Invalidate the first page for the relevant category and 'all' categories
            queryClient.invalidateQueries({ queryKey: ['products', token, 1, newProduct.category_id] });
            if (selectedCategory !== newProduct.category_id) { // Also invalidate current view if different
               queryClient.invalidateQueries({ queryKey: ['products', token, 1, selectedCategory] });
            }
             queryClient.invalidateQueries({ queryKey: ['products', token, 1, null] }); // Invalidate 'All Categories'
            
            // Optional: Go back to page 1 after adding? Or stay on current page?
            // setCurrentPage(1);
            // setAllProducts([]); // Let query invalidation handle refresh
            
            setIsAddProductDialogOpen(false);
            setSnackbarMessage(`Product "${newProduct.name}" created successfully!`);
            setShowSuccessSnackbar(true);
        },
        onError: (error) => {
            console.error("Error creating product:", error);
            setErrorSnackbarMessage(error.message || "Failed to create product. Please try again.");
            setShowErrorSnackbar(true);
            // The error is also implicitly passed to the dialog via the `addProductError` variable below
        },
    });

    // Mutation for Updating Product (Keep commented out unless implementing update logic)
    /*
    const { 
        mutate: updateProductMutate, 
        isPending: isUpdatingProduct, 
        error: updateProductError 
    } = useMutation<Product, Error, { productId: string; productData: ProductUpdate }>({
        mutationFn: ({ productId, productData }) => updateProduct(productId, productData, token),
        onSuccess: (updatedProduct) => {
             // Invalidate queries to refetch potentially changed product lists
             queryClient.invalidateQueries({ queryKey: ['products', token] }); // Invalidate all product pages
             setSnackbarMessage(`Product "${updatedProduct.name}" updated successfully!`);
             setShowSuccessSnackbar(true);
             setIsDetailModalOpen(false); // Close modal on successful update
             setSelectedProduct(null); // Clear selection
        },
        onError: (error) => {
             console.error("Error updating product:", error);
              // Error state is passed to modal
        },
    });
    */
   // Placeholder state/values for ProductDetailModal update props
   const isUpdatingProduct = false; // Placeholder
   const updateProductError: Error | null = null; // Placeholder

    // Mutation for Deleting Product
    const { 
        mutate: deleteProductMutate, 
        isPending: isDeletingProduct 
    } = useMutation<void, Error, string>({ // Takes productId (string) as input
        mutationFn: (productId) => deleteProduct(productId, token),
        onSuccess: () => {
            // Invalidate ALL product queries to be safe, or target specific pages
            queryClient.invalidateQueries({ queryKey: ['products', token] });
            setSnackbarMessage('Product deleted successfully!');
            setShowSuccessSnackbar(true);
            handleCloseDetailModal(); // Close the modal after successful deletion
        },
        onError: (error: any) => { // Change error type to any to inspect response
            console.error("Error deleting product:", error);
            let message = "Failed to delete product. Please try again."; // Default message
            if (error.response && error.response.data && error.response.data.detail) {
                // If backend sends a specific detail message (e.g., for 404)
                message = error.response.data.detail;
            } else if (error.message) {
                // General error (network issue, etc.)
                message = error.message;
            }
            setErrorSnackbarMessage(message);
            setShowErrorSnackbar(true);
            // Modal will stay open due to error, which is usually good UX for deletion errors.
        },
    });

    // Wrapper function for AddCategoryDialog onSave prop
    const handleSaveCategory = async (categoryData: CategoryCreate): Promise<void> => {
        return new Promise((resolve, reject) => {
            createCategoryMutate(categoryData, {
              onSuccess: () => resolve(), // Resolve promise on success
              onError: (error) => reject(error), // Reject promise on error
            });
        });
    };

    // Updated wrapper function for AddProductDialog onSave prop
    const handleSaveProduct = async (saveData: ProductSaveData): Promise<void> => {
        // Extract files and the rest of the product data
        const { files, ...productData } = saveData;
        
        const payload: ProductMutationPayload = {
            productData: productData, // Contains name, price, category_id, etc.
            files: files || null // Pass files array or null
        };
        
        return new Promise((resolve, reject) => {
            createProductMutate(payload, {
                onSuccess: () => resolve(),
                onError: (err) => reject(err), // Reject promise to signal error to dialog
            });
        });
    };

    // --- Handlers --- 
    const handleCategoryChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value;
        setSelectedCategory(value === 'all' ? null : value);
        setCurrentPage(1); // Reset to page 1 when category changes
        setAllProducts([]); // Clear old products immediately for better UX
    };

    const handleOpenDetailModal = (product: Product) => {
        setSelectedProduct(product);
        setIsDetailModalOpen(true);
    };

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedProduct(null);
    };

    const handleOpenAddCategoryDialog = () => {
        setIsAddCategoryDialogOpen(true);
    };

    const handleCloseAddCategoryDialog = () => {
        setIsAddCategoryDialogOpen(false);
    };

     const handleOpenAddProductDialog = () => {
        setIsAddProductDialogOpen(true);
    };

    const handleCloseAddProductDialog = () => {
        setIsAddProductDialogOpen(false);
    };
    
    const handleCloseSuccessSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }
        setShowSuccessSnackbar(false);
    };

    const handleCloseErrorSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }
        setShowErrorSnackbar(false);
    };

    // Pagination Handlers using isPlaceholderData
    const handleNextPage = () => {
        // Use isPlaceholderData and optional chaining for has_more
        if (!isPlaceholderData && currentProductPage?.has_more) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePreviousPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    // Determine loading state for initial load vs subsequent loads
    const isInitialLoading = isLoadingProducts && currentPage === 1;

    // Placeholder function for ProductDetailModal onSave prop
    const handleSaveProductUpdate = async (productId: string, productData: ProductUpdate): Promise<void> => {
        console.warn('Product update/delete functionality not fully implemented yet.');
        // In a real implementation, you would call updateProductMutate here
        return Promise.resolve(); 
    };

    // Handler function to trigger delete mutation (passed to modal)
    const handleDeleteProduct = (productId: string) => {
        console.log(`Attempting to delete product: ${productId}`);
        // Confirmation happens inside the modal now
        deleteProductMutate(productId); 
    };

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Product Catalog</Typography>

            {/* Controls: Category Filter & Add Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} justifyContent="space-between" alignItems="center">
                <FormControl sx={{ minWidth: 200 }} size="small">
                    <InputLabel id="category-select-label">Category</InputLabel>
                    <Select
                        labelId="category-select-label"
                        value={selectedCategory || 'all'}
                        label="Category"
                        onChange={handleCategoryChange}
                        disabled={isLoadingCategories || isInitialLoading} // Disable while loading
                    >
                        <MenuItem value="all">All Categories</MenuItem>
                        {isLoadingCategories && <MenuItem disabled>Loading...</MenuItem>}
                        {categoriesError && <MenuItem disabled>Error loading</MenuItem>}
                        {categories.map((cat) => (
                            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Stack direction="row" spacing={1}> 
                    <Button 
                        variant="outlined" 
                        onClick={handleOpenAddCategoryDialog}
                        disabled={isAddingCategory} // Disable if adding category
                        size="small"
                    >
                        Add Category
                    </Button>
                     <Button 
                        variant="contained" 
                        onClick={handleOpenAddProductDialog}
                        disabled={isAddingProduct || categories.length === 0} // Disable if adding or no categories
                        size="small"
                    >
                        Add Product
                    </Button>
                </Stack>
            </Stack>

            {/* Loading State */}
            {isInitialLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                    <CircularProgress />
                </Box>
            )}

            {/* Error State */}
            {productsError && !isInitialLoading && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    Error fetching products: {productsError.message}
                </Alert>
            )}

            {/* Product Grid */}
            {!isInitialLoading && !productsError && (
                <Grid container spacing={3}>
                    {allProducts.length > 0 ? allProducts.map((product) => {
                        // --- DEBUG: Log product image URLs (keep for later) ---
                        // console.log(`Product: ${product.name}, Image URLs:`, product.image_urls);
                        // --- END DEBUG ---
                        return (
                            <Grid item key={product.id} xs={12} sm={6} md={4} lg={3} onClick={() => handleOpenDetailModal(product)} sx={{ cursor: 'pointer' }}> 
                                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    {/* Re-add image display logic */}
                                    {product.image_urls && product.image_urls.length > 0 ? (
                                        <CardMedia
                                            component="img"
                                            sx={{ 
                                                height: 140, // Or other fixed height
                                                objectFit: 'contain' // Or 'cover', depending on desired look
                                            }}
                                            image={product.image_urls[0]} // Display the first image
                                            alt={product.name} // Use product name as alt text
                                        />
                                    ) : (
                                        // Optional: Placeholder if no image
                                        <Box sx={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.200' }}>
                                            <Typography variant="caption" color="text.secondary">
                                                No Image
                                            </Typography>
                                        </Box>
                                    )}
                                    
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography gutterBottom variant="h6" component="div">
                                            {product.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {product.description || 'No description'}
                                        </Typography>
                                        <Typography variant="h5" sx={{ mt: 1 }}>
                                            ${product.price} 
                                        </Typography>
                                         {product.sku && (
                                            <Typography variant="caption" color="text.secondary" display="block"> 
                                                SKU: {product.sku}
                                            </Typography>
                                        )}
                                        <Typography variant="caption" color={product.is_active ? 'success.main' : 'error.main'}>
                                            {product.is_active ? 'Active' : 'Inactive'}
                                        </Typography>
                                    </CardContent>
                                    {/* CardActions were previously removed */}
                                </Card>
                            </Grid>
                        );
                    }) : (
                        <Grid item xs={12}>
                             <Typography>No products found matching your criteria.</Typography>
                        </Grid>
                    )}
                </Grid>
            )}

            {/* Pagination Controls - Use isPlaceholderData */}
            {!isInitialLoading && !productsError && allProducts.length > 0 && (
                 <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    {/* Previous Button */}
                    <Button 
                        onClick={handlePreviousPage} 
                        disabled={currentPage <= 1 || isPlaceholderData} // Use isPlaceholderData
                    >
                        Previous
                    </Button>
                    <Typography sx={{ mx: 2, alignSelf: 'center' }}>Page {currentPage}</Typography>
                     {/* Next Button */}
                    <Button 
                        onClick={handleNextPage} 
                        disabled={isPlaceholderData || !(currentProductPage?.has_more)} // Use isPlaceholderData
                    >
                        {isPlaceholderData ? 'Loading...' : 'Next'} 
                    </Button>
                </Box>
            )}

            {/* Dialogs and Modals */}
            <AddCategoryDialog 
                open={isAddCategoryDialogOpen} 
                onClose={handleCloseAddCategoryDialog} 
                onSave={handleSaveCategory} 
                isSaving={isAddingCategory}
                saveError={addCategoryError?.message || null} 
            />

            <AddProductDialog 
                open={isAddProductDialogOpen} 
                onClose={handleCloseAddProductDialog} 
                onSave={handleSaveProduct} 
                isSaving={isAddingProduct} 
                saveError={addProductError?.message || null} 
                categories={categories} 
            />

            {/* Uncomment and update ProductDetailModal */}
            {selectedProduct && (
                <ProductDetailModal 
                    open={isDetailModalOpen} 
                    onClose={handleCloseDetailModal} 
                    product={selectedProduct} 
                    categories={categories}
                    onSave={handleSaveProductUpdate}
                    isSaving={isUpdatingProduct} // Still using placeholder for update saving state
                    saveError={null} 
                    onDelete={handleDeleteProduct} // Pass delete handler
                />
            )}

            {/* Snackbars */}
            <Snackbar 
                open={showSuccessSnackbar} 
                autoHideDuration={6000} 
                onClose={handleCloseSuccessSnackbar}
            >
                <Alert onClose={handleCloseSuccessSnackbar} severity="success" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
            <Snackbar 
                open={showErrorSnackbar} 
                autoHideDuration={6000} 
                onClose={handleCloseErrorSnackbar}
            >
                <Alert onClose={handleCloseErrorSnackbar} severity="error" sx={{ width: '100%' }}>
                    {errorSnackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default ProductsCatalogPage; 