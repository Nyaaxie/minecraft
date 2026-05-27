import { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';

const ServerInfoPage = () => {
  const [serverInfo, setServerInfo] = useState<any[]>([]);

  useEffect(() => {
    adminService.getServerInfo().then(data => {
      if (data) {
        setServerInfo(data);
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-xs font-black uppercase tracking-widest text-strawberry-600 mb-2">
            System Status
          </p>
          <h1 className="text-4xl sm:text-5xl font-black italic uppercase tracking-tighter text-neutral-900 dark:text-white">
            Server Information
          </h1>
          <p className="text-neutral-500 font-medium uppercase tracking-tight text-sm mt-2">
            Current season configuration and technical specifications
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
          {serverInfo.map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-between px-6 py-4 transition-colors ${i % 2 === 0
                  ? "bg-neutral-50/50 dark:bg-neutral-900/50"
                  : "bg-white dark:bg-neutral-900"
                }`}
            >
              <span className="text-xs font-black uppercase tracking-widest text-neutral-400">
                {item.label}
              </span>
              <span className="text-sm font-bold text-neutral-900 dark:text-white text-right">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-600 mt-8">
          Information is synchronized automatically.
        </p>
      </div>
    </div>
  );
};

export default ServerInfoPage;