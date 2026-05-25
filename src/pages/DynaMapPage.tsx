import { Map as MapIcon } from 'lucide-react';

const DynaMapPage = () => {
  const PROXY_MAP_URL = import.meta.env.DEV
    ? "http://strawberrysmp.mcplay.fun:25709/?world=world&renderer=vintage_story&zoom=2&x=-1004&z=442"
    : "https://minecraft-map-proxy.jamesbrizuela513.workers.dev/?world=world&renderer=vintage_story&zoom=2&x=-1004&z=442";

  return (
    <div className="h-[calc(100vh-6rem)] w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-strawberry-600 rounded-2xl text-white shadow-lg shadow-strawberry-600/20">
            <MapIcon size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">
              Live <span className="text-strawberry-600">Map</span>
            </h1>
            <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
              Real-time server satellite imagery active
            </p>
          </div>
        </div>
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
    </div>
  );
};

export default DynaMapPage;
