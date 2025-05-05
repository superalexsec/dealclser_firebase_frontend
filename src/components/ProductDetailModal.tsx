import React, { useState, useEffect } from 'react';
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
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    IconButton,
    FormHelperText,
    CircularProgress,
    Alert,
    Switch,
    FormControlLabel,
} from '@mui/material';
import {
    Edit as EditIcon,
    Save as SaveIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { Product, Category, ProductUpdate } from '../lib/api'; // Import necessary types
import { SelectChangeEvent } from '@mui/material/Select';

// Import react-slick
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

interface ProductDetailModalProps {
    open: boolean;
    onClose: () => void;
    product: Product | null;
    categories: Category[]; // Needed for category dropdown in edit mode
    onSave: (productId: string, productData: ProductUpdate) => Promise<void>; // Function to call on save
    isSaving: boolean; // Prop to indicate saving state
    saveError: string | null; // Prop to show save error
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
    open, 
    onClose, 
    product, 
    categories, 
    onSave, 
    isSaving, 
    saveError 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    // Initialize with partial to avoid errors before useEffect runs
    const [editFormState, setEditFormState] = useState<Partial<ProductUpdate>>({}); 
    const [localError, setLocalError] = useState<string | null>(null);

    // Effect to initialize/reset form state when product or open status changes
    useEffect(() => {
        if (product && open) {
            setIsEditing(false); // Default to view mode
            setLocalError(null);
            setEditFormState({
                name: product.name || '',
                description: product.description || '',
                price: product.price || '', // String price
                category_id: product.category_id || '',
                is_active: product.is_active ?? true,
            });
        } else if (!open) {
            // Clear state completely when dialog closes
            setEditFormState({});
            setIsEditing(false);
            setLocalError(null);
        }
    }, [product, open]);

    const handleEditToggle = () => {
        const wasEditing = isEditing;
        setIsEditing(!isEditing);
        setLocalError(null); 
        // If cancelling edit, reset form to original product values
        if (wasEditing && product) {
            setEditFormState({
                name: product.name || '',
                description: product.description || '',
                price: product.price || '',
                category_id: product.category_id || '',
                is_active: product.is_active ?? true,
            });
        }
    };

    // Generic handler for text inputs
    const handleInputChange = (field: 'name' | 'description' | 'price') => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setEditFormState(prev => ({ ...prev, [field]: event.target.value }));
    };
    
    // Specific handler for category select
    const handleCategoryChange = (event: SelectChangeEvent<string>) => {
        setEditFormState(prev => ({ ...prev, category_id: event.target.value }));
    };

    // Specific handler for is_active switch
    const handleActiveChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setEditFormState(prev => ({ ...prev, is_active: event.target.checked }));
    };

    const handleSave = () => {
        setLocalError(null);
        // Validate required fields in the current edit state
        if (!editFormState.name?.trim() || !editFormState.price?.trim() || !editFormState.category_id) {
            setLocalError('Name, Price, and Category are required.');
            return;
        }
        // Validate price is a valid number string
        if (isNaN(parseFloat(editFormState.price))) { 
            setLocalError('Please enter a valid number for Price (e.g., 10.99).');
            return;
        }

        // Construct the update payload from editFormState
        const updateData: ProductUpdate = {
             name: editFormState.name.trim(),
             description: editFormState.description?.trim() || null,
             price: editFormState.price.trim(), // Send trimmed string
             category_id: editFormState.category_id,
             is_active: editFormState.is_active ?? true, // Ensure boolean
        };
        
        if (product) {
            onSave(product.id, updateData);
        } else {
            setLocalError("Cannot save, original product data is missing.");
        }
    };

    // Handle case where dialog is open but product is missing
    if (open && !product) {
         return (
             <Dialog open={open} onClose={onClose}>
                 <DialogTitle>Error</DialogTitle>
                 <DialogContent><Alert severity="error">Product data is not available.</Alert></DialogContent>
                 <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
             </Dialog>
         );
    }
    // If closed or product is loading, render nothing (or a loader if preferred)
    if (!open || !product) {
        return null; 
    }

    // Now we know product is not null, determine data source for display
    const displayData = isEditing ? editFormState : product;

    // Carousel settings (adjust as needed)
    const carouselSettings = {
        dots: true,
        infinite: product.image_urls && product.image_urls.length > 1, // Only loop if multiple images
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        adaptiveHeight: true // Adjust height to slide content
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" /* Use wider modal for layout */ fullWidth>
            <DialogTitle>{isEditing ? 'Edit Product' : 'Product Details'}</DialogTitle>
            <DialogContent dividers>
                {(localError || saveError) && (
                    <Alert severity="error" sx={{ mb: 2 }}>{localError || saveError}</Alert>
                )}
                {/* Use Grid layout: Image/Carousel on left, details on right */}
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    {/* Image Section (Carousel or Single Image) */}
                    <Grid item xs={12} md={6}> {/* Takes half width on medium screens and up */}
                        {product.image_urls && product.image_urls.length > 1 ? (
                             <Box sx={{ mb: 2, '.slick-prev:before, .slick-next:before': { color: 'grey' } }}> {/* Style arrows */}
                                <Slider {...carouselSettings}>
                                    {product.image_urls.map((url, index) => (
                                        <Box key={index} component="div"> {/* Slider needs div */}
                                            <Box 
                                                component="img"
                                                src={url}
                                                alt={`${product.name} - ${index + 1}`}
                                                sx={{ 
                                                    width: '100%', 
                                                    height: 'auto', // Auto height to maintain aspect ratio
                                                    maxHeight: '400px', // Limit max height
                                                    objectFit: 'contain', 
                                                    display: 'block', // Prevent extra space below img
                                                    margin: '0 auto' // Center image if needed
                                                }}
                                            />
                                        </Box>
                                    ))}
                                </Slider>
                            </Box>
                        ) : product.image_urls && product.image_urls.length === 1 ? (
                            // Single Image
                             <Box 
                                component="img"
                                src={product.image_urls[0]}
                                alt={product.name}
                                sx={{ 
                                    width: '100%', 
                                    height: 'auto',
                                    maxHeight: '400px',
                                    objectFit: 'contain', 
                                    display: 'block', 
                                    mb: 2 
                                }}
                            />
                        ) : (
                            // No Image Placeholder
                            <Box sx={{ 
                                height: 200, // Or adjust height
                                width: '100%', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                backgroundColor: 'grey.200',
                                borderRadius: 1,
                                mb: 2 
                            }}> 
                                <Typography variant="caption" color="text.secondary">
                                    No Image Available
                                </Typography>
                            </Box>
                        )}
                    </Grid>

                    {/* Details Section */}
                    <Grid item xs={12} md={6}> {/* Takes other half width */}
                        <Grid container spacing={2}>
                            {/* Name */}
                            <Grid item xs={12}>
                                <TextField
                                    label="Product Name"
                                    fullWidth
                                    required
                                    value={displayData.name ?? ''}
                                    onChange={handleInputChange('name')}
                                    disabled={!isEditing || isSaving}
                                    InputProps={{ readOnly: !isEditing }}
                                    variant={isEditing ? "outlined" : "standard"}
                                    error={isEditing && !!localError && !editFormState.name?.trim()}
                                />
                            </Grid>
                            {/* Category */}
                            <Grid item xs={12} sm={6}>
                                 <FormControl fullWidth required error={isEditing && !!localError && !editFormState.category_id} disabled={!isEditing || isSaving}>
                                    <InputLabel id={`category-select-label-${product.id}`}>Category</InputLabel>
                                    <Select
                                        labelId={`category-select-label-${product.id}`}
                                        value={displayData.category_id ?? ''}
                                        label="Category"
                                        onChange={handleCategoryChange}
                                        variant={isEditing ? "outlined" : "standard"}
                                    >
                                        <MenuItem value="" disabled><em>Select Category</em></MenuItem>
                                        {categories.map((cat) => (
                                            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                        ))}
                                    </Select>
                                    {isEditing && !!localError && !editFormState.category_id && <FormHelperText>Category is required.</FormHelperText>}
                                </FormControl>
                            </Grid>
                            {/* Price */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Price"
                                    fullWidth
                                    required
                                    value={displayData.price ?? ''}
                                    onChange={handleInputChange('price')}
                                    disabled={!isEditing || isSaving}
                                    InputProps={{ readOnly: !isEditing }}
                                    variant={isEditing ? "outlined" : "standard"}
                                    error={isEditing && !!localError && (!editFormState.price || isNaN(parseFloat(editFormState.price)))}
                                    helperText={isEditing && !!localError && (!editFormState.price || isNaN(parseFloat(editFormState.price))) ? 'Valid number required' : ''}
                                    type="text"
                                />
                            </Grid>
                            {/* Description */}
                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={displayData.description ?? ''}
                                    onChange={handleInputChange('description')}
                                    disabled={!isEditing || isSaving}
                                    InputProps={{ readOnly: !isEditing }}
                                    variant={isEditing ? "outlined" : "standard"}
                                />
                            </Grid>
                            {/* Status (Is Active) */}
                            <Grid item xs={12}>
                                <FormControlLabel 
                                    control={<Switch 
                                        checked={displayData.is_active ?? true} 
                                        onChange={handleActiveChange}
                                        disabled={!isEditing || isSaving}
                                    />} 
                                    label={(displayData.is_active ?? true) ? "Active" : "Disabled"}
                                 />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                 {/* Toggle Edit/Cancel */} 
                 <Button onClick={handleEditToggle} disabled={isSaving}>
                    {isEditing ? 'Cancel' : 'Edit'}
                </Button>
                {/* Show Save only when editing, otherwise show Close */} 
                 {isEditing ? (
                     <Button 
                        onClick={handleSave} 
                        variant="contained"
                        disabled={isSaving} // Disable while saving
                    >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                 ) : (
                    <Button onClick={onClose}>Close</Button>
                 )}
            </DialogActions>
        </Dialog>
    );
};

export default ProductDetailModal; 