import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { dbService } from '../services/dbService';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, Check, X, Clock, ShoppingBag, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { type Order, type OrderItem, type ShopItem } from '../types/database.types';
import { getMinecraftItemImageUrl } from '../utils/minecraftItemApi';

const ShopOrdersPage = () => {
  const { shopId } = useParams<{ shopId: string }>();
  // Update state definition to include buyer
  const [orders, setOrders] = useState<(Order & { order_items: (OrderItem & { shop_item: ShopItem })[], buyer: { username: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchOrders = async () => {
    if (!shopId || !user) return;
    try {
      setLoading(true);
      
      // Ownership check
      const shop = await dbService.getPlayerShopById(shopId);
      if (shop.owner_id !== user.id) {
        setError('Unauthorized');
        setLoading(false);
        return;
      }

      const data = await orderService.getOrdersForShop(shopId);
      import.meta.env.DEV && console.log('Fetched orders:', data);
      
      // Fetch item details for all items
      const itemIds = Array.from(new Set(data.flatMap(o => o.order_items.map(i => i.item_id))));
      import.meta.env.DEV && console.log('Fetching details for items:', itemIds);
      
      const { data: items, error: itemsError } = await supabase
        .from('shop_items')
        .select('*')
        .in('id', itemIds);
        
      if (itemsError) throw itemsError;
      
      import.meta.env.DEV && console.log('Fetched items:', items);
      
      const itemMap = new Map(items.map(i => [i.id, i]));
      
      const ordersWithDetails = data.map(o => ({
        ...o,
        order_items: o.order_items.map(i => ({ ...i, shop_item: itemMap.get(i.item_id)! })),
        buyer: (o as any).buyer // The orderService now returns this
      }));
      
      setOrders(ordersWithDetails);
    } catch (err) {
      console.error('Error in fetchOrders:', err);
      toast.error('Failed to load shop orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [shopId]);

  const updateStatus = async (orderId: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    try {
      await orderService.updateOrderStatus(orderId, status);
      toast.success(`Order ${status}`);
      fetchOrders();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  if (error) return <div className="text-center py-20 text-red-500">{error}</div>;

  if (loading) return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin text-strawberry-600" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Manage Shop Orders</h1>
        <button onClick={fetchOrders} className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>
      
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-white/5">
          <ShoppingBag size={48} className="mx-auto text-neutral-400 mb-4"/>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map(order => (
            <div key={order.id} className="bg-white dark:bg-neutral-900 p-8 rounded-3xl border border-neutral-200 dark:border-white/5 shadow-xl shadow-neutral-900/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-strawberry-50 dark:bg-strawberry-900/10 rounded-2xl flex items-center justify-center">
                    <ShoppingBag className="text-strawberry-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-black italic uppercase tracking-tighter text-lg">Order #{order.id.substring(0, 8)}</h3>
                    <p className="text-xs text-neutral-500 mt-0.5 font-bold uppercase tracking-widest italic">Buyer: <span className="text-neutral-900 dark:text-white">{order.buyer?.username || 'Unknown'}</span></p>
                  </div>
                </div>
                
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2
                  ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : 
                    order.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {order.status === 'pending' && <Clock size={12}/>}
                  {order.status.toUpperCase()}
                </span>
              </div>
              
              <div className="space-y-3 mb-8">
                {order.order_items.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-white/5 rounded-2xl border border-neutral-100 dark:border-white/5">
                    <img src={getMinecraftItemImageUrl(item.shop_item.minecraft_item_id, { size: 48 })} className="w-12 h-12 object-contain" />
                    <div className="flex-1">
                      <p className="font-black italic uppercase text-sm tracking-tight">{item.shop_item.item_name}</p>
                      <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-black italic uppercase text-sm">{item.quantity * item.shop_item.price} {item.shop_item.currency}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-6 border-t border-neutral-100 dark:border-white/5">
                {order.status === 'pending' && (
                  <button onClick={() => updateStatus(order.id, 'confirmed')} className="flex-1 py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black italic uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"><Check size={14}/>Confirm</button>
                )}
                {order.status === 'confirmed' && (
                  <button onClick={() => updateStatus(order.id, 'completed')} className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black italic uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"><Check size={14}/>Complete</button>
                )}
                {order.status !== 'completed' && order.status !== 'cancelled' && (
                  <button onClick={() => updateStatus(order.id, 'cancelled')} className="flex-1 py-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-black italic uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"><X size={14}/>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopOrdersPage;
