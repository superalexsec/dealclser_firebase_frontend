import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Chip,
    Grid,
    CardMedia
} from '@mui/material';
import { Product } from '../lib/api'; // Assuming Product type is exported from api.ts

interface ProductDetailModalProps {
    open: boolean;
    onClose: () => void;
    product: Product | null;
    // Add props for editing/disabling later
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ open, onClose, product }) => {

    if (!product) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Product Details</DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <CardMedia
                            component="img"
                            height="200"
                            image={product.image_url || 'https://via.placeholder.com/200?text=No+Image'}
                            alt={product.name}
                            sx={{ objectFit: 'contain', width: '100%' }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <Typography variant="h5" gutterBottom>{product.name}</Typography>
                        <Typography variant="body1" paragraph>
                            {product.description || 'No description available.'}
                        </Typography>
                        <Box sx={{ mb: 1 }}>
                            <Chip label={`Price: ${product.price.toFixed(2)}`} size="small" color="success" sx={{ mr: 1 }} />
                            <Chip label={`Stock: ${product.stock}`} size="small" color={product.stock > 0 ? "info" : "warning"} />
                            {/* TODO: Add Category Name here later if needed */} 
                        </Box>
                        {/* TODO: Display active/disabled status here later */} 
                        {/* TODO: Add Edit/Disable buttons here later */}
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Close</Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProductDetailModal; 