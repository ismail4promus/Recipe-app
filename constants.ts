import { Recipe, Ingredient, Order, CookingSession } from './types';

export const MOCK_INGREDIENTS: Ingredient[] = [
  {
    id: 'ing_flour',
    name: 'All-Purpose Flour',
    category: 'Baking',
    baseUnit: 'g',
    packageSize: 1000,
    packageUnit: 'pack',
    packagesInStock: 5,
    costPerPackage: 2.50,
    supplier: 'Whole Foods',
    shelf_life_days: 180,
    last_verified: new Date(),
    quantityInStock: 5000,
    costPerUnit: 0.0025,
    wastePercentage: 0
  },
  {
    id: 'ing_sugar',
    name: 'Granulated Sugar',
    category: 'Baking',
    baseUnit: 'g',
    packageSize: 1000,
    packageUnit: 'pack',
    packagesInStock: 3,
    costPerPackage: 3.00,
    supplier: 'Whole Foods',
    shelf_life_days: 365,
    last_verified: new Date(),
    quantityInStock: 3000,
    costPerUnit: 0.003,
    wastePercentage: 0
  },
  {
    id: 'ing_chicken',
    name: 'Chicken Breast',
    category: 'Protein',
    baseUnit: 'g',
    packageSize: 1000,
    packageUnit: 'pack',
    packagesInStock: 10,
    costPerPackage: 12.00,
    supplier: 'Local Butcher',
    shelf_life_days: 5,
    last_verified: new Date(),
    quantityInStock: 10000,
    costPerUnit: 0.012,
    wastePercentage: 0
  },
  {
    id: 'ing_rice',
    name: 'Basmati Rice',
    category: 'Grains',
    baseUnit: 'g',
    packageSize: 5000,
    packageUnit: 'bag',
    packagesInStock: 2,
    costPerPackage: 15.00,
    supplier: 'Asian Market',
    shelf_life_days: 365,
    last_verified: new Date(),
    quantityInStock: 10000,
    costPerUnit: 0.003,
    wastePercentage: 0
  },
  {
    id: 'ing_onion',
    name: 'Red Onion',
    category: 'Vegetable',
    baseUnit: 'g',
    packageSize: 1000,
    packageUnit: 'bag',
    packagesInStock: 4,
    costPerPackage: 2.00,
    supplier: 'Farmers Market',
    shelf_life_days: 14,
    last_verified: new Date(),
    quantityInStock: 4000,
    costPerUnit: 0.002,
    wastePercentage: 5
  },
  {
    id: 'ing_salt',
    name: 'Table Salt',
    category: 'Spices',
    baseUnit: 'g',
    packageSize: 750,
    packageUnit: 'container',
    packagesInStock: 10,
    costPerPackage: 1.50,
    supplier: 'Grocery Store',
    shelf_life_days: 730,
    last_verified: new Date(),
    quantityInStock: 7500,
    costPerUnit: 0.002,
    wastePercentage: 0
  },
  {
    id: 'ing_oil',
    name: 'Vegetable Oil',
    category: 'Oils & Fats',
    baseUnit: 'ml',
    packageSize: 1000,
    packageUnit: 'bottle',
    packagesInStock: 6,
    costPerPackage: 4.50,
    supplier: 'Grocery Store',
    shelf_life_days: 365,
    last_verified: new Date(),
    quantityInStock: 6000,
    costPerUnit: 0.0045,
    wastePercentage: 0
  },
  {
    id: 'ing_besan',
    name: 'Besan (Gram Flour)',
    category: 'Flour',
    baseUnit: 'g',
    packageSize: 1000,
    packageUnit: 'pack',
    packagesInStock: 2,
    costPerPackage: 3.00,
    supplier: 'Grocery Store',
    shelf_life_days: 180,
    last_verified: new Date(),
    quantityInStock: 2000,
    costPerUnit: 0.003,
    wastePercentage: 0
  },
  {
    id: 'ing_rice_flour',
    name: 'Rice Flour',
    category: 'Flour',
    baseUnit: 'g',
    packageSize: 1000,
    packageUnit: 'pack',
    packagesInStock: 2,
    costPerPackage: 2.50,
    supplier: 'Grocery Store',
    shelf_life_days: 180,
    last_verified: new Date(),
    quantityInStock: 2000,
    costPerUnit: 0.0025,
    wastePercentage: 0
  },
  {
    id: 'ing_corn_flour',
    name: 'Corn Flour',
    category: 'Flour',
    baseUnit: 'g',
    packageSize: 500,
    packageUnit: 'pack',
    packagesInStock: 2,
    costPerPackage: 2.00,
    supplier: 'Grocery Store',
    shelf_life_days: 365,
    last_verified: new Date(),
    quantityInStock: 1000,
    costPerUnit: 0.004,
    wastePercentage: 0
  },
  {
    id: 'ing_baking_soda',
    name: 'Baking Soda',
    category: 'Baking',
    baseUnit: 'g',
    packageSize: 500,
    packageUnit: 'box',
    packagesInStock: 5,
    costPerPackage: 1.50,
    supplier: 'Grocery Store',
    shelf_life_days: 730,
    last_verified: new Date(),
    quantityInStock: 2500,
    costPerUnit: 0.003,
    wastePercentage: 0
  },
  {
    id: 'ing_turmeric',
    name: 'Turmeric Powder',
    category: 'Spices',
    baseUnit: 'g',
    packageSize: 200,
    packageUnit: 'pack',
    packagesInStock: 5,
    costPerPackage: 3.00,
    supplier: 'Spice Shop',
    shelf_life_days: 365,
    last_verified: new Date(),
    quantityInStock: 1000,
    costPerUnit: 0.015,
    wastePercentage: 0
  },
  {
    id: 'ing_chili_powder',
    name: 'Chili Powder',
    category: 'Spices',
    baseUnit: 'g',
    packageSize: 200,
    packageUnit: 'pack',
    packagesInStock: 5,
    costPerPackage: 3.50,
    supplier: 'Spice Shop',
    shelf_life_days: 365,
    last_verified: new Date(),
    quantityInStock: 1000,
    costPerUnit: 0.0175,
    wastePercentage: 0
  },
  {
    id: 'ing_nigella',
    name: 'Nigella Seeds (Kaloziara)',
    category: 'Spices',
    baseUnit: 'g',
    packageSize: 100,
    packageUnit: 'pack',
    packagesInStock: 3,
    costPerPackage: 2.00,
    supplier: 'Spice Shop',
    shelf_life_days: 365,
    last_verified: new Date(),
    quantityInStock: 300,
    costPerUnit: 0.02,
    wastePercentage: 0
  },
  {
    id: 'ing_water',
    name: 'Water',
    category: 'Liquid',
    baseUnit: 'ml',
    packageSize: 1000,
    packageUnit: 'bottle',
    packagesInStock: 100,
    costPerPackage: 0.00,
    supplier: 'Tap',
    shelf_life_days: 999,
    last_verified: new Date(),
    quantityInStock: 100000,
    costPerUnit: 0.00,
    wastePercentage: 0
  }
];

