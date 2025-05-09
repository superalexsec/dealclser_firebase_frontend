import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Typography,
    Alert,
    Box,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { Category } from '../lib/api'; // Corrected path

interface ManageCategoriesDialogProps {
    open: boolean;
    onClose: () => void;
    categories: Category[];
    onDeleteCategory: (categoryId: string) => void; // Callback to trigger deletion mutation
    isDeletingCategory: boolean;
    deleteCategoryError: string | null;
}

const ManageCategoriesDialog: React.FC<ManageCategoriesDialogProps> = ({
    open,
    onClose,
    categories,
    onDeleteCategory,
    isDeletingCategory,
    deleteCategoryError,
}) => {

    const handleDelete = (categoryId: string, categoryName: string) => {
        // You might want to check if category is in use by any products here
        // This would require fetching all products and checking their category_id
        // For simplicity, we'll just confirm deletion for now.
        if (window.confirm(`Are you sure you want to delete the category "${categoryName}"? This might affect products associated with it.`)) {
            onDeleteCategory(categoryId);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Manage Categories</DialogTitle>
            <DialogContent dividers>
                {deleteCategoryError && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {deleteCategoryError}
                    </Alert>
                )}
                {categories.length === 0 ? (
                    <Typography sx={{ p: 2, textAlign: 'center' }}>No categories found.</Typography>
                ) : (
                    <List>
                        {categories.map((category) => (
                            <ListItem key={category.id} divider>
                                <ListItemText 
                                    primary={category.name} 
                                    secondary={category.description || 'No description'}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton 
                                        edge="end" 
                                        aria-label="delete"
                                        onClick={() => handleDelete(category.id, category.name)}
                                        disabled={isDeletingCategory}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" disabled={isDeletingCategory}>
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ManageCategoriesDialog; 