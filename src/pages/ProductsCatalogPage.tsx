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
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
    fetchCategories,
    fetchProducts,
    createCategory,
    createProduct,
    updateProduct,
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

    // Fetch Categories
    const { data: categories = [], isLoading: isLoadingCategories, error: categoriesError } = useQuery<Category[], Error>({
        queryKey: ['categories', token],
        queryFn: () => fetchCategories(token),
        enabled: !!token,
        staleTime: 5 * 60 * 1000, // Cache categories for 5 minutes
    });

    // Fetch Products - Modified for infinite loading
    const { 
        data: currentProductPage, 
        isLoading: isLoadingProducts, // This is true for the initial load of a page
        error: productsError, 
    } = useQuery<ProductListResponse, Error>({ 
        queryKey: ['products', token, currentPage, selectedCategory], 
        queryFn: () => fetchProducts(token, currentPage, selectedCategory), 
        enabled: !!token, 
        refetchOnWindowFocus: false,
        // keepPreviousData might be useful if you want to show old data while loading the *next* page
        // keepPreviousData: true, 
    });

    // Effect to append new products to state when a new page loads
    useEffect(() => {
        if (currentProductPage?.products) {
            setAllProducts(prevProducts => {
                // Simple append if it's a new page
                if (currentPage > 1) {
                   const newProducts = currentProductPage.products.filter(
                       newProd => !prevProducts.some(existingProd => existingProd.id === newProd.id)
                   );
                   return [...prevProducts, ...newProducts];
                } else {
                    // If it's the first page (currentPage === 1), replace the data
                    return currentProductPage.products;
                }
            });
        }
        // Reset fetching state once data arrives for the current page
        setIsFetchingNextPage(false);
    }, [currentProductPage, currentPage]); // Depend on the fetched data for the current page

    // Effect to reset products when category changes
    useEffect(() => {
        setAllProducts([]); // Clear existing products
        setCurrentPage(1); // Reset to page 1
        // This effect doesn't need to trigger a refetch itself,
        // changing currentPage back to 1 will trigger the useQuery hook if needed.
    }, [selectedCategory]); // Only depend on category

    // --- Load More Logic --- 
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

    const { mutate: createProductMutate, isPending: isAddingProduct, error: addProductError } = useMutation<Product, Error, ProductCreate>({
        mutationFn: (productData) => createProduct(productData, token),
        onSuccess: (newProduct) => {
            // Invalidate the first page for the category and 'all'
            queryClient.invalidateQueries({ queryKey: ['products', token, 1, newProduct.category_id] });
            queryClient.invalidateQueries({ queryKey: ['products', token, 1, null] });
            // Reset local state to reflect the new product potentially appearing on page 1
            setAllProducts([]);
            setCurrentPage(1);
            setIsAddProductDialogOpen(false);
            setSnackbarMessage(`Product "${newProduct.name}" created successfully!`);
            setShowSuccessSnackbar(true);
        },
        onError: (error) => {
            console.error("Error creating product:", error);
             // Error state is passed to dialog
        },
    });

    // Mutation for Updating Product
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

    // Wrapper function for AddCategoryDialog onSave prop
    const handleSaveCategory = async (categoryData: CategoryCreate): Promise<void> => {
        return new Promise((resolve, reject) => {
            createCategoryMutate(categoryData, {
              onSuccess: () => resolve(), // Resolve promise on success
              onError: (error) => reject(error), // Reject promise on error
            });
        });
    };

    // Wrapper function for AddProductDialog onSave prop
    const handleSaveProduct = async (productData: ProductCreate): Promise<void> => {
        return new Promise((resolve, reject) => {
            createProductMutate(productData, {
                onSuccess: () => resolve(),
                onError: (error) => reject(error),
            });
        });
    };

    // --- Handlers --- 
    const handleCategoryChange = (event: SelectChangeEvent<string>) => {
        const value = event.target.value;
        setSelectedCategory(value === 'all' ? null : value);
        // Resetting state happens in useEffect based on selectedCategory change
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
    
    const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
        if (reason === 'clickaway') {
          return;
        }
        setShowSuccessSnackbar(false);
    };

    // Handler to be passed to the modal for saving updates
    const handleSaveProductUpdate = async (productId: string, productData: ProductUpdate): Promise<void> => {
        return new Promise((resolve, reject) => {
            updateProductMutate({ productId, productData }, {
              onSuccess: () => resolve(),
              onError: (error) => reject(error), // Let the mutation's onError handle UI feedback
            });
        });
    };

    // Determine if showing initial loading spinner
    const showInitialLoading = isLoadingProducts && currentPage === 1 && allProducts.length === 0;

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom>Product Catalog</Typography>

            {/* Controls: Category Filter & Add Buttons */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }} alignItems="center">
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel id="category-select-label">Category</InputLabel>
                    <Select
                        labelId="category-select-label"
                        id="category-select"
                        value={selectedCategory || 'all'}
                        label="Category"
                        onChange={handleCategoryChange}
                        disabled={isLoadingCategories} // Disable while loading categories
                    >
                        <MenuItem value="all">All Products</MenuItem>
                        {categoriesError && <MenuItem disabled>Error loading categories</MenuItem>}
                        {categories.map((category) => (
                        <MenuItem key={category.id} value={category.id}>
                            {category.name}
                        </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button 
                    variant="outlined" 
                    onClick={handleOpenAddCategoryDialog} 
                    disabled={isAddingCategory} // Disable if already adding
                >
                    Add Category
                </Button>
                <Button 
                    variant="contained" 
                    onClick={handleOpenAddProductDialog} 
                    disabled={isLoadingCategories || categories.length === 0 || isAddingProduct}
                >
                    Add Product
                </Button>
            </Stack>

            {/* Loading and Error States */} 
            {showInitialLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}><CircularProgress /></Box>
            )}
            {/* Show product fetch error only if not initially loading */}
            {productsError && !showInitialLoading && (
                <Alert severity="error" sx={{ mb: 3 }}>Failed to load products: {productsError.message}</Alert>
            )}
             {/* Show category fetch error if relevant */}
            {categoriesError && (
                <Alert severity="warning" sx={{ mb: 3 }}>Failed to load categories: {categoriesError.message}</Alert>
            )}

            {/* Product Grid */}
            {/* Render grid only if not initially loading and no product error */}
            {!showInitialLoading && !productsError && (
                <Grid container spacing={3}>
                    {allProducts.map((product) => (
                        <Grid item xs={12} sm={6} md={4} key={product.id}>
                            <CardActionArea onClick={() => handleOpenDetailModal(product)} sx={{ height: '100%' }}>
                                <Card sx={{ height: '100%' }}>
                                    <CardContent>
                                        <Typography gutterBottom variant="h6" component="div" noWrap title={product.name}>
                                            {product.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }} noWrap>
                                            {product.description || 'No description.'}
                                        </Typography>
                                        <Typography variant="h6" color="primary">
                                            {/* Display price string - Consider formatting */}
                                            Price: {product.price}
                                        </Typography>
                                        <Typography variant="caption" display="block" color={!product.is_active ? "error" : "success"}>
                                            Status: {!product.is_active ? 'Disabled' : 'Active'}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </CardActionArea>
                        </Grid>
                    ))}
                </Grid>
            )}
            
            {/* No products message */}
            {!isLoadingProducts && !isFetchingNextPage && allProducts.length === 0 && currentPage === 1 && !productsError && (
                <Typography sx={{ textAlign: 'center', mt: 4 }}>No products found matching your criteria.</Typography>
            )}

            {/* Load More Button */} 
            {hasMore && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <Button 
                        variant="contained" 
                        onClick={loadMoreProducts} 
                        disabled={isFetchingNextPage || isLoadingProducts} // Disable if loading initial page or next page
                    >
                        {isFetchingNextPage ? <CircularProgress size={24} color="inherit" /> : 'Load More Products'}
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

            {selectedProduct && (
                 <ProductDetailModal
                    open={isDetailModalOpen}
                    onClose={handleCloseDetailModal}
                    product={selectedProduct}
                    categories={categories} // Pass categories for dropdown
                    onSave={handleSaveProductUpdate} // Pass the handler
                    isSaving={isUpdatingProduct} // Pass loading state
                    saveError={updateProductError?.message || null} // Pass error state
                 />
             )}

             <Snackbar
                 open={showSuccessSnackbar}
                 autoHideDuration={4000}
                 onClose={handleCloseSnackbar}
                 message={snackbarMessage}
             />

        </Box>
    );
};

export default ProductsCatalogPage; 