
import React, { createContext, useState, useContext, ReactNode, useMemo, useEffect, useCallback } from 'react';
import { Recipe, Ingredient, Order, OrderStatus, CookingSession } from '../types';
import { MOCK_RECIPES, MOCK_INGREDIENTS, MOCK_ORDERS, MOCK_SESSIONS } from '../constants';
import { db, convertTimestamps } from '../lib/firebase';
import { useAuth } from './AuthContext';
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
  /** Set when a write did not reach Firestore. Null when everything is saved. */
  saveError: string | null;
  dismissSaveError: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

/**
 * Firestore rejects `undefined` anywhere in a document, including inside nested
 * arrays such as a recipe's ingredient sections. Optional fields cleared in the
 * editor arrive as undefined, so drop them before writing.
 */
const stripUndefined = (value: any): any => {
    if (Array.isArray(value)) return value.map(stripUndefined);
    if (value && typeof value === 'object' && !(value instanceof Date) && !(value instanceof Timestamp)) {
        const out: any = {};
        Object.entries(value).forEach(([k, v]) => {
            if (v !== undefined) out[k] = stripUndefined(v);
        });
        return out;
    }
    return value;
};

/** Merge incoming records into a list by id, replacing matches and appending the rest. */
const upsertById = <T extends { id: string }>(current: T[], incoming: T[]): T[] => {
    const byId = new Map(incoming.map(item => [item.id, item]));
    const merged = current.map(item => byId.get(item.id) ?? item);
    current.forEach(item => byId.delete(item.id));
    return [...merged, ...byId.values()];
};

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
            batch.set(docRef, stripUndefined(cleanData));
        });
        await batch.commit();
    }
};

