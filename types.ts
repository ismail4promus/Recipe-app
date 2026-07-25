
export interface Ingredient {
  id: string;
  name: string;
  category: string;
  baseUnit: string; // e.g., 'g', 'ml'
  packageSize: number;
  packageUnit: string; // e.g., 'kg', 'liter', 'box'
  packagesInStock: number;
  costPerPackage: number;
  supplier: string;
  shelf_life_days: number;
  last_verified: Date;
  // Calculated fields
  quantityInStock: number;
  costPerUnit: number;
  wastePercentage: number;
}

export interface RecipeIngredient {
  id: string; // Unique ID within the recipe
  ingredientId: string; // FK to Ingredient
  name: string;
  quantity: number;
  unit: string;
  type?: string; // e.g., 'Whole', 'Powder', 'Liquid'
  notes?: string;
  manualCostPerUnit?: number; // Cost per 1 unit of the 'unit' defined above, used for overrides
  baseUnitPerUnit?: number; // 1 [unit] expressed in the linked pantry item's baseUnit (e.g. 1 pc = 150 g)
}

export interface IngredientSection {
  id: string;
  name: string;
  ingredients: RecipeIngredient[];
}

export interface RecipeStep {
  id: string;
  stepNumber: number;
  instruction: string;
  duration?: number; // in minutes
  linkedIngredientIds?: string[]; // IDs of RecipeIngredients required for this step
}

export interface Nutrition {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  cuisine: string;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredientSections: IngredientSection[];
  steps: RecipeStep[];
  isFavorite: boolean;
  overheadPercentage: number;
  profitMargin: number;
  imageUrl: string;
  createdAt?: Date;
  tags?: string[];
  nutrition?: Nutrition;
  allergens?: string[];
}

export interface OrderItem {
  recipeId: string;
  recipeName: string;
  quantity: number;
  unitPrice: number;
}

export type OrderStatus = 'pending_approval' | 'approved' | 'processing' | 'completed' | 'cancelled';
export type OrderPriority = 'low' | 'normal' | 'high';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  status: OrderStatus;
  priority: OrderPriority;
  dueDate?: Date;
  items: OrderItem[];
  totalAmount: number;
  createdAt: Date;
  notes?: string;
}

export interface CookingSession {
  id: string;
  recipeId: string;
  sessionName?: string;
  servings: number;
  currentStep: number;
  completedIngredients: string[]; // array of RecipeIngredient IDs
  startTime: Date;
  endTime?: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
  timerLeft?: number;
}

export type Theme = 'light' | 'dark' | 'ocean' | 'sunset' | 'rose' | 'forest';
