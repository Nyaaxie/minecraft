import { useEffect, useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { dbService } from '../services/dbService';
import { getMinecraftItemImageUrl } from '../utils/minecraftItemApi';
import { Loader2, ArrowUpRight, ArrowDownLeft, Calendar, Package, Banknote, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

const TransactionsPage = () => {
  const { user } = useAuthStore();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      try {
        setLoading(true);
        const [bought, sold] = await Promise.all([
          dbService.getShopTransactionsByBuyer(user.id),
          dbService.getShopTransactionsBySeller(user.id)
        ]);

        const all = [
          ...bought.map(t => ({ ...t, type: 'buy' })),
          ...sold.map(t => ({ ...t, type: 'sell' }))
        ].sort((a, b) => new Date(b.transaction_time).getTime() - new Date(a.transaction_time).getTime());

        setTransactions(all);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6">
        <Loader2 className="animate-spin text-strawberry-600" size={64} />
        <p className="text-neutral-500 font-black uppercase tracking-widest animate-pulse">loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20 px-4 sm:px-6">
      <div className="space-y-4">
        <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">
          Trade<span className="text-strawberry-600">History</span>
        </h1>
        <p className="text-neutral-500 max-w-2xl font-medium uppercase tracking-tight text-sm">Full audit log of your marketplace operations.</p>
      </div>

      {transactions.length === 0 ? (
        <div className="bg-white dark:bg-neutral-900/50 border border-neutral-200 dark:border-white/5 p-20 rounded-[3rem] text-center space-y-6 backdrop-blur-sm">
          <div className="w-24 h-24 bg-neutral-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto">
            <ShoppingBag className="text-neutral-300" size={48} />
          </div>
          <div className="space-y-2">
            <p className="text-3xl font-black uppercase italic tracking-tighter">No Activity</p>
            <p className="text-neutral-500 max-w-xs mx-auto uppercase tracking-tight text-xs font-bold leading-relaxed">You haven't participated in any trades yet.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {transactions.map((t, idx) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 p-6 rounded-[2rem] flex flex-col sm:flex-row sm:items-center gap-6 group hover:border-strawberry-500/30 transition-all shadow-xl shadow-neutral-900/5"
            >
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border-2 border-white dark:border-neutral-800 shadow-md ${t.type === 'buy' ? 'bg-red-500/10 text-red-600' : 'bg-green-500/10 text-green-600'}`}>
                {t.type === 'buy' ? <ArrowUpRight size={24} /> : <ArrowDownLeft size={24} />}
              </div>

              <div className="w-12 h-12 bg-neutral-100 dark:bg-neutral-800 rounded-xl flex items-center justify-center overflow-hidden border border-neutral-200 dark:border-neutral-700">
                <img
                  src={getMinecraftItemImageUrl(Array.isArray(t.shop_items) ? t.shop_items[0]?.minecraft_item_id : t.shop_items?.minecraft_item_id || 'stone')}
                  alt=""
                  className="w-8 h-8 object-contain"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-black italic uppercase tracking-tight truncate">{Array.isArray(t.shop_items) ? t.shop_items[0]?.item_name : t.shop_items?.item_name || 'Removed Item'}</h3>
                  <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest italic ${t.type === 'buy' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                    {t.type === 'buy' ? 'PURCHASE' : 'SALE'}
                  </span>
                </div>
                <div className="text-xs font-bold text-neutral-500 mb-2">
                  Shop: {Array.isArray(t.shop_items) ? t.shop_items[0]?.player_shops?.name : t.shop_items?.player_shops?.name || 'Unknown Shop'} 
                  | Owner: {Array.isArray(t.shop_items) ? t.shop_items[0]?.player_shops?.profiles?.username : t.shop_items?.player_shops?.profiles?.username || 'Unknown'}
                </div>                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Calendar size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">
                      {new Date(t.transaction_time).toLocaleDateString()} {new Date(t.transaction_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-neutral-400">
                    <Package size={12} />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Qty: {t.quantity}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-10 pt-4 sm:pt-0 border-t sm:border-0 border-neutral-100 dark:border-white/5">
                <div className="text-left sm:text-right">
                  <span className="text-[8px] font-black text-neutral-400 block uppercase tracking-widest mb-1">{t.type === 'buy' ? 'Spent' : 'Earned'}</span>
                  <div className="flex items-center gap-2">
                    <Banknote size={14} className="text-strawberry-600" />
                    <span className="text-xl font-black italic text-neutral-900 dark:text-white uppercase tracking-tighter">
                      {t.price} {t.currency}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;
