import React, { useState } from 'react';
import { Order, OrderStatus, Recipe } from '../../types';
import { formatCurrency, cn, ANIMATION_VARIANTS } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, ChevronDown, Phone, MapPin, StickyNote, 
    FileText, Printer, CheckCircle2, Edit, Trash2, ChefHat,
    Clock, User, Zap, PackageCheck, Shield, Target, Crosshair
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StatusBadge, PriorityBadge } from './OrderBadges';

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
    if (diff < 60) return 'INIT_NOW';
    if (diff < 3600) return `${Math.floor(diff / 60)}M_AGO`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}H_AGO`;
    return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' }).toUpperCase();
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
                "bg-app-card/60 backdrop-blur-xl border border-app-border rounded-sm overflow-hidden transition-all duration-300 relative group",
                "before:absolute before:top-0 before:left-0 before:w-1.5 before:h-1.5 before:border-t before:border-l before:border-app-primary/40",
                "after:absolute after:bottom-0 after:right-0 after:w-1.5 after:h-1.5 before:border-b before:border-r before:border-app-primary/40",
                isExpanded ? "shadow-2xl border-app-primary/30" : "hover:border-app-primary/20",
                isUrgent && "border-app-danger/40 bg-app-danger/[0.02]"
            )}
        >
            <div 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-4 md:px-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors relative z-10"
            >
                <div className="flex items-center gap-6 min-w-0">
                    <div className={cn(
                        "h-12 w-12 rounded-sm flex items-center justify-center text-xs font-black border shrink-0 transition-all",
                        isUrgent ? "bg-app-danger/10 border-app-danger/30 text-app-danger" : "bg-app-bg border-white/5 text-app-muted group-hover:text-app-primary group-hover:border-app-primary/30 shadow-inner"
                    )}>
                        {order.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="font-black text-app-text text-sm tracking-tight uppercase truncate italic">{order.orderNumber}</h3>
                            <PriorityBadge priority={order.priority} />
                        </div>
                        <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.2em] text-app-muted">
                            <span className="text-app-text/70 truncate max-w-[120px] md:max-w-none">{order.customerName}</span>
                            <span className="opacity-20">//</span>
                            <div className="flex items-center gap-1.5">
                                <Clock className="h-3 w-3 text-app-primary" /> {getRelativeTime(order.createdAt)}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8 shrink-0">
                    <div className="hidden lg:flex flex-col items-end gap-1.5">
                        <StatusBadge status={order.status} />
                        {order.dueDate && (
                             <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-app-bg border border-white/5 text-[8px] font-black text-app-muted uppercase tracking-widest tabular-nums">
                                <Calendar className="h-2.5 w-2.5" />
                                {new Date(order.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                             </div>
                        )}
                    </div>
                    <div className="text-right border-l border-white/5 pl-8">
                        <p className="font-black text-lg tracking-tighter text-app-text tabular-nums italic leading-none">{formatCurrency(order.totalAmount).split('.')[0]}</p>
                        <p className="text-[8px] font-black text-app-primary uppercase tracking-[0.3em] mt-1.5 opacity-60">{order.items.length} MODULES</p>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 text-app-muted transition-transform duration-500", isExpanded && "rotate-180 text-app-primary emerald-glow")} />
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="bg-app-bg/40 border-t border-white/5 relative overflow-hidden"
                    >
                        <Shield className="absolute -bottom-6 -right-6 h-24 w-24 text-white/[0.02] pointer-events-none" />
                        
                        <div className="p-6 md:p-8 space-y-8 relative z-10">
                            {/* Tactical Info Panel */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-app-card/40 border border-white/5 p-4 rounded-sm flex items-start gap-4">
                                    <div className="h-8 w-8 rounded-sm bg-app-primary/5 border border-app-primary/20 flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-app-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="tactical-label !text-[8px] mb-1.5">Personnel_Auth</p>
                                        <p className="text-xs font-black text-app-text uppercase truncate italic">{order.customerName}</p>
                                        {order.customerPhone && <p className="text-[10px] font-bold text-app-primary tabular-nums mt-1">{order.customerPhone}</p>}
                                    </div>
                                </div>
                                <div className="bg-app-card/40 border border-white/5 p-4 rounded-sm flex items-start gap-4">
                                    <div className="h-8 w-8 rounded-sm bg-app-success/5 border border-app-success/20 flex items-center justify-center shrink-0">
                                        <MapPin className="h-4 w-4 text-app-success" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="tactical-label !text-[8px] mb-1.5">Target_Station</p>
                                        <p className="text-xs font-bold text-app-text uppercase truncate">{order.deliveryAddress || "BASE_COLLECT"}</p>
                                    </div>
                                </div>
                                <div className="bg-app-card/40 border border-white/5 p-4 rounded-sm flex items-start gap-4">
                                    <div className="h-8 w-8 rounded-sm bg-app-warning/5 border border-app-warning/20 flex items-center justify-center shrink-0">
                                        <StickyNote className="h-4 w-4 text-app-warning" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="tactical-label !text-[8px] mb-1.5">Directive_Note</p>
                                        <p className="text-[10px] font-bold text-app-muted uppercase italic line-clamp-2 leading-relaxed">{order.notes || "STANDARD_PROTOCOL"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Phase Breakdown */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-4 px-2">
                                    <h4 className="text-[10px] font-black text-app-muted uppercase tracking-[0.4em]">Asset_Manifest</h4>
                                    <div className="h-px flex-1 bg-white/5"></div>
                                </div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                    {order.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-app-card/30 border border-white/5 rounded-sm hover:border-app-primary/30 transition-all group/item relative overflow-hidden">
                                            <div className="flex items-center gap-5 relative z-10">
                                                <div className="h-10 w-10 bg-app-bg border border-white/5 flex items-center justify-center font-black text-lg text-app-primary italic tabular-nums shadow-inner group-hover/item:border-app-primary/30">
                                                    {item.quantity}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black uppercase tracking-tight text-app-text truncate italic">{item.recipeName}</p>
                                                    <p className="text-[9px] font-bold text-app-muted tabular-nums uppercase tracking-widest mt-1">Val: {formatCurrency(item.unitPrice)} / Unit</p>
                                                </div>
                                            </div>
                                            {(order.status === 'approved' || order.status === 'processing') && (
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleCook(item.recipeId, item.quantity); }}
                                                    className="h-10 px-4 bg-app-primary text-white rounded-sm font-black text-[9px] uppercase tracking-[0.2em] shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 relative z-10"
                                                >
                                                    <Zap className="h-3.5 w-3.5 fill-current" /> Engage
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Operational Controls */}
                            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 pt-6 border-t border-white/5">
                                <div className="flex items-center gap-3">
                                    <button onClick={(e) => { e.stopPropagation(); onShowInvoice(order); }} className="h-11 px-5 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 bg-app-card border border-white/10 hover:border-app-primary/40 hover:bg-white/5 transition-all">
                                        <FileText className="h-4 w-4 text-app-primary" /> Ledger
                                    </button>
                                    {(order.status === 'approved' || order.status === 'processing') && (
                                         <button onClick={(e) => { e.stopPropagation(); onShowTicket(order); }} className="h-11 px-5 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 bg-app-card border border-white/10 hover:border-app-primary/40 hover:bg-white/5 transition-all">
                                            <Printer className="h-4 w-4 text-app-success" /> Ticket
                                        </button>
                                    )}
                                    {order.status === 'pending_approval' && (
                                        <button onClick={(e) => { e.stopPropagation(); onEdit(order); }} className="h-11 px-5 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 bg-app-card border border-white/10 hover:border-app-primary/40 hover:bg-white/5 transition-all">
                                            <Edit className="h-4 w-4 text-app-warning" /> Calibrate
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {order.status === 'pending_approval' && (
                                        <>
                                            <button onClick={(e) => { e.stopPropagation(); onDelete(order.id); }} className="h-11 w-11 flex items-center justify-center text-app-danger hover:bg-app-danger/5 rounded-sm border border-transparent hover:border-app-danger/20 transition-all">
                                                <Trash2 className="h-4.5 w-4.5" />
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); onStatusChange(order.id, 'approved'); }} className="h-11 px-8 bg-app-primary text-white rounded-sm font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all">
                                                Authorize
                                            </button>
                                        </>
                                    )}

                                    {order.status === 'approved' && (
                                        <button onClick={(e) => { e.stopPropagation(); onStatusChange(order.id, 'processing'); }} className="h-12 px-10 bg-app-primary text-white rounded-sm font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-3">
                                            <ChefHat className="h-5 w-5" /> Fire Directives
                                        </button>
                                    )}

                                    {order.status === 'processing' && (
                                         <button onClick={(e) => { e.stopPropagation(); onStatusChange(order.id, 'completed'); }} className="h-12 px-10 bg-app-success text-white rounded-sm font-black text-[11px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all flex items-center gap-3">
                                            <PackageCheck className="h-5 w-5" /> Finalize Deployment
                                        </button>
                                    )}

                                    {order.status === 'completed' && (
                                         <div className="flex items-center gap-3 px-6 py-3 bg-app-success/10 text-app-success border border-app-success/30 rounded-sm font-black text-[10px] uppercase tracking-[0.3em]">
                                            <CheckCircle2 className="h-4 w-4 emerald-glow" /> Protocol_Success
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