
import React, { useState } from 'react';
import { Order, Recipe, OrderPriority } from '../../types';
import { X, User, Phone, MapPin, Plus, Utensils, Trash2 } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';

export const OrderFormModal: React.FC<{ 
    recipes: Recipe[]; 
    initialData?: Order;
    onClose: () => void; 
    onSave: (order: any) => void 
}> = ({ recipes, initialData, onClose, onSave }) => {
    const [step, setStep] = useState(1); // 1: Details, 2: Items
    
    // Form State
    const [formData, setFormData] = useState({
        customerName: initialData?.customerName || '',
        customerPhone: initialData?.customerPhone || '',
        deliveryAddress: initialData?.deliveryAddress || '',
        priority: (initialData?.priority || 'normal') as OrderPriority,
        dueDate: initialData?.dueDate ? new Date(initialData.dueDate).toISOString().split('T')[0] : '',
        notes: initialData?.notes || '',
    });

    const [selectedItems, setSelectedItems] = useState<{recipeId: string, quantity: number, unitPrice: number}[]>(
        initialData ? initialData.items : []
    );

    // Item Adder State
    const [currentRecipeId, setCurrentRecipeId] = useState(recipes[0]?.id || '');
    const [currentQty, setCurrentQty] = useState(1);

    const addItem = () => {
        if (!currentRecipeId) return;
        const recipe = recipes.find(r => r.id === currentRecipeId);
        if(!recipe) return;
        
        // Calculate dynamic price based on recipe cost + margin (Mock logic)
        let estimatedCost = 0;
        recipe.ingredientSections.forEach(s => s.ingredients.forEach(i => estimatedCost += 0.5)); // Mock
        const price = Math.max(10, estimatedCost * 1.5); // Mock price

        const existingIdx = selectedItems.findIndex(i => i.recipeId === currentRecipeId);
        if (existingIdx >= 0) {
            const newItems = [...selectedItems];
            newItems[existingIdx].quantity += currentQty;
            setSelectedItems(newItems);
        } else {
            setSelectedItems([...selectedItems, { recipeId: currentRecipeId, quantity: currentQty, unitPrice: price }]);
        }
        setCurrentQty(1);
    };

    const removeItem = (index: number) => {
        const newItems = [...selectedItems];
        newItems.splice(index, 1);
        setSelectedItems(newItems);
    };

    const handleSubmit = () => {
        if (!formData.customerName || selectedItems.length === 0) return;
        
        const items = selectedItems.map(item => {
            const r = recipes.find(rec => rec.id === item.recipeId);
            return {
                recipeId: item.recipeId,
                recipeName: r?.name || 'Unknown Item',
                quantity: item.quantity,
                unitPrice: item.unitPrice
            };
        });

        // Calculate total
        const totalAmount = items.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0);

        onSave({ 
            ...formData, 
            dueDate: formData.dueDate ? new Date(formData.dueDate) : undefined,
            items,
            totalAmount 
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-app-card rounded-lg border border-app-border shadow-card overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-app-border flex justify-between items-center">
                    <h2 className="text-lg font-bold text-app-text">{initialData ? 'Edit Order' : 'New Order'}</h2>
                    <button onClick={onClose} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-app-muted/10 transition-colors"><X className="h-5 w-5 text-app-muted" /></button>
                </div>

                <div className="flex border-b border-app-border">
                    <button
                        onClick={() => setStep(1)}
                        className={cn("flex-1 py-3 text-sm font-semibold border-b-2 transition-colors", step === 1 ? "border-app-primary text-app-primary" : "border-transparent text-app-muted")}
                    >
                        Customer Details
                    </button>
                    <button
                        onClick={() => setStep(2)}
                        className={cn("flex-1 py-3 text-sm font-semibold border-b-2 transition-colors", step === 2 ? "border-app-primary text-app-primary" : "border-transparent text-app-muted")}
                    >
                        Order Items ({selectedItems.length})
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-app-muted mb-1.5 block">Customer Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                                    <input
                                        value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})}
                                        className="w-full min-h-[44px] pl-9 pr-3 rounded-md bg-app-elevated text-app-text border border-app-border focus:ring-2 focus:ring-app-primary placeholder:text-app-muted"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-app-muted mb-1.5 block">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                                    <input
                                        value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                                        className="w-full min-h-[44px] pl-9 pr-3 rounded-md bg-app-elevated text-app-text border border-app-border focus:ring-2 focus:ring-app-primary placeholder:text-app-muted"
                                        placeholder="(555) 000-0000"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-app-muted mb-1.5 block">Delivery Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                                    <input
                                        value={formData.deliveryAddress} onChange={e => setFormData({...formData, deliveryAddress: e.target.value})}
                                        className="w-full min-h-[44px] pl-9 pr-3 rounded-md bg-app-elevated text-app-text border border-app-border focus:ring-2 focus:ring-app-primary placeholder:text-app-muted"
                                        placeholder="123 Main St..."
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-app-muted mb-1.5 block">Priority</label>
                                    <select
                                        value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as OrderPriority})}
                                        className="w-full min-h-[44px] px-3 rounded-md bg-app-elevated text-app-text border border-app-border focus:ring-2 focus:ring-app-primary"
                                    >
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-app-muted mb-1.5 block">Due Date</label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})}
                                            className="w-full min-h-[44px] px-3 rounded-md bg-app-elevated text-app-text border border-app-border focus:ring-2 focus:ring-app-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-medium text-app-muted mb-1.5 block">Notes</label>
                                <textarea
                                    value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                                    className="w-full p-3 rounded-md bg-app-elevated text-app-text border border-app-border focus:ring-2 focus:ring-app-primary h-20 resize-none text-sm placeholder:text-app-muted"
                                    placeholder="Allergies, special requests..."
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                             <div className="p-4 bg-app-elevated rounded-md space-y-3">
                                <h3 className="text-xs font-medium text-app-muted">Add Item</h3>
                                <div className="flex gap-2">
                                     <select
                                        value={currentRecipeId} onChange={e => setCurrentRecipeId(e.target.value)}
                                        className="flex-1 min-h-[44px] px-3 rounded-md bg-app-card text-app-text border border-app-border text-sm focus:ring-2 focus:ring-app-primary"
                                     >
                                        {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                     </select>
                                     <input
                                        type="number" min="1" value={currentQty} onChange={e => setCurrentQty(parseInt(e.target.value))}
                                        className="w-16 min-h-[44px] px-2 rounded-md bg-app-card text-app-text border border-app-border text-center font-semibold focus:ring-2 focus:ring-app-primary"
                                     />
                                     <button onClick={addItem} aria-label="Add item" className="h-11 w-11 shrink-0 bg-app-primary text-primary-foreground rounded-full flex items-center justify-center hover:brightness-105 active:scale-[0.97] transition-all">
                                        <Plus className="h-5 w-5" />
                                     </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {selectedItems.length === 0 ? (
                                    <div className="text-center py-8 text-app-muted">
                                        <Utensils className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                        <p className="text-sm">No items added yet.</p>
                                    </div>
                                ) : (
                                    selectedItems.map((item, idx) => {
                                        const r = recipes.find(rec => rec.id === item.recipeId);
                                        return (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-app-elevated rounded-md border border-app-border">
                                                <div>
                                                    <div className="text-sm font-medium text-app-text">
                                                        <span className="font-semibold text-app-primary mr-2">{item.quantity}x</span>
                                                        {r?.name}
                                                    </div>
                                                    <div className="text-xs text-app-muted">{formatCurrency(item.unitPrice)} ea</div>
                                                </div>
                                                <button onClick={() => removeItem(idx)} aria-label="Remove item" className="flex h-9 w-9 items-center justify-center text-app-muted hover:text-app-danger hover:bg-app-danger/10 rounded-full transition-colors">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-app-border flex justify-between items-center gap-3">
                    {step === 2 && (
                         <button onClick={() => setStep(1)} className="min-h-[44px] px-4 rounded-md text-sm font-semibold text-app-muted hover:text-app-text hover:bg-app-muted/10 transition-colors">Back</button>
                    )}
                    {step === 1 ? (
                        <button onClick={() => setStep(2)} className="ml-auto min-h-[44px] px-6 bg-app-primary text-primary-foreground rounded-md font-semibold text-sm hover:brightness-105 active:scale-[0.97] shadow-soft transition-all">Next: Items</button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!formData.customerName || selectedItems.length === 0}
                            className="ml-auto min-h-[44px] px-6 bg-app-success text-white rounded-md font-semibold text-sm shadow-soft disabled:opacity-50 hover:brightness-105 active:scale-[0.97] transition-all"
                        >
                            {initialData ? 'Update Order' : 'Create Order'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
