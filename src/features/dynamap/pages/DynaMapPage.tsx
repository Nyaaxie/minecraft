import { Map as MapIcon } from 'lucide-react';

const DynaMapPage = () => {
  const PROXY_MAP_URL = import.meta.env.DEV
    ? "http://strawberrysmp.mcplay.fun:25709/?world=world&renderer=vintage_story&zoom=2&x=-1004&z=442"
    : `${import.meta.env.VITE_MAP_PROXY_URL}/?world=world&renderer=vintage_story&zoom=2&x=-1004&z=442`;

  return (
    <div className="h-[calc(100vh-6rem)] w-full flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between px-2 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-strawberry-600/10 rounded-3xl flex items-center justify-center border border-strawberry-600/20 text-strawberry-600">
            <MapIcon size={32} />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
              Live Map
            </h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-400 mt-1">
              Watch our cozy world bloom!
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
    </div >
  );
};

export default DynaMapPage;
