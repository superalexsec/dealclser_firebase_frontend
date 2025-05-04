import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Alert,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText
} from '@mui/material';
import { ProductCreate, Category } from '../lib/api'; // Adjust path as necessary

interface AddProductDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (productData: ProductCreate) => Promise<void>; // Function to call on save
    isSaving: boolean; // Prop to indicate saving state
    saveError: string | null; // Prop to show save error
    categories: Category[]; // List of categories for dropdown
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({ 
    open, 
    onClose, 
    onSave, 
    isSaving, 
    saveError, 
    categories
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState<string>('');
    const [stock, setStock] = useState<string>('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [imageUrl, setImageUrl] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setName('');
            setDescription('');
            setPrice('');
            setStock('');
            setSelectedCategoryId('');
            setImageUrl('');
            setLocalError(null);
        }
    }, [open]);

    const handleSave = () => {
        const parsedPrice = parseFloat(price);
        const parsedStock = parseInt(stock, 10);

        if (!name.trim()) {
            setLocalError('Product name is required.');
            return;
        }
        if (!selectedCategoryId) {
            setLocalError('Category is required.');
            return;
        }
         if (isNaN(parsedPrice) || parsedPrice < 0) {
            setLocalError('Valid price is required (e.g., 10.99).');
            return;
        }
        if (isNaN(parsedStock) || parsedStock < 0) {
            setLocalError('Valid stock quantity is required (e.g., 5).');
            return;
        }

        setLocalError(null);
        const productData: ProductCreate = {
            name: name.trim(),
            description: description.trim() || null,
            price: parsedPrice,
            stock: parsedStock,
            category_id: selectedCategoryId,
            image_url: imageUrl.trim() || null,
        };
        onSave(productData); // Call the passed-in save function
    };

    const isSaveDisabled = isSaving 
        || !name.trim() 
        || !selectedCategoryId 
        || !price 
        || !stock
        || isNaN(parseFloat(price))
        || isNaN(parseInt(stock, 10));

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogContent dividers>
                {(localError || saveError) && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {localError || saveError}
                    </Alert>
                )}
                <Box component="form" noValidate autoComplete="off">
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                autoFocus
                                required
                                margin="dense"
                                label="Product Name"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isSaving}
                                error={!!localError && !name.trim()} // Show error if name is required but empty
                            />
                        </Grid>
                         <Grid item xs={12} sm={6}>
                             <FormControl fullWidth required margin="dense" error={!!localError && !selectedCategoryId} disabled={isSaving}>
                                <InputLabel id="category-select-label">Category</InputLabel>
                                <Select
                                    labelId="category-select-label"
                                    value={selectedCategoryId}
                                    label="Category"
                                    onChange={(e) => setSelectedCategoryId(e.target.value as string)}
                                >
                                    {categories.length === 0 && <MenuItem disabled>No categories available</MenuItem>}
                                    {categories.map((cat) => (
                                        <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                                    ))}
                                </Select>
                                {!!localError && !selectedCategoryId && <FormHelperText>Please select a category.</FormHelperText>}
                            </FormControl>
                        </Grid>
                         <Grid item xs={12} sm={6}>
                             <TextField
                                required
                                margin="dense"
                                label="Price (e.g., 10.99)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                InputProps={{ inputProps: { min: 0, step: "0.01" } }} // Helps with number input
                                disabled={isSaving}
                                error={!!localError && (isNaN(parseFloat(price)) || parseFloat(price) < 0)} // Validate price
                            />
                        </Grid>
                         <Grid item xs={12} sm={6}>
                             <TextField
                                required
                                margin="dense"
                                label="Stock Quantity (e.g., 5)"
                                type="number"
                                fullWidth
                                variant="outlined"
                                value={stock}
                                onChange={(e) => setStock(e.target.value)}
                                InputProps={{ inputProps: { min: 0, step: "1" } }} // Integer input
                                disabled={isSaving}
                                error={!!localError && (isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0)} // Validate stock
                            />
                        </Grid>
                         <Grid item xs={12}>
                            <TextField
                                margin="dense"
                                label="Description (Optional)"
                                type="text"
                                fullWidth
                                multiline
                                rows={3}
                                variant="outlined"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isSaving}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                margin="dense"
                                label="Image URL (Optional)"
                                type="url"
                                fullWidth
                                variant="outlined"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                disabled={isSaving}
                            />
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    disabled={isSaveDisabled} // Use combined disabled state
                >
                    {isSaving ? 'Saving...' : 'Save Product'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddProductDialog; 