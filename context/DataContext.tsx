
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { Recipe, Ingredient, Order, OrderStatus, CookingSession } from '../types';
import { MOCK_RECIPES, MOCK_INGREDIENTS, MOCK_ORDERS, MOCK_SESSIONS } from '../constants';
import { db, convertTimestamps } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  writeBatch,
  query,
  runTransaction,
  Unsubscribe,
  getDocs,
  Timestamp
} from 'firebase/firestore';

interface DataContextType {
  recipes: Recipe[];
  ingredients: Ingredient[];
  orders: Order[];
  cookingSessions: CookingSession[];
  getRecipeById: (id: string) => Recipe | undefined;
  getIngredientById: (id: string) => Ingredient | undefined;
  getIngredientsByIds: (ids: string[]) => Ingredient[];
  addOrder: (order: Omit<Order, 'id' | 'orderNumber' | 'createdAt' | 'totalAmount' | 'status'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  deleteOrder: (id: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  addIngredient: (newIngredient: Ingredient) => void;
  updateIngredient: (updatedIngredient: Ingredient) => void;
  deleteIngredient: (id: string) => void;
  batchAddIngredients: (ingredients: Ingredient[]) => Promise<void>;
  addRecipe: (newRecipe: Recipe) => void;
  updateRecipe: (updatedRecipe: Recipe) => void;
  duplicateRecipe: (recipe: Recipe) => void;
  batchAddRecipes: (recipes: Recipe[]) => Promise<void>;
  deleteRecipe: (id: string) => void;
  addCookingSession: (session: CookingSession) => void;
  updateCookingSession: (id: string, updates: Partial<CookingSession>) => void;
  deleteCookingSession: (id: string) => void;
  getSessionsByRecipeId: (recipeId: string) => CookingSession[];
  seedDatabase: () => Promise<void>;
  syncMissingData: () => Promise<void>;
  resetPantryFromConstants?: () => Promise<void>;
  loading: boolean;
  isDemoMode: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper for batched writes
const batchWriteDocs = async (collectionName: string, items: any[], idField: string = 'id') => {
    const chunkSize = 400; // Firestore limit is 500
    for (let i = 0; i < items.length; i += chunkSize) {
        const chunk = items.slice(i, i + chunkSize);
        const batch = writeBatch(db);
        chunk.forEach(item => {
            const { [idField]: id, ...data } = item;
            // Ensure dates are valid for Firestore
            const cleanData = { ...data };
            Object.keys(cleanData).forEach(key => {
                if (cleanData[key] instanceof Date) {
                    cleanData[key] = Timestamp.fromDate(cleanData[key]);
                } else if (cleanData[key] === undefined) {
                    delete cleanData[key];
                }
            });
            const docRef = id ? doc(db, collectionName, id) : doc(collection(db, collectionName));
            batch.set(docRef, cleanData);
        });
        await batch.commit();
    }
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cookingSessions, setCookingSessions] = useState<CookingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // --- Optimization: Maps for O(1) lookup ---
  const ingredientMap = useMemo(() => new Map(ingredients.map(i => [i.id, i])), [ingredients]);
  const recipeMap = useMemo(() => new Map(recipes.map(r => [r.id, r])), [recipes]);

  // --- Firestore Listeners ---
  useEffect(() => {
    let unsubscribers: Unsubscribe[] = [];
    let loadedState = { recipes: false, ingredients: false, orders: false, cookingSessions: false };
    
    const updateLoading = () => {
        if (Object.values(loadedState).every(v => v)) {
            setLoading(false);
        }
    };

    const collectionsConfig = [
        { name: 'recipes', setter: setRecipes, mock: MOCK_RECIPES, key: 'recipes' as const },
        { name: 'ingredients', setter: setIngredients, mock: MOCK_INGREDIENTS, key: 'ingredients' as const },
        { name: 'orders', setter: setOrders, mock: MOCK_ORDERS, key: 'orders' as const },
        { name: 'cookingSessions', setter: setCookingSessions, mock: MOCK_SESSIONS, key: 'cookingSessions' as const }
    ];

    const handleError = (error: any, collectionName: string) => {
        console.error(`Firestore Error [${collectionName}]:`, error);
        // Fallback to local data on error
        setIsDemoMode(true);
        const config = collectionsConfig.find(c => c.name === collectionName);
        if (config) {
            config.setter(config.mock as any);
            loadedState[config.key] = true;
            updateLoading();
        }
    };

    try {
        collectionsConfig.forEach(({ name, setter, key }) => {
            const unsub = onSnapshot(
                collection(db, name), 
                { includeMetadataChanges: false }, // false to reduce frequent updates on metadata
                (snapshot) => {
                    const data = snapshot.docs.map(doc => ({ 
                        ...convertTimestamps(doc.data()), 
                        id: doc.id 
                    }));
                    setter(data as any);
                    loadedState[key] = true;
                    updateLoading();
                }, 
                (err) => handleError(err, name)
            );
            unsubscribers.push(unsub);
        });
    } catch (e) {
        console.error("Critical Firestore init error", e);
        setIsDemoMode(true);
        setRecipes(MOCK_RECIPES);
        setIngredients(MOCK_INGREDIENTS);
        setOrders(MOCK_ORDERS);
        setCookingSessions(MOCK_SESSIONS);
        setLoading(false);
    }

    // Timeout safety
    const timeout = setTimeout(() => {
        setLoading(currentLoading => {
            if (currentLoading) {
                console.warn("Firestore connection timeout. Using local data.");
                setIsDemoMode(true);
                // Only fill if empty to avoid overwriting live data that might have trickled in
                if (recipes.length === 0) setRecipes(MOCK_RECIPES);
                if (ingredients.length === 0) setIngredients(MOCK_INGREDIENTS);
                if (orders.length === 0) setOrders(MOCK_ORDERS);
                if (cookingSessions.length === 0) setCookingSessions(MOCK_SESSIONS);
                return false;
            }
            return currentLoading;
        });
    }, 8000);

    return () => {
        unsubscribers.forEach(unsub => unsub && unsub());
        clearTimeout(timeout);
    };
  }, []); // Run once on mount

  // Auto-seed if empty (and not demo mode)
  useEffect(() => {
    if (!loading && !isDemoMode && recipes.length === 0 && ingredients.length === 0) {
        // Prevent auto-seed loop by checking against empty state once
        console.log("Database empty. Auto-seeding...");
        seedDatabase();
    }
  }, [loading, isDemoMode, recipes.length, ingredients.length]);

  // --- Accessors ---
  const getRecipeById = useCallback((id: string) => recipeMap.get(id), [recipeMap]);
  const getIngredientById = useCallback((id: string) => ingredientMap.get(id), [ingredientMap]);
  
  const getIngredientsByIds = useCallback((ids: string[]) => {
      return ids.map(id => ingredientMap.get(id)).filter((i): i is Ingredient => !!i);
  }, [ingredientMap]);

  // --- Orders Logic ---
  const addOrder = useCallback(async (newOrderData: any) => {
    const totalAmount = newOrderData.items.reduce((sum: number, item: any) => sum + item.quantity * item.unitPrice, 0);
    const generatedId = `ord_${Date.now()}`;
    const newOrder: Order = {
      ...newOrderData,
      id: generatedId,
      orderNumber: `ORD${Date.now().toString().slice(-8)}`,
      createdAt: new Date(),
      status: 'pending_approval',
      totalAmount,
      priority: newOrderData.priority || 'normal',
    };
    
    try {
        if (isDemoMode) throw new Error("Demo Mode");
        await setDoc(doc(db, 'orders', generatedId), {
            ...newOrder,
            createdAt: Timestamp.fromDate(newOrder.createdAt),
            dueDate: newOrder.dueDate ? Timestamp.fromDate(newOrder.dueDate) : null
        });
    } catch (e) {
        setOrders(prev => [...prev, newOrder]);
    }
  }, [isDemoMode]);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    try {
        if (isDemoMode) throw new Error("Demo Mode");
        const cleanUpdates = { ...updates };
        if (cleanUpdates.dueDate && cleanUpdates.dueDate instanceof Date) {
            (cleanUpdates as any).dueDate = Timestamp.fromDate(cleanUpdates.dueDate);
        }
        await updateDoc(doc(db, 'orders', id), cleanUpdates);
    } catch (e) {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    }
  }, [isDemoMode]);

