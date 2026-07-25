
import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import { ChefHat } from 'lucide-react';

// Lazy Load Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const RecipesPage = lazy(() => import('./pages/RecipesPage'));
const RecipeDetailPage = lazy(() => import('./pages/RecipeDetailPage'));
const AddRecipePage = lazy(() => import('./pages/AddRecipePage'));
const PantryPage = lazy(() => import('./pages/PantryPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CustomerOrderFormPage = lazy(() => import('./pages/CustomerOrderFormPage'));
const CookingModePage = lazy(() => import('./pages/CookingModePage'));
const CookingLogsPage = lazy(() => import('./pages/CookingLogsPage'));
const CookingPage = lazy(() => import('./pages/CookingPage'));
const SignInPage = lazy(() => import('./pages/SignInPage'));

const LoadingFallback = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <ChefHat className="h-12 w-12 text-primary animate-pulse" />
  </div>
);

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
      <DataProvider>
        <HashRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/order-form" element={<CustomerOrderFormPage />} />
              <Route path="/signin" element={<SignInPage />} />

              {/* Full Screen Cooking Mode - Outside Layout */}
              <Route path="/recipes/:recipeId/cook" element={<CookingModePage />} />

              <Route path="/" element={<Layout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="recipes" element={<RecipesPage />} />
                <Route path="recipes/new" element={<AddRecipePage />} />
                <Route path="recipes/:recipeId/edit" element={<AddRecipePage />} />
                <Route path="recipes/:recipeId" element={<RecipeDetailPage />} />
                <Route path="recipes/:recipeId/logs" element={<CookingLogsPage />} />
                <Route path="pantry" element={<PantryPage />} />
                <Route path="cooking" element={<CookingPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Routes>
          </Suspense>
        </HashRouter>
      </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
