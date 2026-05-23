import * as z from 'zod';

// --- Auth Schemas ---
export const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: passwordSchema,
  username: z.string().min(3, 'Username must be at least 3 characters'),
});

// --- Shop & Item Schemas ---
export const shopSchema = z.object({
  name: z.string().min(3, 'Shop name must be at least 3 characters').max(50),
  description: z.string().max(200).optional(),
  is_active: z.boolean().default(true),
});

export const shopItemSchema = z.object({
  item_name: z.string().min(1, 'Item name is required'),
  minecraft_item_id: z.string().min(1, 'Minecraft Item ID is required'),
  price: z.preprocess((val) => Number(val), z.number().positive('Price must be greater than 0')),
  quantity: z.preprocess((val) => Number(val), z.number().int().positive('Quantity must be at least 1')),
  description: z.string().max(500).optional(),
  category_id: z.string().uuid().optional().nullable(),
  is_visible: z.boolean().default(true),
});

// --- Plugin Schema ---
export const pluginSchema = z.object({
  name: z.string().min(2, 'Plugin name must be at least 2 characters'),
  description: z.string().max(1000).optional(),
  category: z.string().optional(),
  version: z.string().min(1, 'Version is required'),
  is_visible: z.boolean().default(true),
});
