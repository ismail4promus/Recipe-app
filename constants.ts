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
  },
  {
    id: 'rec_ruchiraj_beef_tehari',
    name: 'Ruchiraj Beef Tehari',
    category: 'Main Course',
    cuisine: 'Bangladeshi',
    prepTime: 30,
    cookTime: 90,
    servings: 12.8,
    difficulty: 'Hard',
    isFavorite: false,
    overheadPercentage: 15,
    profitMargin: 25,
    imageUrl: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=1000',
    createdAt: new Date(),
    tags: ['rice', 'beef', 'tehari', 'traditional', 'Ruchiraj'],
    allergens: ['Milk'],
    ingredientSections: [
      {
        id: 'sec_rbt_1',
        name: 'Step 1',
        ingredients: [
          { id: 'ri_rbt_01', ingredientId: 'ing_ruchiraj_beef', name: 'Beef', quantity: 1300, unit: 'KG', type: 'Whole' },
          { id: 'ri_rbt_02', ingredientId: 'ing_ruchiraj_cinnamon', name: 'Cinnamon', quantity: 2, unit: 'PC', type: 'Whole' },
          { id: 'ri_rbt_03', ingredientId: 'ing_ruchiraj_cardamom', name: 'Cardamom', quantity: 10, unit: 'PC', type: 'Whole' },
          { id: 'ri_rbt_04', ingredientId: 'ing_ruchiraj_mace', name: 'Mace', quantity: 3, unit: 'PC', type: 'Whole' },
          { id: 'ri_rbt_05', ingredientId: 'ing_ruchiraj_white_pepper', name: 'White Pepper', quantity: 20, unit: 'PC', type: 'Whole' },
          { id: 'ri_rbt_06', ingredientId: 'ing_ruchiraj_nutmeg', name: 'Nutmeg', quantity: 0.5, unit: 'PC', type: 'Whole' },
          { id: 'ri_rbt_07', ingredientId: 'ing_ruchiraj_cumin_powder', name: 'Cumin Powder', quantity: 1.8, unit: 'TSP', type: 'Powder' },
          { id: 'ri_rbt_08', ingredientId: 'ing_ruchiraj_coriander_powder', name: 'Coriander Powder', quantity: 6, unit: 'gm', type: 'Powder' },
          { id: 'ri_rbt_09', ingredientId: 'ing_ruchiraj_cloves', name: 'Cloves', quantity: 8, unit: 'PC', type: 'Whole' }
        ]
      },
      {
        id: 'sec_rbt_2',
        name: 'Step 2',
        ingredients: [
          { id: 'ri_rbt_10', ingredientId: 'ing_ruchiraj_cooking_oil', name: 'Cooking Oil', quantity: 1.2, unit: 'CUP', type: 'Liquid' },
          { id: 'ri_rbt_11', ingredientId: 'ing_ruchiraj_green_chili', name: 'Green Chili', quantity: 14, unit: 'PC', type: 'Whole' },
          { id: 'ri_rbt_12', ingredientId: 'ing_ruchiraj_onion_beresta', name: 'Onion Beresta', quantity: 1, unit: 'CUP', type: 'Whole' },
          { id: 'ri_rbt_13', ingredientId: 'ing_ruchiraj_garlic_paste', name: 'Garlic Paste', quantity: 2, unit: 'TBS', type: 'Paste' },
          { id: 'ri_rbt_14', ingredientId: 'ing_ruchiraj_ginger_paste', name: 'Ginger Paste', quantity: 3, unit: 'TBS', type: 'Paste' },
          { id: 'ri_rbt_15', ingredientId: 'ing_ruchiraj_tehari_ground_masala', name: 'Tehari Ground Masala', quantity: 14.3, unit: 'gm', type: 'Powder' },
          { id: 'ri_rbt_16', ingredientId: 'ing_ruchiraj_hot_water', name: 'Hot Water', quantity: 0.5, unit: 'CUP', type: 'Liquid' },
          { id: 'ri_rbt_17', ingredientId: 'ing_ruchiraj_salt', name: 'Salt', quantity: 2, unit: 'TSP', type: 'Whole' },
          { id: 'ri_rbt_18', ingredientId: 'ing_ruchiraj_sour_yogurt', name: 'Sour Yogurt', quantity: 3, unit: 'TBS', type: 'Paste' }
        ]
      },
      {
        id: 'sec_rbt_3',
        name: 'Step 3',
        ingredients: [
          { id: 'ri_rbt_19', ingredientId: 'ing_ruchiraj_potato', name: 'Potato', quantity: 8, unit: 'PC', type: 'Whole' },
          { id: 'ri_rbt_20', ingredientId: 'ing_ruchiraj_chinigura_rice', name: 'Chinigura Rice', quantity: 5, unit: 'CUP', type: 'Whole' }
        ]
      },
      {
        id: 'sec_rbt_4',
        name: 'Step 4',
        ingredients: [
          { id: 'ri_rbt_21', ingredientId: 'ing_ruchiraj_hot_water', name: 'Hot Water', quantity: 9.2, unit: 'CUP', type: 'Liquid' },
          { id: 'ri_rbt_22', ingredientId: 'ing_ruchiraj_testing_salt', name: 'Testing Salt', quantity: 0.2, unit: 'TSP', type: 'Whole' },
          { id: 'ri_rbt_23', ingredientId: 'ing_ruchiraj_lemon', name: 'Lemon', quantity: 0.5, unit: 'PC', type: 'Whole' },
          { id: 'ri_rbt_24', ingredientId: 'ing_ruchiraj_salt', name: 'Salt', quantity: 3, unit: 'TSP', type: 'Whole' },
          { id: 'ri_rbt_25', ingredientId: 'ing_ruchiraj_milk_powder', name: 'Milk Powder', quantity: 40, unit: 'gm', type: 'Powder' },
          { id: 'ri_rbt_26', ingredientId: 'ing_ruchiraj_green_chili', name: 'Green Chili', quantity: 20, unit: 'PC', type: 'Whole' },
          { id: 'ri_rbt_27', ingredientId: 'ing_ruchiraj_keora_water', name: 'Keora Water', quantity: 1, unit: 'TBS', type: 'Liquid' },
          { id: 'ri_rbt_28', ingredientId: 'ing_ruchiraj_rose_water', name: 'Rose Water', quantity: 1, unit: 'TBS', type: 'Liquid' },
          { id: 'ri_rbt_29', ingredientId: 'ing_ruchiraj_mustard_oil', name: 'Mustard Oil', quantity: 0.5, unit: 'CUP', type: 'Liquid' },
          { id: 'ri_rbt_30', ingredientId: 'ing_ruchiraj_tehari_food_container', name: 'Tehari Food Container', quantity: 1, unit: 'Ea', type: 'Whole' },
          { id: 'ri_rbt_31', ingredientId: 'ing_ruchiraj_lime_juice', name: 'Lime Juice', quantity: 1, unit: 'Ea', type: 'Liquid' }
        ]
      }
    ],
    steps: [
      { id: 'step_rbt_1', stepNumber: 1, duration: 10, linkedIngredientIds: ['ri_rbt_02', 'ri_rbt_03', 'ri_rbt_04', 'ri_rbt_05', 'ri_rbt_06', 'ri_rbt_07', 'ri_rbt_08', 'ri_rbt_09'], instruction: 'Prepare the Tehari ground masala using cinnamon, cardamom, mace, white pepper, nutmeg, cumin powder, coriander powder, and cloves.' },
      { id: 'step_rbt_2', stepNumber: 2, duration: 20, linkedIngredientIds: ['ri_rbt_10', 'ri_rbt_11', 'ri_rbt_12', 'ri_rbt_13', 'ri_rbt_14', 'ri_rbt_15', 'ri_rbt_16', 'ri_rbt_17', 'ri_rbt_18'], instruction: 'Heat cooking oil. Add green chili, onion beresta, garlic paste, ginger paste, Tehari ground masala, hot water, salt, and sour yogurt mixed with water. Cook until the masala is well combined and aromatic.' },
      { id: 'step_rbt_3', stepNumber: 3, duration: 45, linkedIngredientIds: ['ri_rbt_01', 'ri_rbt_19'], instruction: 'Add the beef and cook. Add the potatoes. When the beef is cooked, separate the beef and excess oil from the pot.' },
      { id: 'step_rbt_4', stepNumber: 4, duration: 10, linkedIngredientIds: ['ri_rbt_20'], instruction: 'Add the Chinigura rice to the pot and mix it with the reserved Tehari oil and masala.' },
      { id: 'step_rbt_5', stepNumber: 5, duration: 25, linkedIngredientIds: ['ri_rbt_21', 'ri_rbt_22', 'ri_rbt_23', 'ri_rbt_24'], instruction: 'Add hot water. Test the salt and adjust with lemon and additional salt as needed. Cook the rice until nearly done.' },
      { id: 'step_rbt_6', stepNumber: 6, duration: 15, linkedIngredientIds: ['ri_rbt_25', 'ri_rbt_26', 'ri_rbt_27', 'ri_rbt_28', 'ri_rbt_29'], instruction: 'Add milk powder, green chili, keora water, rose water, and mustard oil. Add the fried onion with the keora water, then finish cooking on low heat.' },
      { id: 'step_rbt_7', stepNumber: 7, duration: 5, linkedIngredientIds: ['ri_rbt_30', 'ri_rbt_31'], instruction: 'Portion the Beef Tehari into food containers and serve with lime juice.' }
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
