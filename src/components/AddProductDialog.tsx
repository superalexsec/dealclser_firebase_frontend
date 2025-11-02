import React, { useState, useEffect, useCallback, ChangeEvent } from 'react';
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
    FormHelperText,
    Typography,
    IconButton,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Paper,
    LinearProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { UploadFile as UploadFileIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { ProductCreate, Category } from '../lib/api'; // Adjust path as necessary

// Define the structure for the onSave prop including files
interface ProductSaveData extends ProductCreate {
    files?: File[];
}

interface AddProductDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (productSaveData: ProductSaveData) => Promise<void>;
    isSaving: boolean;
    saveError: string | null;
    categories: Category[];
}

// Styled component for the file input area
const FileInputArea = styled(Paper)(({ theme }) => ({
    border: `2px dashed ${theme.palette.divider}`,
    padding: theme.spacing(2),
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.action.hover,
    '&:hover': {
        backgroundColor: theme.palette.action.selected,
    },
}));

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
    const [price, setPrice] = useState('');
    const [sku, setSku] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [localError, setLocalError] = useState<string | null>(null);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setName('');
            setDescription('');
            setPrice('');
            setSku('');
            setIsActive(true);
            setSelectedCategoryId(categories.length > 0 ? categories[0].id : '');
            setSelectedFiles([]);
            setLocalError(null);
        }
    }, [open, categories]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        setLocalError(null);
        if (event.target.files) {
            const files = Array.from(event.target.files);
            const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
            const invalidFiles = files.filter(file => !validImageTypes.includes(file.type));
            if (invalidFiles.length > 0) {
                setLocalError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Please upload images only.`);
                return;
            }
            if (selectedFiles.length + files.length > 4) {
                setLocalError('You can upload a maximum of 4 images.');
                return;
            }
            setSelectedFiles(prevFiles => [...prevFiles, ...files]);
        }
        event.target.value = '';
    };

    const handleRemoveFile = (index: number) => {
        setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    };

    const handleSave = () => {
        setLocalError(null);
        if (!name.trim() || !price.toString().trim() || !selectedCategoryId) {
            setLocalError('Name, Price, and Category are required.');
            return;
        }
        const parsedPrice = parseFloat(price);
        if (isNaN(parsedPrice) || parsedPrice < 0) {
            setLocalError('Please enter a valid positive number for Price.');
            return;
        }
        const productData: ProductCreate = {
            name: name.trim(),
            description: description.trim() || undefined,
            price: price.trim(),
            category_id: selectedCategoryId,
            sku: sku.trim() || undefined,
            is_active: isActive,
        };
        const saveData: ProductSaveData = {
            ...productData,
            files: selectedFiles.length > 0 ? selectedFiles : undefined,
        };
        onSave(saveData);
    };

    const isSaveDisabled = isSaving 
        || !name.trim() 
        || !selectedCategoryId 
        || !price
        || isNaN(parseFloat(price))
        || parseFloat(price) < 0;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Add New Product</DialogTitle>
            {isSaving && <LinearProgress sx={{ width: '100%' }} />}
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
                                error={!!localError && !name.trim()}
                                helperText={localError && !name.trim() ? "Name is required" : ""}
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
                                    {categories.length === 0 && <MenuItem disabled>Loading or no categories...</MenuItem>}
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
                                disabled={isSaving}
                                error={!!localError && (isNaN(parseFloat(price)) || parseFloat(price) < 0)}
                                helperText={localError && (isNaN(parseFloat(price)) || parseFloat(price) < 0) ? "Valid positive price required" : ""}
                                InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                            />
                        </Grid>
                         <Grid item xs={12} sm={6}>
                             <TextField
                                margin="dense"
                                label="SKU (Optional)"
                                type="text"
                                fullWidth
                                variant="outlined"
                                value={sku}
                                onChange={(e) => setSku(e.target.value)}
                                disabled={isSaving}
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

                        {/* File Input Section */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>Upload Images (Max 4)</Typography>
                            <input
                                accept="image/png, image/jpeg, image/gif, image/webp"
                                style={{ display: 'none' }}
                                id="product-image-upload"
                                multiple
                                type="file"
                                onChange={handleFileChange}
                                disabled={isSaving || selectedFiles.length >= 4}
                            />
                            <label htmlFor="product-image-upload">
                                <FileInputArea>
                                    <UploadFileIcon sx={{ mr: 1 }} />
                                    <Typography variant="body2">
                                        {selectedFiles.length >= 4 
                                            ? "Maximum 4 files selected" 
                                            : "Click or Drag & Drop to Upload"}
                                    </Typography>
                                </FileInputArea>
                            </label>
                            {selectedFiles.length > 0 && (
                                <List dense>
                                    {selectedFiles.map((file, index) => (
                                        <ListItem key={index}>
                                            <ListItemText 
                                                primary={file.name} 
                                                secondary={`${(file.size / 1024).toFixed(2)} KB`}
                                            />
                                            <ListItemSecondaryAction>
                                                <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveFile(index)} disabled={isSaving}>
                                                    <DeleteIcon />
                                                </IconButton>
                                            </ListItemSecondaryAction>
                                        </ListItem>
                                    ))}
                                </List>
                            )}
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    disabled={isSaveDisabled}
                >
                    {isSaving ? 'Saving Product...' : 'Save Product'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddProductDialog; 