export const MOCK_RECIPES: Recipe[] = [
  {
    id: 'rec_1',
    name: 'Classic Chicken Curry',
    category: 'Main Course',
    cuisine: 'Indian',
    prepTime: 20,
    cookTime: 40,
    servings: 4,
    difficulty: 'Medium',
    isFavorite: true,
    overheadPercentage: 10,
    profitMargin: 20,
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&q=80&w=1000',
    createdAt: new Date(),
    tags: ['spicy', 'chicken', 'dinner'],
    ingredientSections: [
      {
        id: 'sec_1',
        name: 'Curry Base',
        ingredients: [
          {
            id: 'ri_1_1',
            ingredientId: 'ing_chicken',
            name: 'Chicken Breast',
            quantity: 500,
            unit: 'g'
          },
          {
            id: 'ri_1_2',
            ingredientId: 'ing_onion',
            name: 'Red Onion',
            quantity: 200,
            unit: 'g'
          },
          {
             id: 'ri_1_3',
             ingredientId: 'ing_oil',
             name: 'Vegetable Oil',
             quantity: 30,
             unit: 'ml'
          }
        ]
      },
      {
        id: 'sec_2',
        name: 'Sides',
        ingredients: [
          {
            id: 'ri_1_4',
            ingredientId: 'ing_rice',
            name: 'Basmati Rice',
            quantity: 300,
            unit: 'g'
          }
        ]
      }
    ],
    steps: [
      {
        id: 'step_1',
        stepNumber: 1,
        instruction: 'Chop onions and chicken into bite-sized pieces.',
        duration: 10
      },
      {
        id: 'step_2',
        stepNumber: 2,
        instruction: 'Heat oil in a pan and sauté onions until golden brown.',
        duration: 5
      },
      {
        id: 'step_3',
        stepNumber: 3,
        instruction: 'Add chicken and cook until sealed.',
        duration: 10
      },
      {
        id: 'step_4',
        stepNumber: 4,
        instruction: 'Simmer for 20 minutes until chicken is cooked through.',
        duration: 20
      },
      {
        id: 'step_5',
        stepNumber: 5,
        instruction: 'Serve hot with steamed rice.',
        duration: 0
      }
    ]
  },
  {
    id: 'rec_ruchiraj_tehari',
    name: 'Ruchiraj Tehari',
    category: 'Main Course',
    cuisine: 'Bangladeshi',
    prepTime: 30,
    cookTime: 45,
    servings: 6,
    difficulty: 'Hard',
    isFavorite: false,
    overheadPercentage: 15,
    profitMargin: 25,
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=1000',
    createdAt: new Date(),
    tags: ['rice', 'beef', 'traditional'],
    ingredientSections: [
      {
        id: 'sec_3',
        name: 'Main',
        ingredients: [
          {
            id: 'ri_3_1_1',
            ingredientId: 'ing_rice',
            name: 'Basmati Rice',
            quantity: 1000,
            unit: 'g'
          },
          {
             id: 'ri_3_1_2',
             ingredientId: 'ing_oil',
             name: 'Vegetable Oil',
             quantity: 100,
             unit: 'ml'
          }
        ]
      }
    ],
    steps: [
      {
        id: 'step_3_1',
        stepNumber: 1,
        instruction: 'Wash rice and soak for 30 minutes.',
        duration: 30
      },
      {
        id: 'step_3_2',
        stepNumber: 2,
        instruction: 'Prepare the meat with spices in a separate pot.',
        duration: 40
      },
      {
         id: 'step_3_3',
         stepNumber: 3,
         instruction: 'Mix rice and meat and cook on low heat (dum) until done.',
         duration: 20
      }
    ]
  },
  {
      id: 'rec_cake',
      name: 'Vanilla Sponge Cake',
      category: 'Dessert',
      cuisine: 'Continental',
      prepTime: 20,
      cookTime: 35,
      servings: 8,
      difficulty: 'Easy',
      isFavorite: false,
      overheadPercentage: 10,
      profitMargin: 40,
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=1000',
      createdAt: new Date(),
      tags: ['sweet', 'baking', 'cake'],
      ingredientSections: [
          {
              id: 'sec_cake_1',
              name: 'Batter',
              ingredients: [
                  { id: 'ri_c_1', ingredientId: 'ing_flour', name: 'Flour', quantity: 250, unit: 'g' },
                  { id: 'ri_c_2', ingredientId: 'ing_sugar', name: 'Sugar', quantity: 200, unit: 'g' },
              ]
          }
      ],
      steps: [
          { id: 'step_c_1', stepNumber: 1, instruction: 'Preheat oven to 180°C.', duration: 5 },
          { id: 'step_c_2', stepNumber: 2, instruction: 'Mix dry ingredients.', duration: 5 },
          { id: 'step_c_3', stepNumber: 3, instruction: 'Bake for 35 minutes.', duration: 35 }
      ]
  },
  {
    id: 'rec_beguni',
    name: 'Beguni Batter',
    category: 'Snack',
    cuisine: 'Bangladeshi Street Food',
    prepTime: 10,
    cookTime: 10,
    servings: 16,
    difficulty: 'Easy',
    isFavorite: false,
    overheadPercentage: 10,
    profitMargin: 30,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&q=80&w=1000',
    createdAt: new Date(),
    tags: ['snack', 'bengali', 'fried', 'vegan', 'street-food'],
    ingredientSections: [
      {
        id: 'sec_beguni_1',
        name: 'Batter Mix',
        ingredients: [
          { id: 'ri_beg_1', ingredientId: 'ing_besan', name: 'Besan (Gram Flour)', quantity: 120, unit: 'g', notes: '1 cup' },
          { id: 'ri_beg_2', ingredientId: 'ing_flour', name: 'Maida (All Purpose Flour)', quantity: 125, unit: 'g', notes: '1 cup' },
          { id: 'ri_beg_3', ingredientId: 'ing_rice_flour', name: 'Rice Flour', quantity: 320, unit: 'g', notes: '2 cups' },
          { id: 'ri_beg_4', ingredientId: 'ing_corn_flour', name: 'Corn Flour', quantity: 16, unit: 'g', notes: '2 tbsp' },
          { id: 'ri_beg_5', ingredientId: 'ing_baking_soda', name: 'Baking Soda', quantity: 1, unit: 'g', notes: '0.25 tsp' },
          { id: 'ri_beg_6', ingredientId: 'ing_salt', name: 'Salt', quantity: 3, unit: 'g', notes: '0.5 tsp' },
          { id: 'ri_beg_7', ingredientId: 'ing_turmeric', name: 'Turmeric', quantity: 0.7, unit: 'g', notes: '0.25 tsp' },
          { id: 'ri_beg_8', ingredientId: 'ing_chili_powder', name: 'Chili Powder', quantity: 2, unit: 'g', notes: '1 tsp' },
          { id: 'ri_beg_9', ingredientId: 'ing_water', name: 'Water', quantity: 80, unit: 'ml', notes: 'Adjust for consistency' },
          { id: 'ri_beg_10', ingredientId: 'ing_nigella', name: 'Kaloziara (Nigella)', quantity: 1, unit: 'g', notes: '0.5 tsp' },
          { id: 'ri_beg_11', ingredientId: 'ing_salt', name: 'Salt (To Taste)', quantity: 3, unit: 'g', notes: '0.5 tsp, adjust as needed' }
        ]
      }
    ],
    steps: [
      { id: 'step_beg_1', stepNumber: 1, instruction: 'Mix all dry ingredients (Besan, Maida, Rice Flour, Corn Flour, Spices, Salt) in a bowl.', duration: 5 },
      { id: 'step_beg_2', stepNumber: 2, instruction: 'Add water gradually to make a thick batter. Consistency should be medium thick - it should coat eggplant slices fully but not drip too thin.', duration: 5 },
      { id: 'step_beg_3', stepNumber: 3, instruction: 'Heat oil for deep frying. Target temperature: 170–180°C (338–356°F).', duration: 5 },
      { id: 'step_beg_4', stepNumber: 4, instruction: 'Dip eggplant slices (Begun) into the batter and fry until golden brown and crispy.', duration: 10 }
    ]
  }
];

