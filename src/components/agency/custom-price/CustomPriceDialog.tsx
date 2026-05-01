import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CustomPriceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    portalName: string;
    initialPrice?: number;
    onSave: (price: number, note: string) => Promise<void>;
    isSaving: boolean;
}

export default function CustomPriceDialog({
    isOpen,
    onClose,
    portalName,
    initialPrice,
    onSave,
    isSaving,
}: CustomPriceDialogProps) {
    const [priceInput, setPriceInput] = useState('');
    const [noteInput, setNoteInput] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPriceInput(initialPrice?.toString() || '');
            setNoteInput('');
        }
    }, [isOpen, initialPrice]);

    const handleSave = async () => {
        const price = parseFloat(priceInput);
        if (isNaN(price) || price < 0) {
            toast.error('Please enter a valid price');
            return;
        }
        await onSave(price, noteInput);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {initialPrice !== undefined ? 'Edit' : 'Set'} Custom Price
                    </DialogTitle>
                    <DialogDescription>
                        {portalName}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="price">Price (€)</Label>
                        <Input
                            id="price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="note">Note (optional)</Label>
                        <Input
                            id="note"
                            placeholder="Add a note about this price change..."
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Price
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
