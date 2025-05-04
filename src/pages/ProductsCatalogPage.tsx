import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Pagination,
  Chip,
  Divider,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { fetchCategories, fetchProducts, Category, Product, PaginatedProductsResponse } from '../lib/api';

// Helper to provide placeholder data structure during fetching
const placeholderProductsData: PaginatedProductsResponse = {
  items: [],
  total: 0,
  page: 1,
  size: 0,
  pages: 1,
};

const ProductsCatalogPage: React.FC = () => {
  const { token } = useAuth();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 9; // Adjust as needed

  // Fetch Categories
  const {
    data: categories = [],
    isLoading: isLoadingCategories,
    error: categoriesError,
  } = useQuery<Category[], Error>({
    queryKey: ['categories', token],
    queryFn: () => fetchCategories(token),
    enabled: !!token,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch Products (depends on selected category and current page)
  const {
    data: productsData,
    isLoading: isLoadingProducts,
    error: productsError,
    isFetching: isFetchingProducts,
  } = useQuery<PaginatedProductsResponse, Error>({
    queryKey: ['products', selectedCategoryId, currentPage, productsPerPage, token],
    queryFn: () => fetchProducts(token, currentPage, productsPerPage, selectedCategoryId),
    enabled: !!token,
    placeholderData: (previousData) => previousData ?? placeholderProductsData, // Use placeholderData (keepPreviousData replacement)
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const handleCategoryClick = (categoryId: string | null) => {
    console.log('Category clicked:', categoryId);
    setSelectedCategoryId(categoryId);
    setCurrentPage(1); // Reset to first page when category changes
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  // Use optional chaining and nullish coalescing for safer access
  const products = productsData?.items ?? [];
  const totalPages = productsData?.pages ?? 1;
  // Determine overall loading state (for initial render/major changes)
  const isInitiallyLoading = isLoadingCategories || isLoadingProducts;
  const hasError = categoriesError || productsError;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Product Catalog
      </Typography>

      {hasError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load catalog data: { (categoriesError || productsError)?.message }
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Categories Sidebar */}
        <Grid item xs={12} md={3}>
          <Typography variant="h6" gutterBottom>Categories</Typography>
          <Paper elevation={1} sx={{ maxHeight: '70vh', overflow: 'auto' }}>
            {isLoadingCategories ? (
              <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={24} /></Box>
            ) : categoriesError ? (
                <Alert severity="warning" sx={{m:1}}>Could not load categories.</Alert>
            ) : (
              <List dense component="nav">
                <ListItemButton
                  selected={selectedCategoryId === null}
                  onClick={() => handleCategoryClick(null)}
                >
                  <ListItemText primary="All Products" />
                </ListItemButton>
                <Divider />
                {categories.map((category) => (
                  <ListItemButton
                    key={category.id}
                    selected={selectedCategoryId === category.id}
                    onClick={() => handleCategoryClick(category.id)}
                  >
                    <ListItemText primary={category.name} />
                  </ListItemButton>
                ))}
                {categories.length === 0 && (
                    <ListItem>
                        <ListItemText secondary="No categories found." />
                    </ListItem>
                )}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Products Grid */}
        <Grid item xs={12} md={9}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                    {selectedCategoryId ? categories.find(c => c.id === selectedCategoryId)?.name : 'All Products'}
                </Typography>
                {/* Show loading indicator only when fetching in background (not initial load) */}
                {(isFetchingProducts && !isInitiallyLoading) && <CircularProgress size={20} />} 
            </Box>
          {/* Show main loading indicator only on initial load */}
          {isInitiallyLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <CircularProgress />
            </Box>
          ) : productsError ? (
            <Alert severity="warning">Could not load products for this category.</Alert>
          ) : products.length === 0 ? (
            <Typography sx={{ textAlign: 'center', mt: 4 }}>
              No products found in this category.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {/* Explicitly type 'product' here */}
              {products.map((product: Product) => (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <Card sx={{ height: '100%' }}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={product.image_url || 'https://via.placeholder.com/150?text=No+Image'} // Placeholder
                      alt={product.name}
                      sx={{ objectFit: 'contain', pt: 1}} // Use contain to avoid cropping
                    />
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div" noWrap title={product.name}>
                        {product.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ minHeight: '40px', mb: 1 }}>
                        {product.description || 'No description available.'}
                      </Typography>
                      <Chip label={`Price: ${product.price.toFixed(2)}`} size="small" color="success" sx={{ mr: 0.5 }}/>
                      <Chip label={`Stock: ${product.stock}`} size="small" color={product.stock > 0 ? "info" : "warning"} />
                      {/* TODO: Add "Add to Cart" button here when cart functionality is ready */}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Pagination */} 
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                disabled={isFetchingProducts} // Disable pagination while any fetch is happening
              />
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProductsCatalogPage; 