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
import { Segmented } from '../components/ui/kit';

const COLORS = ['#28A3CC', '#20B883', '#8EC1D6', '#F39A23', '#D85D68', '#64747D'];

// Shared chart styling tokens
const AXIS_STROKE = 'rgba(148,148,148,0.25)';
const TICK_FILL = '#9C9C9C';

const MetricCard: React.FC<{
    title: string;
    value: string;
    trend?: number;
    icon: any;
    color: string;
    description: string;
}> = React.memo(({ title, value, trend, icon: Icon, color, description }) => (
    <div className="bg-app-card border border-app-border p-4 rounded-lg relative overflow-hidden group hover:border-app-primary/40 transition-all shadow-soft">
        <div className="relative z-10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
                <div className={cn("h-9 w-9 rounded-md flex items-center justify-center border border-app-border bg-app-muted/10 shrink-0", color)}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-app-muted leading-none mb-1.5">{title}</p>
                    <div className="text-lg font-bold tracking-tight text-app-text leading-none">{value}</div>
                </div>
            </div>
            {trend !== undefined && (
                <div className={cn(
                    "flex items-center gap-0.5 text-[11px] font-semibold px-2 py-1 rounded-md shrink-0",
                    trend >= 0 ? "bg-app-success/10 text-app-success" : "bg-app-danger/10 text-app-danger"
                )}>
                    {trend >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
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
        <motion.div initial="hidden" animate="visible" variants={ANIMATION_VARIANTS.container} className="space-y-4 pb-20 max-w-6xl mx-auto font-sans px-4 md:px-0">
            {/* Header */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-app-border pb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-app-primary/10 rounded-md flex items-center justify-center border border-app-primary/20">
                        <BarChart3 className="h-5 w-5 text-app-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-app-text leading-none">Insights</h1>
                        <p className="text-xs font-medium text-app-muted mt-1.5 flex items-center gap-2">
                            <Activity className="h-3 w-3 text-app-success" /> Your kitchen at a glance
                        </p>
                    </div>
                </div>

                <Segmented
                    options={[
                        { value: 'This Week', label: 'This Week' },
                        { value: 'This Month', label: 'This Month' },
                        { value: 'This Year', label: 'This Year' },
                    ]}
                    value={dateRange}
                    onChange={setDateRange}
                />
            </motion.div>

            {/* KPI Grid */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <MetricCard title="Revenue" value={formatCurrency(stats.revenue).split('.')[0]} trend={12} icon={DollarSign} color="text-app-info" description="Total sales" />
                <MetricCard title="Ingredient cost" value={formatCurrency(stats.cogs).split('.')[0]} trend={-5} icon={Layers} color="text-app-primary" description="Cost of goods" />
                <MetricCard title="Net profit" value={formatCurrency(stats.profit).split('.')[0]} trend={8} icon={Target} color="text-app-success" description="Money kept" />
                <MetricCard title="Margin" value={`${stats.margin.toFixed(1)}%`} icon={Activity} color="text-app-primary" description="Profit rate" />
            </motion.div>

            {/* Performance Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Financial chart */}
                <motion.div variants={ANIMATION_VARIANTS.item} className="lg:col-span-8">
                    <Card className="rounded-lg border-app-border bg-app-card overflow-hidden shadow-soft">
                        <CardHeader className="p-4 border-b border-app-border">
                            <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2 text-app-text">
                                <TrendingUp className="h-4 w-4 text-app-info" /> Sales over time
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                            <div className="h-56 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={financialHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: TICK_FILL}} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 11, fill: TICK_FILL}} tickFormatter={(v) => `$${v}`} />
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={AXIS_STROKE} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 28px -12px rgba(0,0,0,0.45)', fontSize: '12px', fontWeight: 600 }}
                                            formatter={(v: number) => formatCurrency(v)}
                                        />
                                        <Bar dataKey="revenue" fill="#8EC1D6" fillOpacity={0.18} radius={[4, 4, 0, 0]} barSize={30} />
                                        <Line type="monotone" dataKey="profit" stroke="#20B883" strokeWidth={2.5} dot={{ r: 3, fill: '#20B883' }} />
                                        <Line type="monotone" dataKey="cogs" stroke="#F39A23" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Pie */}
                <motion.div variants={ANIMATION_VARIANTS.item} className="lg:col-span-4">
                    <Card className="rounded-lg border-app-border bg-app-card h-full overflow-hidden shadow-soft">
                         <CardHeader className="p-4 border-b border-app-border">
                            <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2 text-app-text">
                                <PieIcon className="h-4 w-4 text-app-primary" /> Where your stock value sits
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
                                    <span className="text-sm font-bold text-app-text">{formatCurrency(inventoryData.reduce((s,i)=>s+i.value,0)).split('.')[0]}</span>
                                    <span className="text-[10px] font-medium text-app-muted">Total value</span>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1.5 max-h-[100px] overflow-y-auto scrollbar-hide">
                                {inventoryData.slice(0, 4).map((i, idx) => (
                                    <div key={i.name} className="flex items-center justify-between p-2 rounded-md bg-app-muted/10 border border-app-border">
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                            <span className="text-xs font-medium truncate max-w-[100px] text-app-muted">{i.name}</span>
                                        </div>
                                        <span className="text-xs font-semibold text-app-text tabular-nums">{formatCurrency(i.value).split('.')[0]}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>

            {/* Menu Matrix */}
            <motion.div variants={ANIMATION_VARIANTS.item}>
                <Card className="rounded-lg border-app-border bg-app-card overflow-hidden shadow-soft">
                    <CardHeader className="p-4 border-b border-app-border flex flex-row items-center justify-between">
                        <CardTitle className="text-sm font-bold tracking-tight flex items-center gap-2 text-app-text">
                            <Star className="h-4 w-4 text-app-warning" /> Menu performance
                        </CardTitle>
                        <div className="flex items-center gap-4">
                             <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-app-success" />
                                <span className="text-xs font-medium text-app-muted">Popular</span>
                             </div>
                             <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-app-info" />
                                <span className="text-xs font-medium text-app-muted">Profitable</span>
                             </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            {[
                                { id: 'stars', label: 'Stars', items: menuMatrix.stars, icon: Trophy, color: 'bg-app-success/10 text-app-success border-app-border', desc: 'Promote' },
                                { id: 'plowhorses', label: 'Crowd pleasers', items: menuMatrix.plowhorses, icon: Flame, color: 'bg-app-info/10 text-app-info border-app-border', desc: 'Reprice' },
                                { id: 'puzzles', label: 'Hidden gems', items: menuMatrix.puzzles, icon: Puzzle, color: 'bg-app-warning/10 text-app-warning border-app-border', desc: 'Market' },
                                { id: 'dogs', label: 'Slow movers', items: menuMatrix.dogs, icon: Skull, color: 'bg-app-danger/10 text-app-danger border-app-border', desc: 'Remove' }
                            ].map(quad => (
                                <div key={quad.id} className={cn("p-3 rounded-md border transition-all flex flex-col min-h-[140px]", quad.color)}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-1.5">
                                            <quad.icon className="h-4 w-4" />
                                            <span className="text-sm font-bold tracking-tight">{quad.label}</span>
                                        </div>
                                        <span className="text-xs font-medium opacity-70">{quad.desc}</span>
                                    </div>
                                    <div className="space-y-1.5 flex-1 overflow-y-auto scrollbar-hide">
                                        {quad.items.length > 0 ? quad.items.slice(0, 5).map(item => (
                                            <div key={item.name} className="flex justify-between items-center text-xs font-medium border-b border-app-border pb-1 group cursor-default">
                                                <span className="truncate pr-2 leading-none">{item.name}</span>
                                                <span className="font-mono bg-app-muted/10 px-1.5 rounded-md">{item.qty}</span>
                                            </div>
                                        )) : (
                                            <div className="h-full flex items-center justify-center opacity-40 text-xs">No dishes yet</div>
                                        )}
                                    </div>
                                    <div className="mt-2 text-right">
                                        <span className="text-xs font-medium opacity-50">{quad.items.length} dishes</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Insight Grid */}
            <motion.div variants={ANIMATION_VARIANTS.item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-app-elevated text-app-text p-5 rounded-lg border border-app-border relative overflow-hidden group shadow-soft">
                    <Zap className="absolute -bottom-2 -right-2 h-16 w-16 text-app-primary/10 group-hover:scale-110 transition-transform" />
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-7 w-7 bg-app-primary/20 rounded-lg flex items-center justify-center">
                            <Zap className="h-4 w-4 text-app-primary fill-current" />
                        </div>
                        <h3 className="text-sm font-bold tracking-tight text-app-primary">Smart tip</h3>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-app-muted">
                        Current margin: <span className="text-app-primary font-bold">{stats.margin.toFixed(1)}%</span>.
                        Try promoting your <span className="underline decoration-app-primary decoration-2">hidden gems</span> with specials to boost profit.
                    </p>
                </div>

                <div className="bg-app-card border border-app-border p-5 rounded-lg relative overflow-hidden group shadow-soft">
                    <AlertTriangle className="absolute -bottom-2 -right-2 h-16 w-16 text-app-warning/10 group-hover:scale-110 transition-transform" />
                    <div className="flex items-center gap-2 mb-2">
                         <div className="h-7 w-7 bg-app-warning/10 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-app-warning" />
                        </div>
                        <h3 className="text-sm font-bold tracking-tight text-app-warning">Cost watch</h3>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-app-muted">
                        Stock value for <span className="text-app-text font-bold">Proteins</span> is trending <span className="text-app-warning font-bold">+8.4%</span>.
                        Double-check your bulk pricing for Chicken Breast.
                    </p>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default AnalyticsPage;
