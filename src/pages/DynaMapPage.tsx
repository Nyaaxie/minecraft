import { useState, useEffect, useRef } from 'react';
import { Loader2, Maximize2, RefreshCw, MousePointer2, Map as MapIcon } from 'lucide-react';

const DynaMapPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Handle timeout for loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setHasError(true);
        setIsLoading(false);
      }
    }, 15000); // 15s timeout

    return () => clearTimeout(timer);
  }, [isLoading]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    if (iframeRef.current) {
      // eslint-disable-next-line no-self-assign
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const unlockMap = () => {
    setIsLocked(false);
  };

  const DYNAMAP_URL = import.meta.env.VITE_DYNAMAP_URL || "http://strawberrysmp.mcplay.fun:25709/?world=world&renderer=vintage_story&zoom=2&x=-1004&z=442";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] w-full gap-4">
      {/* Header Info - Desktop Only */}
      <div className="hidden md:flex items-center justify-between px-2">
        <div className="flex items-center gap-2 text-neutral-400">
          <MapIcon size={18} />
          <span className="text-sm font-medium">Live Server Map</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-neutral-500">StrawberrySMP • v1.20.1</span>
          <button 
            onClick={handleRetry}
            className="p-2 hover:bg-neutral-800 rounded-lg transition-colors text-neutral-400 hover:text-white"
            title="Refresh Map"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="relative flex-1 w-full rounded-2xl md:rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-neutral-900/80 backdrop-blur-sm">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-strawberry-500/20 blur-xl rounded-full animate-pulse" />
              <Loader2 className="relative w-12 h-12 text-strawberry-500 animate-spin" />
            </div>
            <p className="text-neutral-400 animate-pulse font-medium">Connecting to Dynmap...</p>
            <p className="text-neutral-600 text-xs mt-2">Fetching server tiles</p>
          </div>
        )}

        {/* Error Overlay */}
        {hasError && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-900 p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20">
              <RefreshCw className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-semibold mb-2">Connection Timeout</h3>
            <p className="text-neutral-400 text-sm mb-6 max-w-xs">
              The map server is taking too long to respond. This might be due to server maintenance or slow network.
            </p>
            <button
              onClick={handleRetry}
              className="px-6 py-2.5 bg-strawberry-500 hover:bg-strawberry-600 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg shadow-strawberry-500/20 active:scale-95"
            >
              <RefreshCw size={18} />
              Retry Connection
            </button>
          </div>
        )}

        {/* Mobile Interaction Guard */}
        {isLocked && !isLoading && !hasError && (
          <div 
            className="absolute inset-0 z-10 md:hidden flex flex-col items-center justify-center bg-neutral-900/40 backdrop-blur-[2px] cursor-pointer group"
            onClick={unlockMap}
          >
            <div className="bg-neutral-800/90 border border-neutral-700 p-4 rounded-2xl shadow-2xl transform transition-all group-hover:scale-105 active:scale-95">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-strawberry-500 flex items-center justify-center text-white">
                  <MousePointer2 size={24} />
                </div>
                <div className="text-center">
                  <p className="text-white font-bold">Tap to Explore</p>
                  <p className="text-neutral-400 text-xs">Unlocks map interactions</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <iframe 
          ref={iframeRef}
          src={DYNAMAP_URL} 
          className={`h-full w-full border-none transition-opacity duration-700 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          title="StrawberrySMP DynaMap"
          onLoad={handleLoad}
          loading="lazy"
          allow="fullscreen; clipboard-read; clipboard-write"
        />

        {/* Quick Actions Overlay - Bottom Right */}
        {!isLoading && !hasError && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-10">
            <button 
              onClick={() => iframeRef.current?.requestFullscreen()}
              className="p-3 bg-neutral-800/90 hover:bg-strawberry-500 border border-neutral-700 text-white rounded-xl shadow-xl transition-all hover:scale-110 active:scale-90"
              title="Toggle Fullscreen"
            >
              <Maximize2 size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynaMapPage;