// MOCK ORDERS
export const MOCK_ORDERS: Order[] = [
  {
    id: 'ord_1',
    orderNumber: 'ORD2400001',
    customerName: 'John Doe',
    customerPhone: '555-0123',
    status: 'completed',
    priority: 'normal',
    dueDate: new Date(2024, 6, 22),
    items: [{ recipeId: 'rec_1', recipeName: 'Classic Chicken Curry', quantity: 2, unitPrice: 15.99 }],
    totalAmount: 31.98,
    createdAt: new Date(2024, 6, 20),
    notes: 'Please double bag.'
  },
  {
    id: 'ord_2',
    orderNumber: 'ORD2400002',
    customerName: 'Jane Smith',
    status: 'processing',
    priority: 'high',
    dueDate: new Date(2024, 6, 22),
    items: [
        { recipeId: 'rec_1', recipeName: 'Classic Chicken Curry', quantity: 1, unitPrice: 15.99 },
    ],
    totalAmount: 15.99,
    createdAt: new Date(2024, 6, 21),
  },
  {
    id: 'ord_3',
    orderNumber: 'ORD2400003',
    customerName: 'Customer Order',
    status: 'pending_approval',
    priority: 'low',
    items: [],
    totalAmount: 0.00,
    createdAt: new Date(),
  },
];

export const MOCK_SESSIONS: CookingSession[] = [
  {
    id: 'sess_1',
    recipeId: 'rec_1',
    servings: 4,
    currentStep: 5,
    completedIngredients: ['ri_1_1', 'ri_1_2'],
    startTime: new Date('2024-03-01T10:00:00'),
    endTime: new Date('2024-03-01T11:00:00'),
    status: 'completed'
  },
  {
    id: 'sess_2',
    recipeId: 'rec_ruchiraj_tehari',
    servings: 20,
    currentStep: 2,
    completedIngredients: ['ri_3_1_1'],
    startTime: new Date('2024-03-05T18:30:00'),
    status: 'in_progress'
  }
];