  const deleteOrder = useCallback(async (id: string) => {
    try {
        if (isDemoMode) throw new Error("Demo Mode");
        await deleteDoc(doc(db, 'orders', id));
    } catch (e) {
        setOrders(prev => prev.filter(o => o.id !== id));
    }
  }, [isDemoMode]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    try {
        if (isDemoMode) throw new Error("Demo Mode");
        // Optimization: Use transaction for critical status updates to ensure consistency
        await runTransaction(db, async (transaction) => {
            const orderRef = doc(db, 'orders', orderId);
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) throw new Error("Order does not exist");
            transaction.update(orderRef, { status });
        });
    } catch (e) {
        console.warn("Update status failed or demo mode", e);
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    }
  }, [isDemoMode]);

  // --- Ingredient Logic ---
  const addIngredient = useCallback(async (newIngredient: Ingredient) => {
    const { id, ...data } = newIngredient;
    const docId = id || `ing_${Date.now()}`;
    const finalData = { ...data, last_verified: data.last_verified ? Timestamp.fromDate(data.last_verified) : Timestamp.now() };
    
    try {
        if (isDemoMode) throw new Error("Demo Mode");
        await setDoc(doc(db, 'ingredients', docId), finalData);
    } catch (e) {
        setIngredients(prev => [...prev, { ...newIngredient, id: docId, last_verified: new Date() }]);
    }
  }, [isDemoMode]);

  const batchAddIngredients = useCallback(async (newIngredients: Ingredient[]) => {
    try {
      if (isDemoMode) {
        setIngredients(prev => [...prev, ...newIngredients]);
        return;
      }
      await batchWriteDocs('ingredients', newIngredients);
    } catch (e) {
      console.error("Batch ingredient import failed", e);
      setIngredients(prev => [...prev, ...newIngredients]);
    }
  }, [isDemoMode]);

  const updateIngredient = useCallback(async (updatedIngredient: Ingredient) => {
    const { id, ...data } = updatedIngredient;
    try {
        if (isDemoMode) throw new Error("Demo Mode");
        const cleanData: any = { ...data };
        if (cleanData.last_verified instanceof Date) {
            cleanData.last_verified = Timestamp.fromDate(cleanData.last_verified);
        }
        await updateDoc(doc(db, 'ingredients', id), cleanData);
    } catch (e) {
        setIngredients(prev => prev.map(i => i.id === id ? updatedIngredient : i));
    }
  }, [isDemoMode]);

  const deleteIngredient = useCallback(async (id: string) => {
    try {
        if (isDemoMode) throw new Error("Demo Mode");
        await deleteDoc(doc(db, 'ingredients', id));
    } catch (e) {
        setIngredients(prev => prev.filter(i => i.id !== id));
    }
  }, [isDemoMode]);

  // --- Recipe Logic ---
  const addRecipe = useCallback(async (newRecipe: Recipe) => {
    const { id, ...data } = newRecipe;
    const docId = id || `rec_${Date.now()}`;
    const finalData = { ...data, createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : Timestamp.now() };

    try {
        if (isDemoMode) throw new Error("Demo Mode");
        await setDoc(doc(db, 'recipes', docId), finalData);
    } catch (e) {
        setRecipes(prev => [...prev, { ...newRecipe, id: docId, createdAt: newRecipe.createdAt || new Date() }]);
    }
  }, [isDemoMode]);

  const batchAddRecipes = useCallback(async (newRecipes: Recipe[]) => {
    try {
      if (isDemoMode) {
        setRecipes(prev => [...prev, ...newRecipes]);
        return;
      }
      await batchWriteDocs('recipes', newRecipes);
    } catch (e) {
      console.error("Batch recipe import failed", e);
      setRecipes(prev => [...prev, ...newRecipes]);
    }
  }, [isDemoMode]);

  const updateRecipe = useCallback(async (updatedRecipe: Recipe) => {
    const { id, ...data } = updatedRecipe;
    try {
        if (isDemoMode) throw new Error("Demo Mode");
        const cleanData: any = { ...data };
        if (cleanData.createdAt instanceof Date) cleanData.createdAt = Timestamp.fromDate(cleanData.createdAt);
        await updateDoc(doc(db, 'recipes', id), cleanData);
    } catch (e) {
        setRecipes(prev => prev.map(r => r.id === id ? updatedRecipe : r));
    }
  }, [isDemoMode]);

  const deleteRecipe = useCallback(async (id: string) => {
    try {
        if (isDemoMode) throw new Error("Demo Mode");
        await deleteDoc(doc(db, 'recipes', id));
    } catch (e) {
        setRecipes(prev => prev.filter(r => r.id !== id));
    }
  }, [isDemoMode]);

  const duplicateRecipe = useCallback(async (recipe: Recipe) => {
     const newId = `rec_${Date.now()}_copy`;
     const newRecipe: Recipe = {
         ...recipe,
         id: newId,
         name: `${recipe.name} (Copy)`,
         createdAt: new Date(),
         isFavorite: false
     };
     await addRecipe(newRecipe);
  }, [addRecipe]);

  // --- Session Logic ---
  const addCookingSession = useCallback(async (session: CookingSession) => {
    const { id, ...data } = session;
    const docId = id || `sess_${Date.now()}`;
    const finalData = { 
        ...data, 
        startTime: data.startTime ? Timestamp.fromDate(data.startTime) : Timestamp.now(),
        endTime: data.endTime ? Timestamp.fromDate(data.endTime) : null
    };

    try {
        if (isDemoMode) throw new Error("Demo Mode");
        await setDoc(doc(db, 'cookingSessions', docId), finalData);
    } catch (e) {
        setCookingSessions(prev => [...prev, session]);
    }
  }, [isDemoMode]);

  const updateCookingSession = useCallback(async (id: string, updates: Partial<CookingSession>) => {
    try {
        if (isDemoMode) throw new Error("Demo Mode");
        const cleanUpdates: any = { ...updates };
        if (cleanUpdates.startTime instanceof Date) cleanUpdates.startTime = Timestamp.fromDate(cleanUpdates.startTime);
        if (cleanUpdates.endTime instanceof Date) cleanUpdates.endTime = Timestamp.fromDate(cleanUpdates.endTime);
        
        await updateDoc(doc(db, 'cookingSessions', id), cleanUpdates);
    } catch (e) {
        setCookingSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  }, [isDemoMode]);

  const deleteCookingSession = useCallback(async (id: string) => {
    try {
        if (isDemoMode) throw new Error("Demo Mode");
        await deleteDoc(doc(db, 'cookingSessions', id));
    } catch (e) {
        setCookingSessions(prev => prev.filter(s => s.id !== id));
    }
  }, [isDemoMode]);

  const getSessionsByRecipeId = useCallback((recipeId: string) => {
    return cookingSessions
        .filter(s => s.recipeId === recipeId)
        .sort((a,b) => b.startTime.getTime() - a.startTime.getTime());
  }, [cookingSessions]);

  // --- Seed / Reset ---
  const seedDatabase = useCallback(async () => {
    try {
        if (isDemoMode) {
            setRecipes(MOCK_RECIPES);
            setIngredients(MOCK_INGREDIENTS);
            setOrders(MOCK_ORDERS);
            setCookingSessions(MOCK_SESSIONS);
            return;
        }
        await batchWriteDocs('recipes', MOCK_RECIPES);
        await batchWriteDocs('ingredients', MOCK_INGREDIENTS);
        await batchWriteDocs('orders', MOCK_ORDERS);
        await batchWriteDocs('cookingSessions', MOCK_SESSIONS);
        console.log("Database Seeded Successfully");
    } catch (e) {
        console.error("Failed to seed database:", e);
    }
  }, [isDemoMode]);

  const resetPantryFromConstants = useCallback(async () => {
    try {
      if (isDemoMode) {
         setIngredients(MOCK_INGREDIENTS);
         return;
      }
      // Efficient delete using batch (chunked)
      const ingredientsSnapshot = await getDocs(query(collection(db, 'ingredients')));
      const docsToDelete = ingredientsSnapshot.docs;
      
      const chunkedDocs = [];
      for (let i = 0; i < docsToDelete.length; i += 400) {
          chunkedDocs.push(docsToDelete.slice(i, i + 400));
      }

      await Promise.all(chunkedDocs.map(async (chunk) => {
          const batch = writeBatch(db);
          chunk.forEach(d => batch.delete(d.ref));
          await batch.commit();
      }));

      // Re-seed
      await batchWriteDocs('ingredients', MOCK_INGREDIENTS);
      console.log('Pantry reset complete.');
    } catch (err) {
      console.error('Failed to reset pantry:', err);
    }
  }, [isDemoMode]);

  const syncMissingData = useCallback(async () => {
    try {
        const missingRecipes = MOCK_RECIPES.filter(mock => !recipes.some(r => r.id === mock.id));
        const missingIngredients = MOCK_INGREDIENTS.filter(mock => !ingredients.some(i => i.id === mock.id));

        if (isDemoMode) {
            if (missingRecipes.length > 0) setRecipes(prev => [...prev, ...missingRecipes]);
            if (missingIngredients.length > 0) setIngredients(prev => [...prev, ...missingIngredients]);
            return;
        }

        if (missingRecipes.length > 0) {
            console.log(`Syncing ${missingRecipes.length} missing recipes...`);
            await batchWriteDocs('recipes', missingRecipes);
        }
        
        if (missingIngredients.length > 0) {
            console.log(`Syncing ${missingIngredients.length} missing ingredients...`);
            await batchWriteDocs('ingredients', missingIngredients);
        }
        
        console.log("Data Sync Complete");
    } catch (e) {
        console.error("Failed to sync missing data:", e);
    }
  }, [isDemoMode, recipes, ingredients]);

  const value = useMemo(() => ({
    recipes, ingredients, orders, cookingSessions, loading, isDemoMode,
    getRecipeById, getIngredientById, getIngredientsByIds,
    addOrder, updateOrder, deleteOrder, updateOrderStatus,
    addIngredient, updateIngredient, deleteIngredient, batchAddIngredients,
    addRecipe, updateRecipe, duplicateRecipe, batchAddRecipes, deleteRecipe,
    addCookingSession, updateCookingSession, deleteCookingSession, getSessionsByRecipeId,
    seedDatabase, resetPantryFromConstants, syncMissingData
  }), [
    recipes, ingredients, orders, cookingSessions, loading, isDemoMode,
    getRecipeById, getIngredientById, getIngredientsByIds,
    addOrder, updateOrder, deleteOrder, updateOrderStatus,
    addIngredient, updateIngredient, deleteIngredient, batchAddIngredients,
    addRecipe, updateRecipe, duplicateRecipe, batchAddRecipes, deleteRecipe,
    addCookingSession, updateCookingSession, deleteCookingSession, getSessionsByRecipeId,
    seedDatabase, resetPantryFromConstants, syncMissingData
  ]);

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
