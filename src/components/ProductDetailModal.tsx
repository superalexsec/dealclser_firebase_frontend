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
    DeleteForever as DeleteForeverIcon,
    AddPhotoAlternate as AddPhotoAlternateIcon,
} from '@mui/icons-material';
import { Product, Category, ProductUpdate, addProductImage, deleteProductImage } from '../lib/api'; // Import necessary types and new API functions
import { SelectChangeEvent } from '@mui/material/Select';
import { useMutation, useQueryClient } from '@tanstack/react-query'; // Import useMutation and useQueryClient
import { useAuth } from '../contexts/AuthContext'; // Import useAuth to get token

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
    onDelete: (productId: string) => void; // Add onDelete prop
}

const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ 
    open, 
    onClose, 
    product: initialProduct, // Rename to avoid conflict with local state
    categories, 
    onSave, 
    isSaving: isSavingTextData, // Rename for clarity
    saveError: textDataSaveError, // Rename for clarity
    onDelete: onDeleteProduct, // Rename for clarity
}) => {
    const { token } = useAuth(); // Get auth token
    const queryClient = useQueryClient(); // For cache updates

    const [isEditing, setIsEditing] = useState(false);
    const [editFormState, setEditFormState] = useState<Partial<ProductUpdate>>({});
    const [localError, setLocalError] = useState<string | null>(null);

    // Local state for the product, which can be updated by image operations
    const [currentProduct, setCurrentProduct] = useState<Product | null>(initialProduct);
    const [imageOpError, setImageOpError] = useState<string | null>(null); // For errors from image add/delete

    // Effect to reset local state when the initialProduct prop changes or dialog opens/closes
    useEffect(() => {
        setCurrentProduct(initialProduct);
        setImageOpError(null);
        if (initialProduct && open) {
            setIsEditing(false);
            setLocalError(null);
            setEditFormState({
                name: initialProduct.name || '',
                description: initialProduct.description || '',
                price: initialProduct.price || '',
                category_id: initialProduct.category_id || '',
                is_active: initialProduct.is_active ?? true,
            });
        } else if (!open) {
            setEditFormState({});
            setIsEditing(false);
            setLocalError(null);
        }
    }, [initialProduct, open]);

    // Mutation for Adding an Image
    const { mutate: addImageMutate, isPending: isAddingImage } = useMutation<Product, Error, { imageFile: File }>({
        mutationFn: ({ imageFile }) => {
            if (!currentProduct) throw new Error("Product context is lost for adding image.");
            return addProductImage(currentProduct.id, imageFile, token);
        },
        onSuccess: (updatedProductData) => {
            setCurrentProduct(updatedProductData);
            queryClient.invalidateQueries({ queryKey: ['products', token] });
            setImageOpError(null);
        },
        onError: (error: any) => {
            console.error("Error adding image:", error);
            setImageOpError(error.response?.data?.detail || error.message || "Failed to add image.");
        },
    });

    // Mutation for Deleting an Image
    const { mutate: deleteImageMutate, isPending: isDeletingImage } = useMutation<Product, Error, { imageUrl: string }>({
        mutationFn: ({ imageUrl }) => {
            if (!currentProduct) throw new Error("Product context is lost for deleting image.");
            return deleteProductImage(currentProduct.id, imageUrl, token);
        },
        onSuccess: (updatedProductData) => {
            setCurrentProduct(updatedProductData);
            queryClient.invalidateQueries({ queryKey: ['products', token] });
            setImageOpError(null);
        },
        onError: (error: any) => {
            console.error("Error deleting image:", error);
            setImageOpError(error.response?.data?.detail || error.message || "Failed to delete image.");
        },
    });

    const handleEditToggle = () => {
        const wasEditing = isEditing;
        setIsEditing(!isEditing);
        setLocalError(null); 
        setImageOpError(null);
        if (wasEditing && initialProduct) { 
             setCurrentProduct(initialProduct); 
             setEditFormState({
                name: initialProduct.name || '',
                description: initialProduct.description || '',
                price: initialProduct.price || '',
                category_id: initialProduct.category_id || '',
                is_active: initialProduct.is_active ?? true,
            });
        } else if (!isEditing && currentProduct) { 
             setEditFormState({ 
                name: currentProduct.name || '',
                description: currentProduct.description || '',
                price: currentProduct.price || '',
                category_id: currentProduct.category_id || '',
                is_active: currentProduct.is_active ?? true,
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

    const handleSaveTextChanges = async () => {
        setLocalError(null);
        if (!editFormState.name?.trim() || !editFormState.price?.toString().trim() || !editFormState.category_id) {
            setLocalError('Name, Price, and Category are required.');
            return;
        }
        if (isNaN(parseFloat(editFormState.price as string))) { 
            setLocalError('Please enter a valid number for Price (e.g., 10.99).');
            return;
        }
        const updateData: ProductUpdate = {
             name: editFormState.name.trim(),
             description: editFormState.description?.trim() || null,
             price: editFormState.price.toString().trim(), 
             category_id: editFormState.category_id,
             is_active: editFormState.is_active ?? true,
        };
        if (currentProduct) {
            try {
                await onSave(currentProduct.id, updateData);
            } catch (error) {
                 console.error("Error saving text data via onSave prop:", error);
            }
        } else {
            setLocalError("Cannot save, original product data is missing.");
        }
    };

    const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setImageOpError(null);
        if (!currentProduct) {
            setImageOpError("Product data not loaded, cannot add image.");
            return;
        }
        const files = event.target.files;
        if (files && files.length > 0) {
            const currentImageCount = currentProduct.image_urls?.length || 0;
            const availableSlots = 3 - currentImageCount;
            if (files.length > availableSlots) {
                setImageOpError(`Cannot upload ${files.length} images. Only ${availableSlots} slot(s) available (max 3 images).`);
                event.target.value = ''; 
                return;
            }
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) {
                    setImageOpError(`File "${file.name}" is not a valid image type.`);
                    continue; 
                }
                addImageMutate({ imageFile: file });
            }
            event.target.value = ''; 
        }
    };

    const handleDeleteImage = (imageUrlToDelete: string) => {
        setImageOpError(null);
        if (window.confirm("Are you sure you want to delete this image?")) {
            deleteImageMutate({ imageUrl: imageUrlToDelete });
        }
    };

    const handleFullProductDelete = () => {
        if (!currentProduct) return;
        if (window.confirm(`Are you sure you want to delete the product "${currentProduct.name}"? This action cannot be undone.`)) {
            onDeleteProduct(currentProduct.id);
        }
    };

    // Handle case where dialog is open but product is missing
    if (open && !currentProduct) {
         return (
             <Dialog open={open} onClose={onClose}>
                 <DialogTitle>Error</DialogTitle>
                 <DialogContent><Alert severity="error">Product data is not available.</Alert></DialogContent>
                 <DialogActions><Button onClick={onClose}>Close</Button></DialogActions>
             </Dialog>
         );
    }
    // If closed or product is loading, render nothing (or a loader if preferred)
    if (!open || !currentProduct) {
        return null; 
    }

    // Now we know product is not null, determine data source for display
    const displayData = isEditing ? editFormState : currentProduct;

    // Carousel settings (adjust as needed)
    const carouselSettings = {
        dots: true,
        infinite: currentProduct.image_urls && currentProduct.image_urls.length > 1, // Only loop if multiple images
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        adaptiveHeight: true // Adjust height to slide content
    };

    const isOverallSaving = isSavingTextData || isAddingImage || isDeletingImage;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                {isEditing ? 'Edit Product' : 'Product Details'}
                {isOverallSaving && <CircularProgress size={20} sx={{ ml: 2 }} />}
            </DialogTitle>
            <DialogContent dividers>
                {(localError || textDataSaveError || imageOpError) && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {localError || textDataSaveError || imageOpError}
                    </Alert>
                )}
                <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} md={isEditing ? 12 : 6}> 
                        {currentProduct.image_urls && currentProduct.image_urls.length > 0 ? (
                            <Box sx={{ mb: 2, '.slick-prev:before, .slick-next:before': { color: 'grey' } }}>
                                <Slider {...carouselSettings}>
                                    {currentProduct.image_urls.map((url, index) => (
                                        <Box key={index} component="div" sx={{ position: 'relative' }}>
                                            <Box 
                                                component="img"
                                                src={url}
                                                alt={`${currentProduct.name} - Image ${index + 1}`}
                                                sx={{ 
                                                    width: '100%', height: 'auto', maxHeight: '400px', 
                                                    objectFit: 'contain', display: 'block', margin: '0 auto'
                                                }}
                                            />
                                            {isEditing && (
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleDeleteImage(url)}
                                                    disabled={isDeletingImage || isAddingImage}
                                                    sx={{
                                                        position: 'absolute', top: 8, right: 8,
                                                        backgroundColor: 'rgba(255,255,255,0.7)',
                                                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.9)' }
                                                    }}
                                                >
                                                    <DeleteForeverIcon color="error" />
                                                </IconButton>
                                            )}
                                        </Box>
                                    ))}
                                </Slider>
                            </Box>
                        ) : (
                            <Box sx={{ height: 200, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'grey.200', borderRadius: 1, mb: 2 }}>
                                <Typography variant="caption" color="text.secondary">No Image Available</Typography>
                            </Box>
                        )}
                        {isEditing && (
                            <Box mt={2}>
                                <Button
                                    variant="outlined"
                                    component="label"
                                    startIcon={<AddPhotoAlternateIcon />}
                                    disabled={isAddingImage || isDeletingImage || (currentProduct.image_urls?.length || 0) >= 3}
                                >
                                    Add Image(s)
                                    <input
                                        type="file"
                                        hidden
                                        multiple
                                        accept="image/*"
                                        onChange={handleImageFileChange}
                                    />
                                </Button>
                                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                                    Max 3 images. {(currentProduct.image_urls?.length || 0)} currently uploaded.
                                </Typography>
                            </Box>
                        )}
                    </Grid>

                    {/* Details Section - Text Fields */}
                    <Grid item xs={12} md={isEditing ? 12 : 6}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    label="Product Name"
                                    fullWidth
                                    required
                                    value={displayData.name ?? ''}
                                    onChange={handleInputChange('name')}
                                    disabled={!isEditing || isOverallSaving}
                                    InputProps={{ readOnly: !isEditing }}
                                    variant={isEditing ? "outlined" : "standard"}
                                    error={isEditing && !!localError && !editFormState.name?.trim()}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                 <FormControl fullWidth required error={isEditing && !!localError && !editFormState.category_id} disabled={!isEditing || isOverallSaving}>
                                    <InputLabel id={`category-select-label-${currentProduct.id}`}>Category</InputLabel>
                                    <Select
                                        labelId={`category-select-label-${currentProduct.id}`}
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
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    label="Price"
                                    fullWidth
                                    required
                                    value={displayData.price ?? ''}
                                    onChange={handleInputChange('price')}
                                    disabled={!isEditing || isOverallSaving}
                                    InputProps={{ readOnly: !isEditing }}
                                    variant={isEditing ? "outlined" : "standard"}
                                    error={isEditing && !!localError && (!editFormState.price || isNaN(parseFloat(editFormState.price as string)))}
                                    helperText={isEditing && !!localError && (!editFormState.price || isNaN(parseFloat(editFormState.price as string))) ? 'Valid number required' : ''}
                                    type="text"
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    label="Description"
                                    fullWidth
                                    multiline
                                    rows={3}
                                    value={displayData.description ?? ''}
                                    onChange={handleInputChange('description')}
                                    disabled={!isEditing || isOverallSaving}
                                    InputProps={{ readOnly: !isEditing }}
                                    variant={isEditing ? "outlined" : "standard"}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <FormControlLabel 
                                    control={<Switch 
                                        checked={displayData.is_active ?? true} 
                                        onChange={handleActiveChange}
                                        disabled={!isEditing || isOverallSaving}
                                    />} 
                                    label={(displayData.is_active ?? true) ? "Active" : "Disabled"}
                                 />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions sx={{ padding: '16px 24px' }}>
                 <Button onClick={handleEditToggle} disabled={isOverallSaving}>
                    {isEditing ? 'Cancel' : 'Edit'}
                </Button>
                <Button color="error" variant="outlined" onClick={handleFullProductDelete} disabled={isOverallSaving || (isEditing && (isAddingImage || isDeletingImage))} sx={{ marginRight: 'auto' }}>
                    Delete Product
                </Button>
                 {isEditing ? (
                     <Button onClick={handleSaveTextChanges} variant="contained" disabled={isSavingTextData || isAddingImage || isDeletingImage}>
                        {isSavingTextData ? 'Saving Text...' : 'Save Text Changes'}
                    </Button>
                 ) : (
                    <Button onClick={onClose} disabled={isOverallSaving}>Close</Button>
                 )}
            </DialogActions>
        </Dialog>
    );
};

export default ProductDetailModal; 