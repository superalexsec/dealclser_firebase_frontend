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
    CardMedia,
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

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            {/* Title depends on mode */} 
            <DialogTitle>{isEditing ? 'Edit Product' : 'Product Details'}</DialogTitle>
            <DialogContent dividers>
                {(localError || saveError) && (
                    <Alert severity="error" sx={{ mb: 2 }}>{localError || saveError}</Alert>
                )}
                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* Name */}
                    <Grid item xs={12}>
                        <TextField
                            label="Product Name"
                            fullWidth
                            required
                            // Use displayData, ensuring fallback for potentially partial editFormState
                            value={displayData.name ?? ''}
                            onChange={handleInputChange('name')}
                            disabled={!isEditing || isSaving}
                            InputProps={{ readOnly: !isEditing }}
                            variant={isEditing ? "outlined" : "standard"}
                            error={isEditing && !!localError && !editFormState.name?.trim()} // Validate against editFormState
                        />
                    </Grid>
                    {/* Category */}
                    <Grid item xs={12} sm={6}>
                         <FormControl fullWidth required error={isEditing && !!localError && !editFormState.category_id} disabled={!isEditing || isSaving}>
                            <InputLabel id={`category-select-label-${product.id}`}>Category</InputLabel>
                            <Select
                                labelId={`category-select-label-${product.id}`}
                                // Use displayData, ensuring fallback
                                value={displayData.category_id ?? ''}
                                label="Category"
                                onChange={handleCategoryChange}
                                variant={isEditing ? "outlined" : "standard"}
                                // Select doesn't have readOnly, rely on disabled
                                // inputProps={{ readOnly: !isEditing }} 
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
                            // Use displayData, ensuring fallback
                            value={displayData.price ?? ''}
                            onChange={handleInputChange('price')}
                            disabled={!isEditing || isSaving}
                            InputProps={{ readOnly: !isEditing }}
                            variant={isEditing ? "outlined" : "standard"}
                            error={isEditing && !!localError && (!editFormState.price || isNaN(parseFloat(editFormState.price)))} // Validate against editFormState
                            helperText={isEditing && !!localError && (!editFormState.price || isNaN(parseFloat(editFormState.price))) ? 'Valid number required' : ''}
                            type="text" // Price is text
                        />
                    </Grid>
                    {/* Description */}
                    <Grid item xs={12}>
                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            rows={3}
                            // Use displayData, ensuring fallback
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
                                // Use displayData, ensuring fallback and default
                                checked={displayData.is_active ?? true} 
                                onChange={handleActiveChange}
                                disabled={!isEditing || isSaving}
                            />} 
                            label={(displayData.is_active ?? true) ? "Active" : "Disabled"}
                         />
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