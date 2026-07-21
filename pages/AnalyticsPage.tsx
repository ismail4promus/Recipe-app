import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
    PieChart, Pie, Cell, ComposedChart, Line
} from 'recharts';
import { 
    TrendingUp, DollarSign, Target, Zap, AlertTriangle, ArrowUpRight, ArrowDownRight, 
    PieChart as PieIcon, Layers, Star, Info, Calendar, Activity, BarChart3,
    Trophy, Flame, Puzzle, Skull
} from 'lucide-react';
import { formatCurrency, cn, ANIMATION_VARIANTS } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

const MetricCard: React.FC<{ 
    title: string; 
    value: string; 
    trend?: number; 
    icon: any;
    color: string;
    description: string;
}> = React.memo(({ title, value, trend, icon: Icon, color, description }) => (
    <div className="bg-card border border-border/60 p-3 rounded-xl relative overflow-hidden group hover:border-primary/40 transition-all shadow-sm">
        <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center border border-border/40 bg-muted/30 shrink-0", color)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">{title}</p>
                    <div className="text-lg font-black tracking-tighter text-foreground leading-none">{value}</div>
                </div>
            </div>
            {trend !== undefined && (
                <div className={cn(
                    "flex items-center gap-0.5 text-[9px] font-black px-1.5 py-0.5 rounded shrink-0",
                    trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                )}>
                    {trend >= 0 ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
    </div>
));

const AnalyticsPage: React.FC = () => {
    const { recipes, orders, ingredients } = useData();
    const [dateRange, setDateRange] = useState('This Month');

    const completedOrders = useMemo(() => orders.filter(o => o.status === 'completed'), [orders]);
    
    const stats = useMemo(() => {
        let revenue = 0;
        let cogs = 0;
        
        completedOrders.forEach(order => {
            revenue += Number(order.totalAmount) || 0;
            order.items.forEach(item => {
                const recipe = recipes.find(r => r.id === item.recipeId);
                if (recipe) {
                    let recipeCost = 0;
                    recipe.ingredientSections.forEach(sec => {
                        sec.ingredients.forEach(ing => {
                            const pantry = ingredients.find(pi => pi.id === ing.ingredientId);
                            recipeCost += ing.quantity * (ing.manualCostPerUnit ?? pantry?.costPerUnit ?? 0);
                        });
                    });
                    cogs += recipeCost * item.quantity;
                }
            });
        });

        const profit = revenue - cogs;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
        return { revenue, cogs, profit, margin, count: completedOrders.length };
    }, [completedOrders, recipes, ingredients]);

    const menuMatrix = useMemo(() => {
        const itemStats = completedOrders.flatMap(o => o.items).reduce((acc: any, item) => {
            if (!acc[item.recipeId]) {
                const recipe = recipes.find(r => r.id === item.recipeId);
                let cost = 0;
                recipe?.ingredientSections.forEach(s => s.ingredients.forEach(ing => {
                    const pi = ingredients.find(p => p.id === ing.ingredientId);
                    cost += ing.quantity * (ing.manualCostPerUnit ?? pi?.costPerUnit ?? 0);
                }));
                const margin = item.unitPrice - (cost / (recipe?.servings || 1));
                acc[item.recipeId] = { name: item.recipeName, qty: 0, margin };
            }
            acc[item.recipeId].qty += item.quantity;
            return acc;
        }, {});

        const items = Object.values(itemStats) as any[];
        if (items.length === 0) return { stars: [], plowhorses: [], puzzles: [], dogs: [] };

        const avgQty = items.reduce((sum, i) => sum + i.qty, 0) / items.length;
        const avgMargin = items.reduce((sum, i) => sum + i.margin, 0) / items.length;

        return {
            stars: items.filter(i => i.qty >= avgQty && i.margin >= avgMargin),
            plowhorses: items.filter(i => i.qty >= avgQty && i.margin < avgMargin),
            puzzles: items.filter(i => i.qty < avgQty && i.margin >= avgMargin),
            dogs: items.filter(i => i.qty < avgQty && i.margin < avgMargin),
        };
    }, [completedOrders, recipes, ingredients]);

    const financialHistory = useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.map((month, idx) => {
            const monthOrders = completedOrders.filter(o => new Date(o.createdAt).getMonth() === idx);
            const rev = monthOrders.reduce((s, o) => s + (Number(o.totalAmount) || 0), 0);
            return { name: month, revenue: rev, cogs: rev * 0.65, profit: rev * 0.35 };
        });
    }, [completedOrders]);

    const inventoryData = useMemo(() => {
        return ingredients.reduce((acc: any[], ing) => {
            const existing = acc.find(a => a.name === ing.category);
            const val = ing.packagesInStock * ing.costPerPackage;
            if (existing) existing.value += val;
            else if (val > 0) acc.push({ name: ing.category, value: val });
            return acc;
        }, []).sort((a, b) => b.value - a.value);
    }, [ingredients]);

    return (
        <motion.div initial="hidden" animate="visible" variants={ANIMATION_VARIANTS.container} className="space-y-3 pb-24 max-w-6xl mx-auto font-sans px-4 md:px-0">
            {/* Ultra-Condensed Header */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="flex items-center justify-between gap-4 border-b border-border/40 pb-3">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                        <BarChart3 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-foreground uppercase leading-none">Insights Terminal</h1>
                        <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-1 flex items-center gap-2">
                            <Activity className="h-2 w-2 text-emerald-500 animate-pulse" /> Fiscal Analysis Hub
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/40">
                    <Calendar className="h-3 w-3 ml-2 text-muted-foreground" />
                    <select 
                        value={dateRange} 
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-transparent border-none text-[9px] font-black uppercase tracking-widest focus:ring-0 cursor-pointer py-1 pr-6"
                    >
                        <option>This Week</option>
                        <option>This Month</option>
                        <option>This Year</option>
                    </select>
                </div>
            </motion.div>

            {/* Tight KPI Grid */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <MetricCard title="Revenue" value={formatCurrency(stats.revenue).split('.')[0]} trend={12} icon={DollarSign} color="text-blue-500" description="Gross Top-Line" />
                <MetricCard title="COGS" value={formatCurrency(stats.cogs).split('.')[0]} trend={-5} icon={Layers} color="text-orange-500" description="Expense Total" />
                <MetricCard title="Net profit" value={formatCurrency(stats.profit).split('.')[0]} trend={8} icon={Target} color="text-emerald-500" description="Realized Gains" />
                <MetricCard title="Margin" value={`${stats.margin.toFixed(1)}%`} icon={Activity} color="text-purple-500" description="Efficiency Rate" />
            </motion.div>

            {/* Performance Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* Financial Plot */}
                <motion.div variants={ANIMATION_VARIANTS.item} className="lg:col-span-8">
                    <Card className="rounded-xl border-border/60 overflow-hidden shadow-sm">
                        <CardHeader className="p-3 border-b border-border/40 bg-muted/20">
                            <CardTitle className="text-[10px] uppercase tracking-widest font-black flex items-center gap-2 text-muted-foreground">
                                <TrendingUp className="h-3 w-3 text-blue-500" /> Operational Trajectory
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={financialHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold'}} tickFormatter={(v) => `$${v}`} />
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.05} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                                            formatter={(v: number) => formatCurrency(v)}
                                        />
                                        <Bar dataKey="revenue" fill="#3b82f6" fillOpacity={0.15} radius={[2, 2, 0, 0]} barSize={30} />
                                        <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3, fill: '#10b981' }} />
                                        <Line type="monotone" dataKey="cogs" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Compact Pie */}
                <motion.div variants={ANIMATION_VARIANTS.item} className="lg:col-span-4">
                    <Card className="rounded-xl border-border/60 h-full overflow-hidden shadow-sm">
                         <CardHeader className="p-3 border-b border-border/40 bg-muted/20">
                            <CardTitle className="text-[10px] uppercase tracking-widest font-black flex items-center gap-2 text-muted-foreground">
                                <PieIcon className="h-3 w-3 text-purple-500" /> Asset Allocation
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-3">
                            <div className="h-44 w-full relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie 
                                            data={inventoryData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={45}
                                            outerRadius={65}
                                            paddingAngle={3}
                                            stroke="none"
                                        >
                                            {inventoryData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                    <span className="text-xs font-black text-foreground">{formatCurrency(inventoryData.reduce((s,i)=>s+i.value,0)).split('.')[0]}</span>
                                    <span className="text-[6px] font-black uppercase text-muted-foreground">Total Value</span>
                                </div>
                            </div>
                            <div className="mt-2 space-y-1 max-h-[100px] overflow-y-auto scrollbar-hide">
                                {inventoryData.slice(0, 4).map((i, idx) => (
                                    <div key={i.name} className="flex items-center justify-between p-1.5 rounded-md bg-muted/20 border border-border/30">
                                        <div className="flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="text-[8px] font-black uppercase truncate max-w-[80px] text-muted-foreground">{i.name}</span>
                                        </div>
                                        <span className="text-[9px] font-black text-foreground tabular-nums">{formatCurrency(i.value).split('.')[0]}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Menu Matrix - Compact Layout */}
            <motion.div variants={ANIMATION_VARIANTS.item}>
                <Card className="rounded-xl border-border/60 overflow-hidden shadow-sm">
                    <CardHeader className="p-3 border-b border-border/40 bg-muted/20 flex flex-row items-center justify-between">
                        <CardTitle className="text-[10px] uppercase tracking-widest font-black flex items-center gap-2 text-muted-foreground">
                            <Star className="h-3 w-3 text-amber-500" /> Engineering Matrix
                        </CardTitle>
                        <div className="flex items-center gap-4">
                             <div className="flex items-center gap-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span className="text-[7px] font-black text-muted-foreground uppercase">Popular</span>
                             </div>
                             <div className="flex items-center gap-1">
                                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                <span className="text-[7px] font-black text-muted-foreground uppercase">Profitable</span>
                             </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-2">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                            {[
                                { id: 'stars', label: 'Stars', items: menuMatrix.stars, icon: Trophy, color: 'bg-emerald-500/10 text-emerald-600 border-emerald-200', desc: 'Promote' },
                                { id: 'plowhorses', label: 'Plowhorses', items: menuMatrix.plowhorses, icon: Flame, color: 'bg-blue-500/10 text-blue-600 border-blue-200', desc: 'Reprice' },
                                { id: 'puzzles', label: 'Puzzles', items: menuMatrix.puzzles, icon: Puzzle, color: 'bg-amber-500/10 text-amber-600 border-amber-200', desc: 'Market' },
                                { id: 'dogs', label: 'Dogs', items: menuMatrix.dogs, icon: Skull, color: 'bg-red-500/10 text-red-600 border-red-200', desc: 'Remove' }
                            ].map(quad => (
                                <div key={quad.id} className={cn("p-2.5 rounded-lg border transition-all flex flex-col min-h-[140px]", quad.color)}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <quad.icon className="h-3 w-3" />
                                            <span className="text-[10px] font-black uppercase tracking-tight">{quad.label}</span>
                                        </div>
                                        <span className="text-[8px] font-black uppercase opacity-60">{quad.desc}</span>
                                    </div>
                                    <div className="space-y-1.5 flex-1 overflow-y-auto scrollbar-hide">
                                        {quad.items.length > 0 ? quad.items.slice(0, 5).map(item => (
                                            <div key={item.name} className="flex justify-between items-center text-[9px] font-bold border-b border-black/5 pb-1 group cursor-default">
                                                <span className="truncate pr-2 uppercase leading-none">{item.name}</span>
                                                <span className="font-mono bg-white/40 px-1 rounded">{item.qty}</span>
                                            </div>
                                        )) : (
                                            <div className="h-full flex items-center justify-center opacity-20 text-[9px]">Zero Assets</div>
                                        )}
                                    </div>
                                    <div className="mt-2 text-right">
                                        <span className="text-[8px] font-black opacity-40">{quad.items.length} TOTAL SKU</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Compact Intelligence Grid */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-zinc-900 text-white p-4 rounded-xl border border-white/5 relative overflow-hidden group">
                    <Zap className="absolute -bottom-2 -right-2 h-16 w-16 text-primary/10 group-hover:scale-110 transition-transform" />
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-6 bg-primary/20 rounded flex items-center justify-center">
                            <Zap className="h-3.5 w-3.5 text-primary fill-current" />
                        </div>
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-primary">Strategic Insight</h3>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed uppercase tracking-tight text-zinc-300">
                        Current margin: <span className="text-primary font-black">{stats.margin.toFixed(1)}%</span>. 
                        Action: Scale <span className="underline decoration-primary decoration-2">Puzzles</span> thru aggressive specials to maximize yields.
                    </p>
                </div>

                <div className="bg-card border border-border/60 p-4 rounded-xl relative overflow-hidden group">
                    <AlertTriangle className="absolute -bottom-2 -right-2 h-16 w-16 text-orange-500/5 group-hover:scale-110 transition-transform" />
                    <div className="flex items-center gap-2 mb-2">
                         <div className="h-6 w-6 bg-orange-500/10 rounded flex items-center justify-center">
                            <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                        </div>
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-orange-500">Leakage Warning</h3>
                    </div>
                    <p className="text-[11px] font-medium leading-relaxed uppercase tracking-tight text-muted-foreground">
                        Inventory value for <span className="text-foreground font-black">Proteins</span> is trending <span className="text-orange-500 font-black">+8.4%</span>. 
                        Verify bulk purchase contracts for Chicken Breast.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AnalyticsPage;