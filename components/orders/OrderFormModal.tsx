
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
            <div className="w-full max-w-lg bg-card rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                    <h2 className="text-lg font-bold">{initialData ? 'Edit Order' : 'New Order'}</h2>
                    <button onClick={onClose}><X className="h-5 w-5 text-muted-foreground" /></button>
                </div>
                
                <div className="flex border-b border-border">
                    <button 
                        onClick={() => setStep(1)}
                        className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors", step === 1 ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
                    >
                        Customer Details
                    </button>
                    <button 
                        onClick={() => setStep(2)}
                        className={cn("flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors", step === 2 ? "border-primary text-primary" : "border-transparent text-muted-foreground")}
                    >
                        Order Items ({selectedItems.length})
                    </button>
                </div>

                <div className="p-4 overflow-y-auto flex-1">
                    {step === 1 ? (
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Customer Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input 
                                        value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-muted/20 border border-border focus:ring-1 focus:ring-primary"
                                        placeholder="e.g. John Doe"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input 
                                        value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-muted/20 border border-border focus:ring-1 focus:ring-primary"
                                        placeholder="(555) 000-0000"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Delivery Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <input 
                                        value={formData.deliveryAddress} onChange={e => setFormData({...formData, deliveryAddress: e.target.value})}
                                        className="w-full h-10 pl-9 pr-3 rounded-lg bg-muted/20 border border-border focus:ring-1 focus:ring-primary"
                                        placeholder="123 Main St..."
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Priority</label>
                                    <select 
                                        value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as OrderPriority})}
                                        className="w-full h-10 px-2 rounded-lg bg-muted/20 border border-border focus:ring-1 focus:ring-primary"
                                    >
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Due Date</label>
                                    <div className="relative">
                                        <input 
                                            type="date"
                                            value={formData.dueDate} onChange={e => setFormData({...formData, dueDate: e.target.value})}
                                            className="w-full h-10 px-3 rounded-lg bg-muted/20 border border-border focus:ring-1 focus:ring-primary"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Notes</label>
                                <textarea 
                                    value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}
                                    className="w-full p-3 rounded-lg bg-muted/20 border border-border focus:ring-1 focus:ring-primary h-20 resize-none text-sm"
                                    placeholder="Allergies, special requests..."
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                             <div className="p-3 bg-muted/30 rounded-xl space-y-3">
                                <h3 className="text-xs font-bold text-muted-foreground uppercase">Add Item</h3>
                                <div className="flex gap-2">
                                     <select 
                                        value={currentRecipeId} onChange={e => setCurrentRecipeId(e.target.value)}
                                        className="flex-1 h-10 px-2 rounded-lg bg-background border border-border text-sm"
                                     >
                                        {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                     </select>
                                     <input 
                                        type="number" min="1" value={currentQty} onChange={e => setCurrentQty(parseInt(e.target.value))}
                                        className="w-16 h-10 px-2 rounded-lg bg-background border border-border text-center font-bold"
                                     />
                                     <button onClick={addItem} className="h-10 w-10 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                                        <Plus className="h-5 w-5" />
                                     </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {selectedItems.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Utensils className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-sm">No items added yet.</p>
                                    </div>
                                ) : (
                                    selectedItems.map((item, idx) => {
                                        const r = recipes.find(rec => rec.id === item.recipeId);
                                        return (
                                            <div key={idx} className="flex justify-between items-center p-3 bg-muted/10 rounded-lg border border-border/50">
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        <span className="font-bold text-primary mr-2">{item.quantity}x</span> 
                                                        {r?.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">{formatCurrency(item.unitPrice)} ea</div>
                                                </div>
                                                <button onClick={() => removeItem(idx)} className="text-muted-foreground hover:text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors">
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

                <div className="p-4 border-t border-border bg-muted/30 flex justify-between gap-3">
                    {step === 2 && (
                         <button onClick={() => setStep(1)} className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground">Back</button>
                    )}
                    {step === 1 ? (
                        <button onClick={() => setStep(2)} className="ml-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold text-sm">Next: Items</button>
                    ) : (
                        <button 
                            onClick={handleSubmit} 
                            disabled={!formData.customerName || selectedItems.length === 0}
                            className="ml-auto px-6 py-2.5 bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-600/20 disabled:opacity-50 hover:bg-green-700"
                        >
                            {initialData ? 'Update Order' : 'Create Order'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