/** Turn a Firestore write failure into something a cook can act on. */
const describeWriteError = (label: string, e: any, signedIn: boolean): string => {
  switch (e?.code) {
    case 'permission-denied':
      return signedIn
        ? `Not saved: ${label} — your account does not have permission to write to this database.`
        : `Not saved: ${label} — sign in first.`;
    case 'unavailable':
      return `Not saved yet: ${label} — the database is unreachable. It will retry while you stay on this page.`;
    case 'not-found':
      return `Not saved: ${label} — that record no longer exists in the database.`;
    case 'invalid-argument':
      return `Not saved: ${label} — rejected by the database (${e?.message || 'invalid data'}).`;
    default:
      return `Not saved: ${label} — ${e?.message || 'unknown error'}.`;
  }
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cookingSessions, setCookingSessions] = useState<CookingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const dismissSaveError = useCallback(() => setSaveError(null), []);

  /**
   * Every write goes through here so a failure is never silent: the change is
   * still applied locally so the user does not lose their work, but they are
   * told it did not reach the database.
   */
  const persist = useCallback(async (label: string, remote: () => Promise<void>, local: () => void) => {
    if (isDemoMode) {
      local();
      setSaveError(user
        ? `Not saved: ${label} — the app is showing local demo data because the database is unreachable.`
        : `Not saved: ${label} — sign in to write to the kitchen database.`);
      return;
    }
    try {
      await remote();
      setSaveError(null);
    } catch (e: any) {
      console.error(`Firestore write failed [${label}]`, e);
      local();
      setSaveError(describeWriteError(label, e, !!user));
    }
  }, [isDemoMode, user]);

  // --- Optimization: Maps for O(1) lookup ---
  const ingredientMap = useMemo(() => new Map(ingredients.map(i => [i.id, i])), [ingredients]);
  const recipeMap = useMemo(() => new Map(recipes.map(r => [r.id, r])), [recipes]);

  // --- Firestore Listeners ---
  // Re-subscribed whenever the signed-in user changes: with auth-gated rules a
  // signed-out session gets permission-denied, and those listeners stay dead
  // until they are rebuilt with the new credentials.
  useEffect(() => {
    if (authLoading) return;

    let unsubscribers: Unsubscribe[] = [];
    let loadedState = { recipes: false, ingredients: false, orders: false, cookingSessions: false };

    setLoading(true);
    setIsDemoMode(false);

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
  }, [user?.uid, authLoading]);

  // Auto-seed if empty. Only ever attempted for a signed-in user — seeding while
  // signed out just produces a wall of permission-denied errors.
  const seedAttempted = React.useRef(false);
  useEffect(() => {
    if (loading || isDemoMode || !user || seedAttempted.current) return;
    if (recipes.length === 0 && ingredients.length === 0) {
        seedAttempted.current = true;
        console.log("Database empty. Auto-seeding...");
        seedDatabase();
    }
  }, [loading, isDemoMode, user, recipes.length, ingredients.length]);

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
    
    await persist(
        'Order',
        () => setDoc(doc(db, 'orders', generatedId), stripUndefined({
            ...newOrder,
            createdAt: Timestamp.fromDate(newOrder.createdAt),
            dueDate: newOrder.dueDate ? Timestamp.fromDate(newOrder.dueDate) : null
        })),
        () => setOrders(prev => [...prev, newOrder])
    );
  }, [persist]);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    const cleanUpdates: any = { ...updates };
    if (cleanUpdates.dueDate instanceof Date) cleanUpdates.dueDate = Timestamp.fromDate(cleanUpdates.dueDate);
    await persist(
        'Order',
        () => updateDoc(doc(db, 'orders', id), stripUndefined(cleanUpdates)),
        () => setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o))
    );
  }, [persist]);

  const deleteOrder = useCallback(async (id: string) => {
    await persist(
        'Order deletion',
        () => deleteDoc(doc(db, 'orders', id)),
        () => setOrders(prev => prev.filter(o => o.id !== id))
    );
  }, [persist]);

  const updateOrderStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    await persist(
        'Order status',
        // Transaction so a status change cannot race another writer.
        () => runTransaction(db, async (transaction) => {
            const orderRef = doc(db, 'orders', orderId);
            const orderDoc = await transaction.get(orderRef);
            if (!orderDoc.exists()) throw new Error("Order does not exist");
            transaction.update(orderRef, { status });
        }),
        () => setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    );
  }, [persist]);

  // --- Ingredient Logic ---
  const addIngredient = useCallback(async (newIngredient: Ingredient) => {
    const { id, ...data } = newIngredient;
    const docId = id || `ing_${Date.now()}`;
    const finalData = { ...data, last_verified: data.last_verified ? Timestamp.fromDate(data.last_verified) : Timestamp.now() };
    
    await persist(
        'Inventory item',
        () => setDoc(doc(db, 'ingredients', docId), stripUndefined(finalData)),
        () => setIngredients(prev => [...prev, { ...newIngredient, id: docId, last_verified: new Date() }])
    );
  }, [persist]);

  const batchAddIngredients = useCallback(async (newIngredients: Ingredient[]) => {
    await persist(
        `${newIngredients.length} inventory item${newIngredients.length === 1 ? '' : 's'}`,
        () => batchWriteDocs('ingredients', newIngredients),
        // Upsert by id so the local view matches what a batch `set` would do —
        // appending would show an imported item twice.
        () => setIngredients(prev => upsertById(prev, newIngredients))
    );
  }, [persist]);

  const updateIngredient = useCallback(async (updatedIngredient: Ingredient) => {
    const { id, ...data } = updatedIngredient;
    const cleanData: any = { ...data };
    if (cleanData.last_verified instanceof Date) cleanData.last_verified = Timestamp.fromDate(cleanData.last_verified);
    await persist(
        'Inventory item',
        () => updateDoc(doc(db, 'ingredients', id), stripUndefined(cleanData)),
        () => setIngredients(prev => prev.map(i => i.id === id ? updatedIngredient : i))
    );
  }, [persist]);

  const deleteIngredient = useCallback(async (id: string) => {
    await persist(
        'Inventory deletion',
        () => deleteDoc(doc(db, 'ingredients', id)),
        () => setIngredients(prev => prev.filter(i => i.id !== id))
    );
  }, [persist]);

  // --- Recipe Logic ---
  const addRecipe = useCallback(async (newRecipe: Recipe) => {
    const { id, ...data } = newRecipe;
    const docId = id || `rec_${Date.now()}`;
    const finalData = { ...data, createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : Timestamp.now() };

    await persist(
        'Recipe',
        () => setDoc(doc(db, 'recipes', docId), stripUndefined(finalData)),
        () => setRecipes(prev => [...prev, { ...newRecipe, id: docId, createdAt: newRecipe.createdAt || new Date() }])
    );
  }, [persist]);

  const batchAddRecipes = useCallback(async (newRecipes: Recipe[]) => {
    await persist(
        `${newRecipes.length} recipe${newRecipes.length === 1 ? '' : 's'}`,
        () => batchWriteDocs('recipes', newRecipes),
        () => setRecipes(prev => upsertById(prev, newRecipes))
    );
  }, [persist]);

  const updateRecipe = useCallback(async (updatedRecipe: Recipe) => {
    const { id, ...data } = updatedRecipe;
    const cleanData: any = { ...data };
    if (cleanData.createdAt instanceof Date) cleanData.createdAt = Timestamp.fromDate(cleanData.createdAt);
    await persist(
        'Recipe',
        () => updateDoc(doc(db, 'recipes', id), stripUndefined(cleanData)),
        () => setRecipes(prev => prev.map(r => r.id === id ? updatedRecipe : r))
    );
  }, [persist]);

  const deleteRecipe = useCallback(async (id: string) => {
    await persist(
        'Recipe deletion',
        () => deleteDoc(doc(db, 'recipes', id)),
        () => setRecipes(prev => prev.filter(r => r.id !== id))
    );
  }, [persist]);

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

    await persist(
        'Cooking session',
        () => setDoc(doc(db, 'cookingSessions', docId), stripUndefined(finalData)),
        () => setCookingSessions(prev => [...prev, session])
    );
  }, [persist]);

  const updateCookingSession = useCallback(async (id: string, updates: Partial<CookingSession>) => {
    const cleanUpdates: any = { ...updates };
    if (cleanUpdates.startTime instanceof Date) cleanUpdates.startTime = Timestamp.fromDate(cleanUpdates.startTime);
    if (cleanUpdates.endTime instanceof Date) cleanUpdates.endTime = Timestamp.fromDate(cleanUpdates.endTime);
    await persist(
        'Cooking session',
        () => updateDoc(doc(db, 'cookingSessions', id), stripUndefined(cleanUpdates)),
        () => setCookingSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    );
  }, [persist]);

  const deleteCookingSession = useCallback(async (id: string) => {
    await persist(
        'Session deletion',
        () => deleteDoc(doc(db, 'cookingSessions', id)),
        () => setCookingSessions(prev => prev.filter(s => s.id !== id))
    );
  }, [persist]);

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
        setSaveError(null);
    } catch (e: any) {
        console.error("Failed to seed database:", e);
        setSaveError(describeWriteError('Sample data', e, !!user));
    }
  }, [isDemoMode, user]);

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
      setSaveError(null);
    } catch (err: any) {
      console.error('Failed to reset pantry:', err);
      setSaveError(describeWriteError('Pantry reset', err, !!user));
    }
  }, [isDemoMode, user]);

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
        setSaveError(null);
    } catch (e: any) {
        console.error("Failed to sync missing data:", e);
        setSaveError(describeWriteError('Data sync', e, !!user));
    }
  }, [isDemoMode, recipes, ingredients, user]);

  const value = useMemo(() => ({
    recipes, ingredients, orders, cookingSessions, loading, isDemoMode, saveError, dismissSaveError,
    getRecipeById, getIngredientById, getIngredientsByIds,
    addOrder, updateOrder, deleteOrder, updateOrderStatus,
    addIngredient, updateIngredient, deleteIngredient, batchAddIngredients,
    addRecipe, updateRecipe, duplicateRecipe, batchAddRecipes, deleteRecipe,
    addCookingSession, updateCookingSession, deleteCookingSession, getSessionsByRecipeId,
    seedDatabase, resetPantryFromConstants, syncMissingData
  }), [
    recipes, ingredients, orders, cookingSessions, loading, isDemoMode, saveError, dismissSaveError,
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
