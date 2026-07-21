import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useData } from '../context/DataContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import { Theme } from '../types';
import { cn, setGlobalCurrency, getGlobalCurrency } from '../lib/utils';
import { 
    Database, Check, Loader2, User, Building, Globe, 
    Download, Save, Palette, Zap, Trash2, ChevronRight,
    ShieldCheck, Info, RefreshCw, Layers, Monitor, HardDrive, Settings,
    Cpu, Activity, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const themes: { name: Theme; color: string; label: string; secondary: string }[] = [
  { name: 'dark', color: 'bg-zinc-800', secondary: 'bg-zinc-800', label: 'Duty' },
  { name: 'ocean', color: 'bg-blue-600', secondary: 'bg-blue-100', label: 'Blue' },
  { name: 'sunset', color: 'bg-orange-500', secondary: 'bg-orange-100', label: 'Amber' },
  { name: 'rose', color: 'bg-pink-500', secondary: 'bg-pink-100', label: 'Rose' },
  { name: 'forest', color: 'bg-emerald-600', secondary: 'bg-emerald-100', label: 'Emerald' },
];

const currencies = [
    { code: 'USD', symbol: '$', label: 'US Dollar' },
    { code: 'EUR', symbol: '€', label: 'Euro' },
    { code: 'GBP', symbol: '£', label: 'British Pound' },
    { code: 'BDT', symbol: '৳', label: 'Bangladeshi Taka' },
    { code: 'INR', symbol: '₹', label: 'Indian Rupee' },
    { code: 'JPY', symbol: '¥', label: 'Japanese Yen' },
];

const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { seedDatabase, syncMissingData, recipes, ingredients, orders, cookingSessions } = useData();
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'data'>('profile');

  // --- Profile State ---
  const [kitchenName, setKitchenName] = useState('');
  const [chefName, setChefName] = useState('');
  const [currency, setCurrency] = useState(getGlobalCurrency());
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // --- Data State ---
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setKitchenName(localStorage.getItem('chef_kitchen_name') || 'iKITCHEN');
    setChefName(localStorage.getItem('chef_name') || 'Head Chef');
  }, []);

  const handleSaveProfile = () => {
    setIsSavingProfile(true);
    localStorage.setItem('chef_kitchen_name', kitchenName);
    localStorage.setItem('chef_name', chefName);
    
    if (currency !== getGlobalCurrency()) {
        setGlobalCurrency(currency);
        window.dispatchEvent(new Event('profile-update'));
        setTimeout(() => {
             window.location.reload(); 
        }, 800);
    } else {
        window.dispatchEvent(new Event('profile-update'));
        setTimeout(() => setIsSavingProfile(false), 800);
    }
  };

  const handleSeed = async () => {
      if (window.confirm("Overwrite existing data? This is irreversible.")) {
          setSeeding(true);
          try {
              await seedDatabase();
              setSeeded(true);
              setTimeout(() => setSeeded(false), 3000);
          } catch (e) {
              console.error(e);
          } finally {
              setSeeding(false);
          }
      }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
        const data = {
            version: "2.5",
            exportedAt: new Date().toISOString(),
            kitchen: kitchenName,
            recipes,
            ingredients,
            orders,
            cookingSessions
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `iK_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } finally {
        setExporting(false);
    }
  };

  const tabs = [
      { id: 'profile', label: 'Identity', icon: User },
      { id: 'appearance', label: 'Visuals', icon: Palette },
      { id: 'data', label: 'System', icon: Cpu },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-24 font-sans px-2">
      <div className="flex items-center justify-between border-b border-border/40 pb-4 pt-2">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
                <h1 className="text-xl font-black tracking-tight text-foreground uppercase leading-none">Configuration</h1>
                <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1.5 flex items-center gap-2">
                    <Activity className="h-2.5 w-2.5 text-emerald-500 animate-pulse" /> Core Parameters Active
                </p>
            </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 px-3 py-1.5 bg-card border border-border/60 rounded-lg shadow-sm">
            <div className="flex items-center gap-1.5 border-r border-border/40 pr-3">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">v2.5.0-STABLE</span>
            </div>
            <span className="text-[8px] font-black uppercase text-primary tracking-widest">Encryption: AES-256</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-3 space-y-3">
              <div className="bg-card border border-border/60 rounded-xl p-1 shadow-sm">
                <div className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex-1 flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group relative whitespace-nowrap",
                                activeTab === tab.id 
                                    ? "bg-primary text-primary-foreground shadow-md scale-[1.02]" 
                                    : "hover:bg-muted/60 text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon className={cn("h-4 w-4 shrink-0", activeTab === tab.id ? "text-white" : "text-muted-foreground/60 group-hover:text-foreground")} />
                            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                        </button>
                    ))}
                </div>
              </div>

              <div className="hidden lg:block bg-muted/20 border border-dashed border-border/60 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="h-3 w-3 text-emerald-500" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground">Logistics Audit</span>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-bold uppercase">
                            <span className="text-muted-foreground/60">Recipes</span>
                            <span className="text-foreground">{recipes.length} Units</span>
                        </div>
                        <div className="flex justify-between text-[9px] font-bold uppercase">
                            <span className="text-muted-foreground/60">Inventory</span>
                            <span className="text-foreground">{ingredients.length} SKU</span>
                        </div>
                    </div>
              </div>
          </div>

          <div className="lg:col-span-9 min-w-0">
            <AnimatePresence mode="wait">
                {activeTab === 'profile' && (
                    <motion.div 
                        key="profile" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                    >
                        <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/10 border-b border-border/40 p-5">
                                <CardTitle className="text-xs uppercase tracking-widest font-black text-foreground flex items-center gap-2">
                                    <Building className="h-4 w-4 text-primary" /> Establishment Identity
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Callsign (Name)</label>
                                        <div className="relative">
                                            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                                            <input 
                                                value={kitchenName}
                                                onChange={(e) => setKitchenName(e.target.value)}
                                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/30 border border-border focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-black uppercase tracking-tight transition-all"
                                                placeholder="KITCHEN..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Commander (Chef)</label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                                            <input 
                                                value={chefName}
                                                onChange={(e) => setChefName(e.target.value)}
                                                className="w-full h-11 pl-10 pr-4 rounded-xl bg-muted/30 border border-border focus:ring-2 focus:ring-primary/10 focus:border-primary text-xs font-black uppercase tracking-tight transition-all"
                                                placeholder="NAME..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">Fiscal Localization</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                                            <select 
                                                value={currency}
                                                onChange={(e) => setCurrency(e.target.value)}
                                                className="w-full h-11 pl-10 pr-10 rounded-xl bg-muted/30 border border-border focus:ring-2 focus:ring-primary/10 text-xs font-black uppercase appearance-none cursor-pointer"
                                            >
                                                {currencies.map(c => (
                                                    <option key={c.code} value={c.code}>{c.label} ({c.symbol})</option>
                                                ))}
                                            </select>
                                            <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground rotate-90" />
                                        </div>
                                    </div>
                                    
                                    <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-start gap-3">
                                        <Info className="h-3.5 w-3.5 text-amber-600 mt-0.5" />
                                        <p className="text-[8px] text-amber-700/80 dark:text-amber-400/60 font-black uppercase tracking-tight leading-normal">
                                            Currency changes require a system refresh to recalibrate historical ledgers.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-border/40 bg-muted/5 p-4 flex justify-end">
                                <button 
                                    onClick={handleSaveProfile}
                                    disabled={isSavingProfile}
                                    className="h-10 px-6 rounded-lg bg-primary text-primary-foreground font-black text-[10px] uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSavingProfile ? <Loader2 className="h-3.5 w-3.5 animate-spin"/> : <Save className="h-3.5 w-3.5"/>}
                                    {isSavingProfile ? "Syncing..." : "Apply Changes"}
                                </button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}

                {activeTab === 'appearance' && (
                    <motion.div 
                        key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                    >
                         <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/10 border-b border-border/40 p-5">
                                <CardTitle className="text-xs uppercase tracking-widest font-black text-foreground flex items-center gap-2">
                                    <Monitor className="h-4 w-4 text-primary" /> Visual Protocol
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-8">
                                <div className="p-4 rounded-xl border-2 border-primary bg-primary/5 shadow-inner flex items-center gap-4 group relative overflow-hidden">
                                    <div className="h-10 w-10 rounded-lg bg-primary text-white flex items-center justify-center">
                                        <Monitor className="h-5 w-5" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-foreground leading-none">Midnight Tactical</p>
                                        <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Permanent Active Duty Interface</p>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-border/40">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                                        <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Chrome Modifiers (Accents)</h4>
                                    </div>
                                    <div className="grid grid-cols-5 gap-2">
                                        {themes.map(t => (
                                            <button
                                                key={t.name}
                                                onClick={() => setTheme(t.name)}
                                                className={cn(
                                                    "h-12 rounded-lg border-2 transition-all flex flex-col items-center justify-center gap-1",
                                                    theme === t.name 
                                                        ? "border-primary bg-primary/5 shadow-sm" 
                                                        : "border-transparent bg-muted/40 hover:bg-muted/80"
                                                )}
                                            >
                                                <div className={cn('h-3.5 w-3.5 rounded-full ring-offset-1', t.color, theme === t.name ? 'ring-1 ring-primary' : '')} />
                                                <span className="text-[7px] font-black uppercase tracking-widest opacity-60">{t.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                         </Card>
                    </motion.div>
                )}

                {activeTab === 'data' && (
                    <motion.div 
                        key="data" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                    >
                        <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                            <CardHeader className="bg-muted/10 border-b border-border/40 p-5">
                                <CardTitle className="text-xs uppercase tracking-widest font-black text-foreground flex items-center gap-2">
                                    <HardDrive className="h-4 w-4 text-primary" /> System Persistence
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3">
                                <div className="flex items-center justify-between p-4 border border-border/60 rounded-xl bg-card hover:border-primary/40 transition-all gap-4 group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/30">
                                            <Download className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground leading-none mb-1">Encapsulated Export</h4>
                                            <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-tight">Full manifest JSON backup</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleExportData}
                                        disabled={exporting}
                                        className="h-9 px-4 rounded-lg bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {exporting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3" />}
                                        Run Export
                                    </button>
                                </div>

                                <div className="p-4 rounded-xl bg-muted/20 border border-border/60 flex items-start gap-4">
                                    <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tight leading-relaxed">
                                        iKITCHEN operates a <span className="text-primary">Tier-1 Local Persistence</span> model. Data is stored in your secure browser sandbox.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-blue-500/5 rounded-2xl border border-blue-200/50 dark:border-blue-900/20 p-4">
                             <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center border border-blue-200 dark:border-blue-900/50">
                                        <RefreshCw className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground leading-none mb-1">System Synchronization</h4>
                                        <p className="text-[8px] font-bold text-blue-600/60 uppercase tracking-tight">Inject missing protocols (Recipes/Inventory)</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => syncMissingData()}
                                    className="h-9 px-5 rounded-lg bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest shadow-md shadow-blue-600/20 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <RefreshCw className="h-3 w-3" />
                                    Sync Data
                                </button>
                            </div>
                        </div>

                        <div className="bg-red-500/5 rounded-2xl border border-red-200/50 dark:border-red-900/20 p-4">
                             <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 flex items-center justify-center border border-red-200 dark:border-red-900/50">
                                        <Trash2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground leading-none mb-1">Critical Purge</h4>
                                        <p className="text-[8px] font-bold text-red-600/60 uppercase tracking-tight">Destructive system reset</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSeed}
                                    disabled={seeding}
                                    className={cn(
                                        "h-9 px-5 rounded-lg font-black text-[9px] uppercase tracking-widest shadow-md transition-all flex items-center gap-2",
                                        seeded 
                                            ? "bg-emerald-600 text-white shadow-emerald-600/20" 
                                            : "bg-red-600 text-white shadow-red-600/20 hover:brightness-110 active:scale-95"
                                    )}
                                >
                                    {seeding ? <Loader2 className="h-3 w-3 animate-spin"/> : seeded ? <Check className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
                                    {seeded ? "Purged" : "Run Purge"}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
          </div>
      </div>
    </div>
  );
};

export default SettingsPage;