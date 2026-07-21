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
    Cpu, Activity, Shield, Sun, Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/kit';

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
    setKitchenName(localStorage.getItem('chef_kitchen_name') || 'iCooking');
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
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'appearance', label: 'Appearance', icon: Palette },
      { id: 'data', label: 'Data', icon: Cpu },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-20 font-sans px-2">
      <div className="flex items-center justify-between border-b border-app-border pb-4 pt-2">
        <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-app-primary/10 rounded-md flex items-center justify-center border border-app-primary/20">
                <Settings className="h-5 w-5 text-app-primary" />
            </div>
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-app-text leading-none">Settings</h1>
                <p className="text-xs font-medium text-app-muted mt-1.5 flex items-center gap-2">
                    <Activity className="h-3 w-3 text-app-success" /> Manage your kitchen
                </p>
            </div>
        </div>
        <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-app-card border border-app-border rounded-md shadow-soft">
            <div className="flex items-center gap-1.5 border-r border-app-border pr-3">
                <span className="h-2 w-2 rounded-full bg-app-success"></span>
                <span className="text-xs font-medium text-app-muted">v2.5.0</span>
            </div>
            <span className="text-xs font-medium text-app-primary">Saved locally</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          <div className="lg:col-span-3 space-y-3">
              <div className="bg-app-card border border-app-border rounded-lg p-1.5 shadow-soft">
                <div className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex-1 flex items-center gap-3 px-4 min-h-[44px] rounded-md transition-all duration-200 group relative whitespace-nowrap",
                                activeTab === tab.id
                                    ? "bg-app-primary text-primary-foreground shadow-soft"
                                    : "hover:bg-app-muted/10 text-app-muted hover:text-app-text"
                            )}
                        >
                            <tab.icon className={cn("h-4 w-4 shrink-0", activeTab === tab.id ? "text-primary-foreground" : "text-app-muted group-hover:text-app-text")} />
                            <span className="text-sm font-semibold">{tab.label}</span>
                        </button>
                    ))}
                </div>
              </div>

              <div className="hidden lg:block bg-app-card border border-app-border rounded-lg p-5 shadow-soft">
                    <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="h-4 w-4 text-app-success" />
                        <span className="text-xs font-medium text-app-muted">Kitchen summary</span>
                    </div>
                    <div className="space-y-2.5">
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-app-muted">Recipes</span>
                            <span className="text-app-text">{recipes.length}</span>
                        </div>
                        <div className="flex justify-between text-sm font-medium">
                            <span className="text-app-muted">Pantry items</span>
                            <span className="text-app-text">{ingredients.length}</span>
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
                        <Card className="rounded-lg border-app-border bg-app-card shadow-soft overflow-hidden">
                            <CardHeader className="border-b border-app-border p-5">
                                <CardTitle className="text-base font-bold tracking-tight text-app-text flex items-center gap-2">
                                    <Building className="h-4 w-4 text-app-primary" /> Kitchen details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-app-muted ml-1">Kitchen name</label>
                                        <div className="relative">
                                            <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                                            <input
                                                value={kitchenName}
                                                onChange={(e) => setKitchenName(e.target.value)}
                                                className="w-full min-h-[44px] pl-10 pr-4 rounded-md bg-app-elevated border border-app-border focus:ring-2 focus:ring-app-primary/40 focus:border-app-primary text-sm font-medium text-app-text transition-all"
                                                placeholder="Kitchen name..."
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-app-muted ml-1">Chef name</label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                                            <input
                                                value={chefName}
                                                onChange={(e) => setChefName(e.target.value)}
                                                className="w-full min-h-[44px] pl-10 pr-4 rounded-md bg-app-elevated border border-app-border focus:ring-2 focus:ring-app-primary/40 focus:border-app-primary text-sm font-medium text-app-text transition-all"
                                                placeholder="Your name..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start pt-2">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-app-muted ml-1">Currency</label>
                                        <div className="relative">
                                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted" />
                                            <select
                                                value={currency}
                                                onChange={(e) => setCurrency(e.target.value)}
                                                className="w-full min-h-[44px] pl-10 pr-10 rounded-md bg-app-elevated border border-app-border focus:ring-2 focus:ring-app-primary/40 text-sm font-medium text-app-text appearance-none cursor-pointer"
                                            >
                                                {currencies.map(c => (
                                                    <option key={c.code} value={c.code}>{c.label} ({c.symbol})</option>
                                                ))}
                                            </select>
                                            <ChevronRight className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-app-muted rotate-90" />
                                        </div>
                                    </div>

                                    <div className="p-4 bg-app-warning/10 border border-app-border rounded-md flex items-start gap-3">
                                        <Info className="h-4 w-4 text-app-warning mt-0.5 shrink-0" />
                                        <p className="text-xs text-app-muted font-medium leading-normal">
                                            Changing your currency refreshes the app to update past totals.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-app-border p-4 flex justify-end">
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={isSavingProfile}
                                    icon={isSavingProfile ? undefined : Save}
                                >
                                    {isSavingProfile ? <Loader2 className="h-4 w-4 animate-spin"/> : null}
                                    {isSavingProfile ? "Saving..." : "Save changes"}
                                </Button>
                            </CardFooter>
                        </Card>
                    </motion.div>
                )}

                {activeTab === 'appearance' && (
                    <motion.div
                        key="appearance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                    >
                         <Card className="rounded-lg border-app-border bg-app-card shadow-soft overflow-hidden">
                            <CardHeader className="border-b border-app-border p-5">
                                <CardTitle className="text-base font-bold tracking-tight text-app-text flex items-center gap-2">
                                    <Monitor className="h-4 w-4 text-app-primary" /> Theme
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-6">
                                <div>
                                    <p className="text-sm font-medium text-app-muted mb-4">Pick how the app looks.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setTheme('light')}
                                            aria-pressed={theme === 'light'}
                                            className={cn(
                                                "flex items-center gap-3 p-4 rounded-lg border transition-all min-h-[64px]",
                                                theme === 'light'
                                                    ? "border-app-primary ring-2 ring-app-primary bg-app-primary/10"
                                                    : "border-app-border bg-app-elevated hover:bg-app-muted/10"
                                            )}
                                        >
                                            <div className="h-10 w-10 rounded-md bg-app-primary/15 text-app-primary flex items-center justify-center shrink-0">
                                                <Sun className="h-5 w-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold tracking-tight text-app-text leading-none">Light</p>
                                                <p className="text-xs font-medium text-app-muted mt-1">Bright and warm</p>
                                            </div>
                                            {theme === 'light' && <Check className="h-4 w-4 text-app-primary ml-auto shrink-0" />}
                                        </button>
                                        <button
                                            onClick={() => setTheme('dark')}
                                            aria-pressed={theme === 'dark'}
                                            className={cn(
                                                "flex items-center gap-3 p-4 rounded-lg border transition-all min-h-[64px]",
                                                theme === 'dark'
                                                    ? "border-app-primary ring-2 ring-app-primary bg-app-primary/10"
                                                    : "border-app-border bg-app-elevated hover:bg-app-muted/10"
                                            )}
                                        >
                                            <div className="h-10 w-10 rounded-md bg-app-primary/15 text-app-primary flex items-center justify-center shrink-0">
                                                <Moon className="h-5 w-5" />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold tracking-tight text-app-text leading-none">Dark</p>
                                                <p className="text-xs font-medium text-app-muted mt-1">Easy on the eyes</p>
                                            </div>
                                            {theme === 'dark' && <Check className="h-4 w-4 text-app-primary ml-auto shrink-0" />}
                                        </button>
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
                        <Card className="rounded-lg border-app-border bg-app-card shadow-soft overflow-hidden">
                            <CardHeader className="border-b border-app-border p-5">
                                <CardTitle className="text-base font-bold tracking-tight text-app-text flex items-center gap-2">
                                    <HardDrive className="h-4 w-4 text-app-primary" /> Your data
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-5 space-y-3">
                                <div className="flex items-center justify-between p-4 border border-app-border rounded-lg bg-app-elevated hover:border-app-primary/40 transition-all gap-4 group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-md bg-app-info/10 text-app-info flex items-center justify-center shrink-0 border border-app-border">
                                            <Download className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold tracking-tight text-app-text leading-none mb-1.5">Export backup</h4>
                                            <p className="text-xs font-medium text-app-muted">Download everything as a JSON file</p>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={handleExportData}
                                        disabled={exporting}
                                        icon={exporting ? undefined : Layers}
                                    >
                                        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                        Export
                                    </Button>
                                </div>

                                <div className="p-4 rounded-lg bg-app-muted/10 border border-app-border flex items-start gap-4">
                                    <Shield className="h-4 w-4 text-app-primary shrink-0 mt-0.5" />
                                    <p className="text-xs text-app-muted font-medium leading-relaxed">
                                        iCooking keeps your data <span className="text-app-primary">on this device only</span>. Nothing is stored on our servers.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="bg-app-card rounded-lg border border-app-border p-5 shadow-soft">
                             <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-md bg-app-info/10 text-app-info flex items-center justify-center border border-app-border">
                                        <RefreshCw className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold tracking-tight text-app-text leading-none mb-1.5">Restore starter content</h4>
                                        <p className="text-xs font-medium text-app-muted">Add back any missing sample recipes and pantry items</p>
                                    </div>
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={() => syncMissingData()}
                                    icon={RefreshCw}
                                >
                                    Sync
                                </Button>
                            </div>
                        </div>

                        <div className="bg-app-card rounded-lg border border-app-border p-5 shadow-soft">
                             <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-md bg-app-danger/10 text-app-danger flex items-center justify-center border border-app-border">
                                        <Trash2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold tracking-tight text-app-text leading-none mb-1.5">Reset all data</h4>
                                        <p className="text-xs font-medium text-app-muted">Replace everything with fresh sample data</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSeed}
                                    disabled={seeding}
                                    className={cn(
                                        "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-md px-5 text-sm font-semibold text-white shadow-soft transition-all active:scale-[0.97]",
                                        seeded
                                            ? "bg-app-success"
                                            : "bg-app-danger hover:brightness-105"
                                    )}
                                >
                                    {seeding ? <Loader2 className="h-4 w-4 animate-spin"/> : seeded ? <Check className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
                                    {seeded ? "Done" : "Reset"}
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
