import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Alert
} from '@mui/material';
import { CategoryCreate } from '../lib/api'; // Adjust path as necessary

interface AddCategoryDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (categoryData: CategoryCreate) => Promise<void>; // Function to call on save
    isSaving: boolean; // Prop to indicate saving state
    saveError: string | null; // Prop to show save error
}

const AddCategoryDialog: React.FC<AddCategoryDialogProps> = ({ 
    open, 
    onClose, 
    onSave, 
    isSaving, 
    saveError 
}) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);

    // Reset form when dialog opens
    useEffect(() => {
        if (open) {
            setName('');
            setDescription('');
            setLocalError(null);
        }
    }, [open]);

    const handleSave = () => {
        if (!name.trim()) {
            setLocalError('Category name is required.');
            return;
        }
        setLocalError(null);
        const categoryData: CategoryCreate = {
            name: name.trim(),
            description: description.trim() || null,
        };
        onSave(categoryData); // Call the passed-in save function
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Add New Category</DialogTitle>
            <DialogContent dividers>
                {(localError || saveError) && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {localError || saveError}
                    </Alert>
                )}
                <Box component="form" noValidate autoComplete="off">
                    <TextField
                        autoFocus
                        required
                        margin="dense"
                        id="category-name"
                        label="Category Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isSaving}
                        error={!!localError}
                    />
                    <TextField
                        margin="dense"
                        id="category-description"
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
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={isSaving}>Cancel</Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    disabled={isSaving || !name.trim()}
                >
                    {isSaving ? 'Saving...' : 'Save Category'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AddCategoryDialog; 