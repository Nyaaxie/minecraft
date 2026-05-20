const DynaMapPage = () => {
  return (
    <div className="h-[calc(100vh-8rem)] w-full rounded-3xl overflow-hidden border border-neutral-800 bg-neutral-900 shadow-2xl">
      <iframe 
        src="http://strawberrysmp.mcplay.fun:25709/?world=world&renderer=vintage_story&zoom=2&x=-1004&z=442" 
        className="h-full w-full border-none"
        title="StrawberrySMP DynaMap"
        allowFullScreen
      />
    </div>
  );
};

export default DynaMapPage;
