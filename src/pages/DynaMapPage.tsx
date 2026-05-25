import { Map as MapIcon, Maximize2 } from 'lucide-react';

const DynaMapPage = () => {
  const PROXY_MAP_URL = "/live-map/?world=world&renderer=vintage_story&zoom=2&x=-1004&z=442";

  return (
    <div className="h-[calc(100vh-10rem)] w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-strawberry-600 rounded-2xl text-white shadow-lg shadow-strawberry-600/20">
            <MapIcon size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">
              Tactical <span className="text-strawberry-600">Map</span>
            </h1>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              Real-time server satellite imagery active
            </p>
          </div>
        </div>

        <button
          onClick={() => window.open(PROXY_MAP_URL, '_blank', 'noopener,noreferrer')}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:text-strawberry-600 transition-colors shadow-md"
        >
          <Maximize2 size={14} /> Fullscreen
        </button>
      </div>

      {/* Map iframe */}
      <div className="flex-1 w-full bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-white/5 overflow-hidden shadow-2xl relative">
        <iframe
          src={PROXY_MAP_URL}
          className="w-full h-full border-none"
          title="Minecraft Live Map"
          allowFullScreen
        />
        <div className="absolute inset-0 pointer-events-none border-[12px] border-black/5 rounded-[2.5rem]" />
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