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
import { SelectChangeEvent } from '@mui/material';

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
    const [editFormState, setEditFormState] = useState<ProductUpdate>({});
    const [localError, setLocalError] = useState<string | null>(null);

    // Reset form and editing state when product or open status changes
    useEffect(() => {
        if (product && open) {
            setIsEditing(false);
            setLocalError(null);
            // Initialize edit form state from the product prop
            setEditFormState({
                name: product.name || '',
                description: product.description || '',
                price: product.price ?? 0,
                stock: product.stock ?? 0,
                category_id: product.category_id || '',
                image_url: product.image_url || '',
                is_active: product.is_active ?? true, // Default to active if undefined
            });
        } else {
            setIsEditing(false); // Ensure editing is off if closed or no product
            setLocalError(null);
        }
    }, [product, open]);

    if (!product) return null;

    const handleEditToggle = () => {
        setIsEditing(!isEditing);
        setLocalError(null); // Clear errors when toggling edit mode
        // If cancelling edit, reset form state
        if (isEditing) {
             setEditFormState({
                name: product.name || '',
                description: product.description || '',
                price: product.price ?? 0,
                stock: product.stock ?? 0,
                category_id: product.category_id || '',
                image_url: product.image_url || '',
                is_active: product.is_active ?? true,
            });
        }
    };

    const handleInputChange = (field: keyof ProductUpdate) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const value = event.target.value;
        setEditFormState(prev => ({ ...prev, [field]: value }));
    };

    // Specific handler for Select component as its event structure is different
    const handleCategorySelectChange = (event: SelectChangeEvent<string>) => {
         setEditFormState(prev => ({ ...prev, category_id: event.target.value as string }));
    };

    const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newActiveState = event.target.checked;
        setEditFormState(prev => ({ ...prev, is_active: newActiveState }));
        // Trigger save immediately for the active toggle
        const updatePayload: ProductUpdate = { is_active: newActiveState };
        // No need to setIsEditing(false) here as the switch itself is the action
        onSave(product.id, updatePayload).catch((err) => {
             console.error("Failed to update active status:", err);
             // Optionally revert switch state if save fails
             setEditFormState(prev => ({ ...prev, is_active: !newActiveState }));
             setLocalError("Failed to update status. Please try again.");
        });
    };

    const handleSaveChanges = () => {
        // Basic validation
        const priceStr = String(editFormState.price);
        const stockStr = String(editFormState.stock);
        const price = parseFloat(priceStr);
        const stock = parseInt(stockStr, 10);

        if (!editFormState.name?.trim()) {
            setLocalError('Product name cannot be empty.');
            return;
        }
        if (!editFormState.category_id) {
            setLocalError('Category is required.');
            return;
        }
        // Check if the price string is empty or if parsing fails
        if (priceStr.trim() === '' || isNaN(price) || price < 0) {
            setLocalError('Valid price is required (e.g., 10.99).');
            return;
        }
        // Check if the stock string is empty or if parsing fails
        if (stockStr.trim() === '' || isNaN(stock) || stock < 0) {
            setLocalError('Valid stock is required (e.g., 5).');
            return;
        }

        setLocalError(null);
        
        const updatePayload: ProductUpdate = {
            name: editFormState.name.trim(),
            description: editFormState.description?.trim() || null,
            price: price, // Send parsed number
            stock: stock, // Send parsed number
            category_id: editFormState.category_id,
            image_url: editFormState.image_url?.trim() || null,
            is_active: editFormState.is_active ?? true, // Ensure is_active is included
        };
        
        onSave(product.id, updatePayload).then(() => {
            // Only turn off editing on successful save
             setIsEditing(false); 
        }).catch((err) => {
            // Error is handled by the saveError prop (passed from parent mutation)
            console.error("Save failed in modal:", err);
            // No need to set localError here, as saveError prop will display the message
        }); 
    };

    // Determine the category name for display
    const categoryName = categories.find(c => c.id === product.category_id)?.name || 'Unknown Category';

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {isEditing ? 'Edit Product' : 'Product Details'}
                <Box>
                     {/* Disable switch while saving or not in edit mode (unless just toggling active) */} 
                     <FormControlLabel 
                         control={<Switch 
                             checked={editFormState.is_active ?? true} 
                             onChange={handleSwitchChange} 
                             disabled={isSaving} 
                         />} 
                         label={editFormState.is_active ? "Active" : "Inactive"}
                         sx={{ mr: 1 }}
                     />
                     {/* Show Cancel/Edit icons */} 
                     <IconButton onClick={handleEditToggle} color="primary" disabled={isSaving}>
                         {isEditing ? <CancelIcon /> : <EditIcon />}
                     </IconButton>
                 </Box>
            </DialogTitle>
            <DialogContent dividers>
                {(localError || saveError) && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {localError || saveError}
                    </Alert>
                )}
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        {/* Image Display/Edit URL */} 
                        <CardMedia
                            component="img"
                            height="200"
                            image={isEditing ? editFormState.image_url || 'https://via.placeholder.com/200?text=No+Image' : product.image_url || 'https://via.placeholder.com/200?text=No+Image'}
                            alt={isEditing ? editFormState.name || '' : product.name}
                            sx={{ objectFit: 'contain', width: '100%', mb: isEditing ? 1 : 0 }}
                        />
                        {isEditing && (
                            <TextField
                                margin="dense"
                                label="Image URL"
                                type="url"
                                fullWidth
                                variant="outlined"
                                value={editFormState.image_url || ''}
                                onChange={handleInputChange('image_url')}
                                disabled={isSaving}
                            />
                        )}
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        {/* Name Display/Edit */} 
                        {isEditing ? (
                            <TextField
                                required
                                margin="dense"
                                label="Product Name"
                                fullWidth
                                variant="outlined"
                                value={editFormState.name || ''}
                                onChange={handleInputChange('name')}
                                disabled={isSaving}
                                error={!!localError && !editFormState.name?.trim()}
                            />
                        ) : (
                            <Typography variant="h5" gutterBottom>{product.name}</Typography>
                        )}

                        {/* Description Display/Edit */} 
                        {isEditing ? (
                            <TextField
                                margin="dense"
                                label="Description"
                                fullWidth
                                multiline
                                rows={3}
                                variant="outlined"
                                value={editFormState.description || ''}
                                onChange={handleInputChange('description')}
                                disabled={isSaving}
                            />
                        ) : (
                            <Typography variant="body1" paragraph>
                                {product.description || 'No description available.'}
                            </Typography>
                        )}

                        {/* Price/Stock Display/Edit */} 
                        <Box sx={{ mb: 1, mt: isEditing ? 1 : 0 }}>
                            {isEditing ? (
                                <Grid container spacing={1}>
                                    <Grid item xs={6}>
                                        <TextField
                                            required
                                            margin="dense"
                                            label="Price"
                                            type="number" // Keep type=number for browser validation hints
                                            fullWidth
                                            variant="outlined"
                                            value={editFormState.price ?? ''} // Use state value directly
                                            onChange={handleInputChange('price')} // Let state handle it
                                            InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                                            disabled={isSaving}
                                            error={!!localError && (String(editFormState.price ?? '').trim() === '' || isNaN(parseFloat(String(editFormState.price))) || parseFloat(String(editFormState.price)) < 0)}
                                            helperText={!!localError && (String(editFormState.price ?? '').trim() === '' || isNaN(parseFloat(String(editFormState.price))) || parseFloat(String(editFormState.price)) < 0) ? "Valid price required" : ""}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField
                                            required
                                            margin="dense"
                                            label="Stock"
                                            type="number" // Keep type=number
                                            fullWidth
                                            variant="outlined"
                                            value={editFormState.stock ?? ''} // Use state value
                                            onChange={handleInputChange('stock')}
                                            InputProps={{ inputProps: { min: 0, step: "1" } }}
                                            disabled={isSaving}
                                            error={!!localError && (String(editFormState.stock ?? '').trim() === '' || isNaN(parseInt(String(editFormState.stock), 10)) || parseInt(String(editFormState.stock), 10) < 0)}
                                            helperText={!!localError && (String(editFormState.stock ?? '').trim() === '' || isNaN(parseInt(String(editFormState.stock), 10)) || parseInt(String(editFormState.stock), 10) < 0) ? "Valid stock required" : ""}
                                        />
                                    </Grid>
                                </Grid>
                            ) : (
                                <>
                                    <Chip label={`Price: ${product.price.toFixed(2)}`} size="small" color="success" sx={{ mr: 1 }} />
                                    <Chip label={`Stock: ${product.stock}`} size="small" color={product.stock > 0 ? "info" : "warning"} />
                                </>
                            )}
                        </Box>

                        {/* Category Display/Select */} 
                        {isEditing ? (
                            <FormControl fullWidth required margin="dense" error={!!localError && !editFormState.category_id} disabled={isSaving}>
                                <InputLabel id="edit-category-select-label">Category</InputLabel>
                                <Select
                                    labelId="edit-category-select-label"
                                    value={editFormState.category_id || ''}
                                    label="Category"
                                    onChange={handleCategorySelectChange} // Use specific handler
                                >
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                    ))}
                                </Select>
                                {!!localError && !editFormState.category_id && <FormHelperText>Category is required.</FormHelperText>}
                            </FormControl>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                Category: {categoryName}
                            </Typography>
                        )}

                         {/* Display Active Status (non-editable view) */} 
                         {!isEditing && (
                             <Typography variant="body2" sx={{ mt: 1, color: product.is_active ? 'success.main' : 'text.secondary' }}>
                                 Status: {product.is_active ? 'Active' : 'Inactive'}
                             </Typography>
                         )}

                    </Grid>{/* End sm={8} Grid */}
                </Grid>{/* End container Grid */}
            </DialogContent>
            <DialogActions>
                {isEditing ? (
                    <>
                        <Button onClick={handleEditToggle} disabled={isSaving}>Cancel</Button>
                        <Button 
                            onClick={handleSaveChanges} 
                            variant="contained" 
                            disabled={isSaving} 
                            startIcon={isSaving ? <CircularProgress size={20}/> : <SaveIcon />}
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </>
                ) : (
                    <Button onClick={onClose}>Close</Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ProductDetailModal; 