import React, { useEffect, useRef } from 'react';

interface MapViewProps {
  lat: number;
  lng: number;
  onMapReady?: () => void;
}

// Declare AMap globally to satisfy TS
declare global {
  interface Window {
    AMap: any;
  }
}

const MapView: React.FC<MapViewProps> = ({ lat, lng, onMapReady }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    // Check if AMap is loaded
    if (!window.AMap) {
      console.warn("AMap script not loaded yet or API Key missing.");
      return;
    }

    if (mapContainerRef.current && !mapInstanceRef.current) {
      // Initialize Map
      mapInstanceRef.current = new window.AMap.Map(mapContainerRef.current, {
        zoom: 15,
        center: [lng, lat],
        viewMode: '2D', // Better performance for mobile prototype
        mapStyle: 'amap://styles/whitesmoke', // Clean style matches "Earth" theme
      });

      // Initialize User Marker
      markerRef.current = new window.AMap.Marker({
        position: [lng, lat],
        content: '<div style="font-size: 24px;">🏃</div>',
        offset: new window.AMap.Pixel(-12, -12),
      });
      mapInstanceRef.current.add(markerRef.current);

      if (onMapReady) onMapReady();
    }
  }, [onMapReady]);

  // Update position when props change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      const newPos = [lng, lat];
      markerRef.current.setPosition(newPos);
      mapInstanceRef.current.setCenter(newPos);
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-full bg-earth-200">
      {!window.AMap && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center z-10 bg-earth-100 opacity-90">
          <div>
            <h3 className="text-xl font-bold text-earth-800">地图加载中...</h3>
            <p className="text-sm mt-2 text-earth-600">如果长时间未显示，请检查网络或 Key 配置。</p>
          </div>
        </div>
      )}
      <div ref={mapContainerRef} id="amap-container" />
      
      {/* Aesthetic Overlay */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-earth-50/90 to-transparent pointer-events-none z-10" />
    </div>
  );
};

export default MapView;