
import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '../components/ui/Card';
import { formatCurrency } from '../lib/utils';
import { OrderItem } from '../types';
import { ShoppingCart, MinusCircle, PlusCircle, PartyPopper } from 'lucide-react';

const CustomerOrderFormPage: React.FC = () => {
    const { recipes, addOrder } = useData();
    const [cart, setCart] = useState<Record<string, number>>({});
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleQuantityChange = (recipeId: string, delta: number) => {
        setCart(prev => {
            const newQuantity = (prev[recipeId] || 0) + delta;
            if (newQuantity <= 0) {
                const { [recipeId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [recipeId]: newQuantity };
        });
    };

    const getSalePrice = (recipeId: string) => {
        const recipe = recipes.find(r => r.id === recipeId);
        if(!recipe) return 0;
        // Mock logic for sale price
        return 12.50 + recipe.name.length % 5;
    };

    const cartItems = Object.entries(cart).map(([recipeId, quantity]) => {
        const recipe = recipes.find(r => r.id === recipeId);
        return {
            ...recipe!,
            quantity,
            unitPrice: getSalePrice(recipeId)
        };
    });

    const totalAmount = cartItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (cartItems.length === 0 || !customerName) {
            alert('Please add items to your cart and enter your name.');
            return;
        }

        const orderItems: OrderItem[] = cartItems.map(item => ({
            recipeId: item.id,
            recipeName: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
        }));

        addOrder({ 
            customerName, 
            customerPhone,
            items: orderItems,
            priority: 'normal' // Default for customer orders
        });
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
                <Card className="w-full max-w-md text-center rounded-2xl bg-app-card border border-app-border shadow-soft">
                    <CardHeader>
                        <div className="mx-auto bg-app-success/10 rounded-full p-3 w-fit">
                            <PartyPopper className="h-10 w-10 text-app-success" />
                        </div>
                        <CardTitle className="text-2xl tracking-tight">Order Submitted!</CardTitle>
                        <CardDescription className="text-app-muted">Thank you for your order. We will process it shortly.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-app-text">Your order will be reviewed and you'll be notified upon approval.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-app-bg flex justify-center p-4">
            <div className="w-full max-w-4xl space-y-6">
                <h1 className="text-4xl font-bold tracking-tight text-center text-app-text">Place Your Order</h1>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-4">
                        {recipes.map(recipe => (
                            <Card key={recipe.id} className="flex items-center overflow-hidden rounded-2xl bg-app-card border border-app-border shadow-soft">
                                <div className="w-24 h-24 bg-app-elevated shrink-0">
                                    <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-full object-cover" />
                                </div>
                                <CardContent className="p-4 flex-grow">
                                    <h3 className="font-semibold text-app-text">{recipe.name}</h3>
                                    <p className="text-sm text-app-muted">{recipe.cuisine}</p>
                                    <p className="font-bold text-app-primary mt-1">{formatCurrency(getSalePrice(recipe.id))}</p>
                                </CardContent>
                                <CardFooter className="p-4">
                                    <div className="flex items-center gap-2">
                                        <button aria-label="Remove one" onClick={() => handleQuantityChange(recipe.id, -1)}><MinusCircle className="h-6 w-6 text-app-danger" /></button>
                                        <span className="w-8 text-center font-bold text-app-text">{cart[recipe.id] || 0}</span>
                                        <button aria-label="Add one" onClick={() => handleQuantityChange(recipe.id, 1)}><PlusCircle className="h-6 w-6 text-app-success" /></button>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>

                    <div className="md:col-span-1">
                        <Card className="sticky top-4 rounded-2xl bg-app-card border border-app-border shadow-soft">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-app-text"><ShoppingCart /> Your Cart</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {cartItems.length > 0 ? (
                                    <div className="space-y-2">
                                        {cartItems.map(item => (
                                            <div key={item.id} className="flex justify-between text-sm text-app-text">
                                                <span>{item.quantity} x {item.name}</span>
                                                <span>{formatCurrency(item.quantity * item.unitPrice)}</span>
                                            </div>
                                        ))}
                                        <hr className="my-2 border-app-border" />
                                        <div className="flex justify-between font-bold text-app-text">
                                            <span>Total</span>
                                            <span>{formatCurrency(totalAmount)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-app-muted">Your cart is empty.</p>
                                )}
                            </CardContent>
                            <CardFooter>
                                <form onSubmit={handleSubmit} className="w-full space-y-4">
                                    <input
                                        type="text"
                                        placeholder="Your Name"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                        required
                                        className="w-full p-3 bg-app-bg text-app-text border border-app-border rounded-full outline-none focus:ring-2 focus:ring-app-primary placeholder:text-app-muted"
                                    />
                                    <input
                                        type="tel"
                                        placeholder="Phone Number"
                                        value={customerPhone}
                                        onChange={e => setCustomerPhone(e.target.value)}
                                        className="w-full p-3 bg-app-bg text-app-text border border-app-border rounded-full outline-none focus:ring-2 focus:ring-app-primary placeholder:text-app-muted"
                                    />
                                    <button type="submit" className="w-full min-h-[44px] bg-app-primary text-primary-foreground rounded-full font-semibold hover:brightness-105 transition-all disabled:opacity-50" disabled={cartItems.length === 0 || !customerName}>
                                        Place Order
                                    </button>
                                </form>
                            </CardFooter>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerOrderFormPage;
