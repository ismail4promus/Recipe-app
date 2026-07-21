import React, { useState, useMemo, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { 
    Search, DollarSign, Utensils, Plus, 
    LayoutDashboard, Clock, CheckCircle2, Terminal,
    Activity, ShoppingBag, Target, Box, Crosshair, Cpu
} from 'lucide-react';
import { formatCurrency, cn, ANIMATION_VARIANTS } from '../lib/utils';
import { Order, OrderStatus } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { KitchenTicketModal } from '../components/orders/KitchenTicketModal';
import { InvoiceModal } from '../components/orders/InvoiceModal';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import OrderCard from '../components/orders/OrderCard';

const OrdersPage: React.FC = () => {
    const { orders, updateOrderStatus, addOrder, updateOrder, deleteOrder, recipes } = useData();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
    const [showOrderForm, setShowOrderForm] = useState(false);
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
            className="space-y-8 pb-32 max-w-7xl mx-auto font-sans"
        >
            {/* Mission Directive Header - Dashboard Style */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 border-b border-app-border pb-8">
                <div>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-12 w-12 bg-app-primary/10 border border-app-primary/20 rounded-sm flex items-center justify-center">
                            <ShoppingBag className="h-7 w-7 text-app-primary emerald-glow" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-[0.05em] text-white uppercase italic leading-none">Directive Terminal</h1>
                            <div className="flex items-center gap-4 mt-3">
                                <div className="flex items-center gap-2">
                                    <span className="status-pulse bg-app-success shadow-[0_0_12px_#10b981]"></span>
                                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-app-success">Sync_Active</span>
                                </div>
                                <div className="h-4 w-px bg-white/5"></div>
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-app-muted flex items-center gap-2">
                                    <Cpu className="h-3 w-3" /> Grid_Encryption: AES_256
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setShowOrderForm(true)}
                    className="h-14 px-10 bg-app-primary text-white rounded-sm font-black text-[11px] uppercase tracking-[0.4em] flex items-center gap-4 shadow-2xl hover:brightness-110 active:scale-95 transition-all group"
                >
                    <Plus className="h-5 w-5 stroke-[3px] group-hover:rotate-90 transition-transform" /> Initialize Manifest
                </button>
            </motion.div>

            {/* Mission Telemetry Grid */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Pending_Queue', val: metrics.pending, icon: Clock, color: 'text-app-warning', sub: 'STBY_READY' },
                    { label: 'Operational_Firing', val: metrics.active, icon: Utensils, color: 'text-app-primary', sub: 'IN_EXECUTION' },
                    { label: 'Yield_Realized', val: formatCurrency(metrics.revenue).split('.')[0], icon: DollarSign, color: 'text-white', sub: 'GROSS_AUDIT' }
                ].map((m) => (
                    <div key={m.label} className="bg-app-card border border-app-border p-6 rounded-sm relative overflow-hidden group shadow-xl">
                        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-app-primary/20 to-transparent"></div>
                        <m.icon className="absolute -bottom-4 -right-4 h-16 w-16 text-white/[0.02] group-hover:scale-110 transition-transform" />
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <p className="tactical-label !text-[9px] mb-1">{m.label}</p>
                                <p className="text-[8px] font-black text-app-muted tracking-[0.25em] uppercase">{m.sub}</p>
                            </div>
                            <div className={cn("h-2 w-2 rounded-full", m.color.replace('text-', 'bg-'))}></div>
                        </div>
                        <span className={cn("text-3xl font-black tabular-nums tracking-tighter italic leading-none relative z-10", m.color)}>{m.val}</span>
                    </div>
                ))}
            </motion.div>

            {/* Control HUD Section */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="sticky top-14 md:top-16 z-30 py-2">
                <div className="bg-app-sidebar/80 backdrop-blur-xl border border-app-border p-2 rounded-sm flex flex-col lg:flex-row gap-3 shadow-2xl">
                    <div className="relative flex-grow">
                        <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted/50" />
                        <input 
                            placeholder="EXECUTE_MANIFEST_QUERY..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-12 pl-12 pr-4 rounded-sm bg-app-bg border border-app-border focus:ring-1 focus:ring-app-primary/40 text-[11px] font-black uppercase tracking-[0.2em] transition-all placeholder:text-app-muted/20"
                        />
                    </div>
                    
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
                        {[
                            { id: 'all', label: 'All', icon: LayoutDashboard },
                            { id: 'pending_approval', label: 'Queued', icon: Clock },
                            { id: 'processing', label: 'Firing', icon: Utensils },
                            { id: 'completed', label: 'Deployed', icon: CheckCircle2 }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-3 px-6 py-2 rounded-sm text-[9px] font-black uppercase tracking-[0.3em] whitespace-nowrap transition-all border",
                                    statusFilter === tab.id 
                                        ? "bg-app-primary text-white border-app-primary shadow-lg shadow-app-primary/20" 
                                        : "bg-app-bg border-app-border text-app-muted hover:text-app-text hover:bg-white/5"
                                )}
                            >
                                <tab.icon className="h-3.5 w-3.5" /> {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Main Terminal Feed */}
            <div className="grid grid-cols-1 gap-4">
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
                            className="flex flex-col items-center justify-center py-40 bg-app-card/10 border border-dashed border-app-border rounded-sm backdrop-blur-sm"
                        >
                            <Box className="h-16 w-16 text-app-muted/10 mb-6 stroke-1" />
                            <p className="tactical-label !text-[10px] opacity-40">System_Static: No Active Manifests Detected</p>
                            <button onClick={() => {setSearchQuery(""); setStatusFilter("all");}} className="mt-6 text-[9px] font-black text-app-primary uppercase tracking-[0.3em] hover:underline">Reset Core Query</button>
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