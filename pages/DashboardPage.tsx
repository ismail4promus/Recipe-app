import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { 
  Warehouse, ClipboardList, DollarSign, ChevronRight, 
  Activity, Zap, Target, ChefHat, Rocket, Crosshair, Shield, Box
} from 'lucide-react';
import { formatCurrency, cn, ANIMATION_VARIANTS } from '../lib/utils';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const MetricTactical: React.FC<{ icon: any, label: string, value: string | number, color: string, trend?: string }> = React.memo(({ icon: Icon, label, value, color, trend }) => (
    <Card className="relative overflow-hidden group">
        <Icon className="absolute -bottom-4 -right-4 h-24 w-24 text-white/[0.03] group-hover:scale-110 transition-transform duration-500" />
        <div className="relative z-10 p-5">
            <div className="flex flex-col gap-1 mb-4">
                <span className="tactical-label">{label}</span>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mt-1">
                    <div className={cn("h-full w-2/3", color.replace('text-', 'bg-'))}></div>
                </div>
            </div>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter text-app-text tabular-nums leading-none">{value}</span>
                {trend && <span className="text-[10px] font-black text-app-success">+{trend}</span>}
            </div>
        </div>
    </Card>
));

const DashboardPage: React.FC = () => {
    const { recipes, ingredients, orders } = useData();
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 400);
        return () => clearTimeout(timer);
    }, []);

    const totalRevenue = useMemo(() => orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.totalAmount, 0), [orders]);
    
    const { criticalStock, warningStock } = useMemo(() => {
        const critical = ingredients.filter(i => i.packagesInStock === 0);
        const warning = ingredients.filter(i => i.packagesInStock > 0 && i.packagesInStock <= 2);
        return { criticalStock: critical, warningStock: warning };
    }, [ingredients]);

    const activePrepItems = useMemo(() => {
        const counts: Record<string, { count: number, id: string }> = {};
        orders.filter(o => o.status === 'approved' || o.status === 'processing').forEach(order => {
            order.items.forEach(item => {
                if (!counts[item.recipeName]) {
                    counts[item.recipeName] = { count: 0, id: item.recipeId };
                }
                counts[item.recipeName].count += item.quantity;
            });
        });
        return Object.entries(counts)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.count - a.count);
    }, [orders]);

    if (loading) return (
        <div className="flex flex-col h-[60vh] items-center justify-center gap-6">
            <div className="relative h-12 w-12">
                <div className="absolute inset-0 border-4 border-app-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-app-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="tactical-label animate-pulse">Syncing Command Hub...</p>
        </div>
    );

    const targetRevenue = 10000;
    const progressPercent = Math.min(100, (totalRevenue / targetRevenue) * 100);

    return (
        <motion.div initial="hidden" animate="visible" variants={ANIMATION_VARIANTS.container} className="space-y-6 pb-24 max-w-7xl mx-auto px-4 md:px-0">
            {/* Mission Header */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-app-border pb-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <Crosshair className="h-6 w-6 text-app-primary" />
                        <h1 className="text-3xl font-black tracking-tighter text-app-text uppercase">Operations Center</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="status-pulse bg-app-success shadow-[0_0_8px_#1cbb8c]"></span>
                            <span className="tactical-label">Grid Status: Active</span>
                        </div>
                        <div className="h-4 w-px bg-app-border"></div>
                        <span className="tactical-label text-app-primary flex items-center gap-2">
                            <Activity className="h-3 w-3" /> Realtime Data Link
                        </span>
                    </div>
                </div>

                <div className="bg-app-card border border-app-border p-4 rounded-md min-w-[320px] shadow-lg relative overflow-hidden group">
                    <div className="absolute -top-6 -right-6 h-20 w-20 text-white/[0.02] group-hover:rotate-12 transition-transform">
                        <Target className="h-full w-full" />
                    </div>
                    <div className="flex justify-between items-center mb-3">
                        <span className="tactical-label">Mission Quota: {Math.round(progressPercent)}%</span>
                        <span className="text-[10px] font-black text-app-primary tabular-nums">EST. $10.0K</span>
                    </div>
                    <div className="h-1 w-full bg-app-bg border border-white/5 rounded-full overflow-hidden">
                        <motion.div 
                            initial={{ width: 0 }} 
                            animate={{ width: `${progressPercent}%` }} 
                            className="h-full bg-app-primary shadow-[0_0_10px_rgba(59,125,221,0.5)]" 
                        />
                    </div>
                </div>
            </motion.div>

            {/* Top Grid Metrics */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricTactical icon={ChefHat} label="Culinary Modules" value={recipes.length} color="text-app-primary" />
                <MetricTactical icon={Warehouse} label="Asset Vault" value={ingredients.length} color="text-app-success" />
                <MetricTactical icon={ClipboardList} label="Directives" value={orders.filter(o=>o.status !== 'completed').length} color="text-app-warning" trend="12%" />
                <MetricTactical icon={DollarSign} label="Yield Target" value={formatCurrency(totalRevenue).split('.')[0]} color="text-white" trend="18%" />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <motion.div variants={ANIMATION_VARIANTS.item} className="lg:col-span-8 space-y-6">
                    <Card isPrimary className="h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <Zap className="h-4 w-4 text-app-primary" />
                                <CardTitle>Task Execution Queue</CardTitle>
                            </div>
                            <Link to="/orders" className="tactical-label text-app-primary hover:underline">Full Array</Link>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-y-auto max-h-[600px]">
                            {activePrepItems.length > 0 ? (
                                <div className="divide-y divide-white/5">
                                    {activePrepItems.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-5 hover:bg-white/[0.03] transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="h-12 w-12 rounded-sm bg-app-bg border border-app-border flex items-center justify-center font-black text-xl text-app-primary shadow-inner group-hover:border-app-primary transition-colors">
                                                    {item.count}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black tracking-tight text-app-text uppercase mb-1">{item.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className="status-pulse bg-app-warning shadow-[0_0_8px_#fcb92c]"></span>
                                                        <span className="tactical-label">Awaiting Assignment</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Link 
                                                to={`/recipes/${item.id}/cook?servings=${item.count}`}
                                                className="bg-app-primary text-white h-10 px-6 rounded-md tactical-label shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                                            >
                                                <Rocket className="h-3.5 w-3.5" /> Initialize
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-32 flex flex-col items-center justify-center opacity-30">
                                    <Box className="h-12 w-12 mb-4" />
                                    <p className="tactical-label">Grid Static: Null Data</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={ANIMATION_VARIANTS.item} className="lg:col-span-4 space-y-6">
                    <Card className="border-t-2 border-t-app-warning">
                        <CardHeader className="bg-white/[0.02]">
                            <div className="flex items-center gap-3">
                                <Shield className="h-4 w-4 text-app-warning" />
                                <CardTitle>Vault Integrity</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {[...criticalStock.slice(0, 2), ...warningStock.slice(0, 3)].map(item => {
                                const isCritical = item.packagesInStock === 0;
                                return (
                                    <div key={item.id} className="p-3 bg-app-bg border border-app-border rounded-md group hover:border-app-primary transition-all">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("status-pulse", isCritical ? "bg-app-danger shadow-[0_0_8px_#f43f5e]" : "bg-app-primary")}></div>
                                                <p className="text-[11px] font-bold uppercase tracking-tight text-app-text truncate max-w-[140px]">{item.name}</p>
                                            </div>
                                            <span className={cn("text-[9px] font-black tabular-nums", isCritical ? "text-app-danger" : "text-app-muted")}>
                                                {item.packagesInStock} {item.packageUnit.toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div 
                                                className={cn("h-full transition-all duration-1000", isCritical ? "bg-app-danger" : "bg-app-primary")}
                                                style={{ width: `${Math.min(100, (item.packagesInStock / 10) * 100)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default DashboardPage;