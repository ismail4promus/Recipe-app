import React, { useState } from 'react';
import { Order, OrderStatus, Recipe } from '../../types';
import { formatCurrency, cn, ANIMATION_VARIANTS } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, ChevronDown, MapPin, StickyNote,
    FileText, Printer, CheckCircle2, Edit, Trash2, ChefHat,
    Clock, User, Zap, PackageCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from './OrderBadges';
import { Button } from '../ui/kit';

interface OrderCardProps {
    order: Order;
    onStatusChange: (id: string, status: OrderStatus) => void;
    onDelete: (id: string) => void;
    onEdit: (order: Order) => void;
    onShowInvoice: (order: Order) => void;
    onShowTicket: (order: Order) => void;
    recipes: Recipe[];
}

const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' });
};

const OrderCard: React.FC<OrderCardProps> = React.memo(({ order, onStatusChange, onDelete, onEdit, onShowInvoice, onShowTicket, recipes }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const navigate = useNavigate();

    const handleCook = (recipeId: string, quantity: number) => {
        const recipe = recipes.find(r => r.id === recipeId);
        const totalServings = (recipe?.servings || 1) * quantity;
        navigate(`/recipes/${recipeId}/cook?servings=${totalServings}`);
    };

    const isUrgent = order.priority === 'high' && order.status !== 'completed';

    return (
        <motion.div
            layout
            variants={ANIMATION_VARIANTS.item}
            className={cn(
                "bg-app-card border border-app-border rounded-lg overflow-hidden transition-all duration-300 shadow-soft group",
                isExpanded ? "border-app-primary/40" : "hover:border-app-primary/30",
                isUrgent && "border-app-danger/40"
            )}
        >
            <div
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2.5 md:p-2.5 flex items-center justify-between gap-2.5 cursor-pointer hover:bg-app-muted/10 transition-colors"
            >
                <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                        "h-12 w-12 rounded-lg flex items-center justify-center text-base font-semibold shrink-0 transition-all",
                        isUrgent ? "bg-app-danger/15 text-app-danger" : "bg-app-elevated text-app-muted group-hover:text-app-primary"
                    )}>
                        {order.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-app-text text-sm truncate">{order.customerName}</h3>
                            <PriorityBadge priority={order.priority} />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-app-muted">
                            <span className="tabular-nums">{order.orderNumber}</span>
                            <span className="opacity-40">·</span>
                            <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {getRelativeTime(order.createdAt)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                    <div className="hidden lg:flex flex-col items-end gap-1.5">
                        <StatusBadge status={order.status} />
                        {order.dueDate && (
                             <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-app-elevated text-[11px] text-app-muted tabular-nums">
                                <Calendar className="h-3 w-3" />
                                {new Date(order.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                             </div>
                        )}
                    </div>
                    <div className="text-right border-l border-app-border pl-5">
                        <p className="font-bold text-lg text-app-text tabular-nums leading-none">{formatCurrency(order.totalAmount).split('.')[0]}</p>
                        <p className="text-xs text-app-muted mt-1">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 text-app-muted transition-transform duration-300", isExpanded && "rotate-180 text-app-primary")} />
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="border-t border-app-border overflow-hidden"
                    >
                        <div className="p-2.5 md:p-3 space-y-3">
                            {/* Info Panel */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="bg-app-elevated p-2.5 rounded-md flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-md bg-app-primary/10 flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-app-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-app-muted font-medium mb-1">Customer</p>
                                        <p className="text-sm font-semibold text-app-text truncate">{order.customerName}</p>
                                        {order.customerPhone && <p className="text-xs text-app-muted tabular-nums mt-0.5">{order.customerPhone}</p>}
                                    </div>
                                </div>
                                <div className="bg-app-elevated p-2.5 rounded-md flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-md bg-app-success/15 flex items-center justify-center shrink-0">
                                        <MapPin className="h-4 w-4 text-app-success" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-app-muted font-medium mb-1">Delivery</p>
                                        <p className="text-sm font-medium text-app-text truncate">{order.deliveryAddress || "Pickup"}</p>
                                    </div>
                                </div>
                                <div className="bg-app-elevated p-2.5 rounded-md flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-md bg-app-warning/15 flex items-center justify-center shrink-0">
                                        <StickyNote className="h-4 w-4 text-app-warning" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs text-app-muted font-medium mb-1">Notes</p>
                                        <p className="text-sm text-app-muted line-clamp-2 leading-relaxed">{order.notes || "No special instructions"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <h4 className="text-xs text-app-muted font-medium">Items</h4>
                                    <div className="h-px flex-1 bg-app-border"></div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2.5 bg-app-elevated rounded-md hover:bg-app-muted/10 transition-all">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-10 w-10 rounded-md bg-app-primary/10 flex items-center justify-center font-bold text-lg text-app-primary tabular-nums shrink-0">
                                                    {item.quantity}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-app-text truncate">{item.recipeName}</p>
                                                    <p className="text-xs text-app-muted tabular-nums mt-0.5">{formatCurrency(item.unitPrice)} each</p>
                                                </div>
                                            </div>
                                            {(order.status === 'approved' || order.status === 'processing') && (
                                                <Button
                                                    onClick={(e) => { e.stopPropagation(); handleCook(item.recipeId, item.quantity); }}
                                                    icon={Zap}
                                                    className="min-h-[40px] px-4 text-xs shrink-0"
                                                >
                                                    Start Cooking
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 pt-5 border-t border-app-border">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); onShowInvoice(order); }} className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-4 text-sm font-semibold bg-app-elevated text-app-text hover:bg-app-muted/15 transition-all">
                                        <FileText className="h-4 w-4 text-app-primary" /> Invoice
                                    </button>
                                    {(order.status === 'approved' || order.status === 'processing') && (
                                         <button onClick={(e) => { e.stopPropagation(); onShowTicket(order); }} className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-4 text-sm font-semibold bg-app-elevated text-app-text hover:bg-app-muted/15 transition-all">
                                            <Printer className="h-4 w-4 text-app-success" /> Ticket
                                        </button>
                                    )}
                                    {order.status === 'pending_approval' && (
                                        <button onClick={(e) => { e.stopPropagation(); onEdit(order); }} className="inline-flex min-h-[44px] items-center gap-2 rounded-md px-4 text-sm font-semibold bg-app-elevated text-app-text hover:bg-app-muted/15 transition-all">
                                            <Edit className="h-4 w-4 text-app-warning" /> Edit
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-2">
                                    {order.status === 'pending_approval' && (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); onDelete(order.id); }} className="flex h-11 w-11 items-center justify-center text-app-danger hover:bg-app-danger/10 rounded-full transition-all">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                            <Button onClick={(e) => { e.stopPropagation(); onStatusChange(order.id, 'approved'); }}>
                                                Approve
                                            </Button>
                                        </>
                                    )}

                                    {order.status === 'approved' && (
                                        <Button onClick={(e) => { e.stopPropagation(); onStatusChange(order.id, 'processing'); }} icon={ChefHat}>
                                            Start Cooking
                                        </Button>
                                    )}

                                    {order.status === 'processing' && (
                                         <button onClick={(e) => { e.stopPropagation(); onStatusChange(order.id, 'completed'); }} className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold bg-app-success text-white hover:brightness-105 active:scale-[0.97] shadow-soft transition-all">
                                            <PackageCheck className="h-5 w-5" /> Mark Completed
                                        </button>
                                    )}

                                    {order.status === 'completed' && (
                                         <div className="inline-flex items-center gap-2 px-3 py-2.5 bg-app-success/15 text-app-success rounded-md font-semibold text-sm">
                                            <CheckCircle2 className="h-4 w-4" /> Completed
                                         </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
});

export default OrderCard;