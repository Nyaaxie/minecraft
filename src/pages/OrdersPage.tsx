import { useEffect, useState } from 'react';
import { orderService } from '../services/orderService';
import { supabase } from '../services/supabase';
import { useAuthStore } from '../store/useAuthStore';
import { Loader2, Clock, ShoppingBag, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { type Order, type OrderItem, type ShopItem } from '../types/database.types';
import { getMinecraftItemImageUrl } from '../utils/minecraftItemApi';
import { ConfirmOrderModal } from '../components/ConfirmOrderModal';

const OrdersPage = () => {
  const [orders, setOrders] = useState<(Order & { 
    order_items: (OrderItem & { shop_item: ShopItem })[], 
    shop: { name: string, owner: { username: string } } 
  })[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingOrder, setConfirmingOrder] = useState<string | null>(null);
  const { user } = useAuthStore();
const fetchOrders = async () => {
  if (!user) return;
  try {
    setLoading(true);
    const data = await orderService.getOrdersForBuyer(user.id);

    // Fetch item details for all items
    const itemIds = Array.from(new Set(data.flatMap(o => o.order_items.map(i => i.item_id))));

    const { data: items } = await supabase
      .from('shop_items')
      .select('*')
      .in('id', itemIds);

    const itemMap = new Map((items || []).map(i => [i.id, i]));

    const ordersWithDetails = data.map(o => ({
      ...o,
      order_items: o.order_items.map(i => ({ ...i, shop_item: itemMap.get(i.item_id)! })),
      shop: (o as any).shop
    }));

    setOrders(ordersWithDetails);
  } catch (err) {
    import.meta.env.DEV && console.error('Error fetching orders:', err);
    toast.error('Failed to load orders');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    fetchOrders();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 text-strawberry-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter">My Orders</h1>
        <button onClick={fetchOrders} className="p-2.5 bg-neutral-100 dark:bg-neutral-800 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors">
          <RefreshCw size={18} />
        </button>
      </div>
      
      {orders.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-white/5">
          <ShoppingBag size={48} className="mx-auto text-neutral-400 mb-4"/>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">You have no orders yet.</p>
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
                    <p className="text-xs text-neutral-500 mt-0.5 font-bold uppercase tracking-widest italic">
                      Shop: <span className="text-neutral-900 dark:text-white">{order.shop.name}</span> | Owner: <span className="text-neutral-900 dark:text-white">{order.shop.owner.username}</span>
                    </p>
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

              {order.status === 'pending' && (
                <button 
                  onClick={() => setConfirmingOrder(order.id)}
                  className="w-full py-3.5 bg-strawberry-600 hover:bg-strawberry-700 text-white rounded-xl font-black italic uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
                >
                  Confirm Order
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {confirmingOrder && (
        <ConfirmOrderModal
          isOpen={!!confirmingOrder}
          onClose={() => setConfirmingOrder(null)}
          orderId={confirmingOrder}
          onConfirm={fetchOrders}
        />
      )}
    </div>
  );
};

export default OrdersPage;
