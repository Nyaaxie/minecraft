import { Store } from 'lucide-react';

const DynaMapPage = () => {
  const DYNAMAP_URL = "http://strawberrysmp.mcplay.fun:25709/?world=world&renderer=vintage_story&zoom=2&x=-1004&z=442";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full gap-6 items-center justify-center p-8 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl text-neutral-900 dark:text-neutral-100">
      <div className="w-24 h-24 rounded-3xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden border border-neutral-200 dark:border-neutral-700 shadow-2xl">
        <Store size={48} className="text-strawberry-600 dark:text-strawberry-500" />
      </div>
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-neutral-900 dark:text-white italic uppercase">Live Server Map</h2>
        <p className="text-neutral-600 dark:text-neutral-400 max-w-sm">
          Due to security restrictions, the map must be opened in a new secure window.
        </p>
      </div>
      <button 
        onClick={() => window.open(DYNAMAP_URL, '_blank', 'noopener,noreferrer')}
        className="px-8 py-4 bg-strawberry-600 text-white rounded-2xl font-black hover:bg-strawberry-700 transition-all shadow-xl shadow-strawberry-600/20 active:scale-95 italic uppercase"
      >
        Open Live Map
      </button>
    </div>
  );
};

export default DynaMapPage;
