import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Server, RefreshCw, Loader2 } from 'lucide-react';

const ServerInfoPage = () => {
  const [serverInfo, setServerInfo] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    adminService.getServerInfo().then(data => {
      if (data) setServerInfo(data);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="animate-spin text-strawberry-600" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto pb-20 px-4 sm:px-6 space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 px-2 mb-12">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20 text-strawberry-600">
            <Server size={32} />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
              Server Information
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
              Current season configuration and technical specifications.
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="px-6 py-4 bg-neutral-100 dark:bg-neutral-800 rounded-2xl hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-all font-black italic uppercase tracking-widest text-xs"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {serverInfo.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 dark:bg-neutral-900/50 rounded-3xl border border-neutral-200 dark:border-white/5">
          <Server size={48} className="mx-auto text-neutral-400 mb-4" />
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-sm">No server info available.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200 dark:border-white/5 shadow-xl shadow-neutral-900/5 overflow-hidden">

          {/* Card header */}
          <div className="p-8 border-b border-neutral-100 dark:border-white/5">
            <div>
              <h3 className="font-black italic uppercase tracking-tighter text-lg">Current Season Config</h3>
              <p className="text-xs text-neutral-500 mt-0.5 font-bold uppercase tracking-widest">
                {serverInfo.length} specifications
              </p>
            </div>
          </div>

          {/* Info rows */}
          <div className="divide-y divide-neutral-100 dark:divide-white/5">
            {serverInfo.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-6 px-8 py-4 hover:bg-neutral-50 dark:hover:bg-white/[0.02] transition-colors"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                  {item.label}
                </span>
                <span className="text-sm font-black italic uppercase tracking-tight text-neutral-900 dark:text-white text-right">
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-neutral-100 dark:border-white/5 bg-neutral-50 dark:bg-white/[0.02]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 text-center">
              Information
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServerInfoPage;