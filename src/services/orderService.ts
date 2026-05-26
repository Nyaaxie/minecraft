import { supabase } from './supabase';
import { type Order, type OrderItem } from '../types/database.types';

export const orderService = {
  async createOrder(buyerId: string, shopId: string, items: { itemId: string, quantity: number }[]) {
    // 1. Get shop owner
    const { data: shop, error: shopError } = await supabase
      .from('player_shops')
      .select('owner_id, name')
      .eq('id', shopId)
      .single();

    if (shopError) throw shopError;

    // 2. Create Order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ buyer_id: buyerId, shop_id: shopId, status: 'pending' })
      .select()
      .single();

    if (orderError) throw orderError;

    // 3. Create Order Items
    const orderItems = items.map(item => ({
      order_id: order.id,
      item_id: item.itemId,
      quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // 4. Notify Shop Owner
    await supabase
      .from('notifications')
      .insert({
        profile_id: shop.owner_id,
        title: 'New Order Received',
        message: `You have received a new order for your shop: ${shop.name}.`,
        type: 'system',
        link: `/shops/${shopId}/orders`  // ← make sure it's this, not '/orders'
      });

    return order;
  },

  async confirmOrder(orderId: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getOrdersForBuyer(buyerId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), shop:player_shops(name, owner:profiles!owner_id(username))')
      .eq('buyer_id', buyerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as (Order & {
      order_items: OrderItem[],
      shop: { name: string, owner: { username: string } }
    })[];
  },

  async getOrdersForShop(shopId: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*), buyer:profiles!buyer_id(username)')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as (Order & { order_items: OrderItem[], buyer: { username: string } })[];
  },

  async updateOrderStatus(orderId: string, status: 'pending' | 'confirmed' | 'completed' | 'cancelled') {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
