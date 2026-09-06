import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import {
    Search, DollarSign, Utensils, Plus,
    LayoutDashboard, Clock, CheckCircle2,
    ShoppingBag, Box
} from 'lucide-react';
import { formatCurrency, cn, ANIMATION_VARIANTS } from '../lib/utils';
import { Order, OrderStatus } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { KitchenTicketModal } from '../components/orders/KitchenTicketModal';
import { InvoiceModal } from '../components/orders/InvoiceModal';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import OrderCard from '../components/orders/OrderCard';
import { Button, Chip } from '../components/ui/kit';
import { StickyToolbar } from '../components/ui/StickyToolbar';

const OrdersPage: React.FC = () => {
    const { orders, updateOrderStatus, addOrder, updateOrder, deleteOrder, recipes } = useData();
    const [searchParams, setSearchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') || "");
    const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>(() => {
        const s = searchParams.get('status');
        const valid: OrderStatus[] = ['pending_approval', 'approved', 'processing', 'completed', 'cancelled'];
        return s && (valid as string[]).includes(s) ? (s as OrderStatus) : 'all';
    });
    const [showOrderForm, setShowOrderForm] = useState(() => searchParams.get('new') === '1');

    // Consume deep-link params once so refreshes/back behave normally.
    useEffect(() => {
        if (searchParams.has('q') || searchParams.has('status') || searchParams.has('new')) {
            setSearchParams({}, { replace: true });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
    const [ticketOrder, setTicketOrder] = useState<Order | null>(null);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);

    const metrics = useMemo(() => ({
        pending: orders.filter(o => o.status === 'pending_approval').length,
        active: orders.filter(o => o.status === 'processing' || o.status === 'approved').length,
        revenue: orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0),
    }), [orders]);

    const filteredOrders = useMemo(() => {
        return orders
            .filter(order => {
                const matchesSearch = 
                    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                const priorityOrder = { high: 0, normal: 1, low: 2 };
                if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
    }, [orders, searchQuery, statusFilter]);

    const handleCreateOrder = useCallback((data: any) => {
        addOrder(data);
        setShowOrderForm(false);
    }, [addOrder]);

    const handleUpdateOrder = useCallback((data: any) => {
        if (editingOrder) {
            updateOrder(editingOrder.id, data);
            setEditingOrder(null);
        }
    }, [editingOrder, updateOrder]);

    return (
        <motion.div 
            initial="hidden" animate="visible" variants={ANIMATION_VARIANTS.container}
            className="space-y-2.5 pb-20 max-w-7xl mx-auto font-sans"
        >
            {/* Header */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 border-b border-app-border pb-4">
                <div className="flex items-center gap-2 min-w-0">
                    <div className="h-8 w-8 bg-app-primary/10 flex items-center justify-center shrink-0">
                        <ShoppingBag className="h-4 w-4 text-app-primary" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-xl font-bold tracking-tight text-app-text leading-tight">Orders</h1>
                        <p className="text-xs text-app-muted truncate">Manage and track your kitchen orders</p>
                    </div>
                </div>

                <Button onClick={() => setShowOrderForm(true)} icon={Plus} className="shrink-0">
                    Create Order
                </Button>
            </motion.div>

            {/* Metrics */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-3 gap-2 md:gap-2.5">
                {[
                    { label: 'Pending', val: metrics.pending, icon: Clock, color: 'text-app-warning', tint: 'bg-app-warning/15' },
                    { label: 'In Progress', val: metrics.active, icon: Utensils, color: 'text-app-primary', tint: 'bg-app-primary/10' },
                    { label: 'Revenue', val: formatCurrency(metrics.revenue).split('.')[0], icon: DollarSign, color: 'text-app-success', tint: 'bg-app-success/15' }
                ].map((m) => (
                    <div key={m.label} className="bg-app-card rounded-xl border border-app-border shadow-soft px-2.5 py-2 flex items-center gap-2.5">
                        <div className={cn("h-8 w-8 flex items-center justify-center shrink-0", m.tint)}>
                            <m.icon className={cn("h-4 w-4", m.color)} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[11px] text-app-muted font-medium leading-tight truncate">{m.label}</p>
                            <span className="text-lg font-bold tabular-nums text-app-text leading-tight">{m.val}</span>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* Controls */}
            <StickyToolbar innerClassName="flex flex-col lg:flex-row lg:items-center gap-2">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                        <input
                            placeholder="Search orders…"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 bg-app-elevated rounded-xl border border-app-border focus:outline-none focus-visible:ring-2 focus-visible:ring-app-primary/60 text-sm text-app-text transition-all placeholder:text-app-muted"
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
                        {[
                            { id: 'all', label: 'All', icon: LayoutDashboard },
                            { id: 'pending_approval', label: 'Pending', icon: Clock },
                            { id: 'processing', label: 'In Progress', icon: Utensils },
                            { id: 'completed', label: 'Completed', icon: CheckCircle2 }
                        ].map(tab => (
                            <Chip
                                key={tab.id}
                                active={statusFilter === tab.id}
                                onClick={() => setStatusFilter(tab.id as any)}
                                className="flex items-center gap-2"
                            >
                                <tab.icon className="h-4 w-4" /> {tab.label}
                            </Chip>
                        ))}
                    </div>
            </StickyToolbar>

            {/* Main Terminal Feed */}
            <div className="grid grid-cols-1 gap-2.5">
                <AnimatePresence mode="popLayout">
                    {filteredOrders.length > 0 ? (
                        filteredOrders.map(order => (
                            <OrderCard 
                                key={order.id} 
                                order={order} 
                                onStatusChange={updateOrderStatus}
                                onDelete={deleteOrder}
                                onEdit={(o) => setEditingOrder(o)}
                                onShowInvoice={setInvoiceOrder}
                                onShowTicket={setTicketOrder}
                                recipes={recipes}
                            />
                        ))
                    ) : (
                        <motion.div
                            key="empty"
                            variants={ANIMATION_VARIANTS.item}
                            className="flex flex-col items-center justify-center py-16 bg-app-card border border-dashed border-app-border rounded-lg"
                        >
                            <Box className="h-14 w-14 text-app-muted mb-2.5 stroke-1" />
                            <p className="text-sm text-app-muted font-medium">No orders yet</p>
                            <button onClick={() => {setSearchQuery(""); setStatusFilter("all");}} className="mt-5 text-sm font-semibold text-app-primary hover:underline">Reset filters</button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showOrderForm && <OrderFormModal recipes={recipes} onClose={() => setShowOrderForm(false)} onSave={handleCreateOrder} />}
                {editingOrder && <OrderFormModal recipes={recipes} initialData={editingOrder} onClose={() => setEditingOrder(null)} onSave={handleUpdateOrder} />}
                {invoiceOrder && <InvoiceModal order={invoiceOrder} onClose={() => setInvoiceOrder(null)} />}
                {ticketOrder && <KitchenTicketModal order={ticketOrder} onClose={() => setTicketOrder(null)} />}
            </AnimatePresence>
        </motion.div>
    );
};

export default OrdersPage;