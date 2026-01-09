import React, { useEffect, useRef, useState } from 'react';

interface MapViewProps {
  lat: number;
  lng: number;
  onMapReady?: () => void;
}

// Declare Leaflet globally
declare global {
  interface Window {
    L: any;
  }
}

const MapView: React.FC<MapViewProps> = ({ lat, lng, onMapReady }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  // Check for Leaflet loading
  useEffect(() => {
    const checkLeaflet = setInterval(() => {
      if (window.L) {
        setIsMapLoaded(true);
        clearInterval(checkLeaflet);
      }
    }, 100);
    return () => clearInterval(checkLeaflet);
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!isMapLoaded || !mapContainerRef.current || mapInstanceRef.current) return;

    try {
      // Initialize Leaflet Map
      // Note: Leaflet uses [lat, lng], AMap JS API used [lng, lat]
      const map = window.L.map(mapContainerRef.current, {
        center: [lat, lng],
        zoom: 15,
        zoomControl: false, // We'll hide controls for a cleaner "Game" feel
        attributionControl: true // Keep attribution for legal reasons, but styled smaller
      });

      // Add AMap (Gaode) Tile Layer
      // Using webrd01-04 subdomains for load balancing
      window.L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
        subdomains: ['1', '2', '3', '4'],
        minZoom: 3,
        maxZoom: 18,
        attribution: '&copy; 高德地图'
      }).addTo(map);

      // Custom Emoji Marker
      const icon = window.L.divIcon({
        html: '<div style="font-size: 32px; line-height: 1; text-shadow: 0 2px 4px rgba(0,0,0,0.2);">🏃</div>',
        className: 'custom-div-icon', // Defined in index.html
        iconSize: [32, 32],
        iconAnchor: [16, 24] // Center bottom-ish
      });

      const marker = window.L.marker([lat, lng], { icon }).addTo(map);

      mapInstanceRef.current = map;
      markerRef.current = marker;

      if (onMapReady) onMapReady();
    } catch (error) {
      console.error("Failed to initialize Map:", error);
    }
    
    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isMapLoaded]); // Run once when loaded

  // Update position when props change
  useEffect(() => {
    if (mapInstanceRef.current && markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
      mapInstanceRef.current.panTo([lat, lng]);
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-full bg-earth-200">
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center p-4 text-center z-10 bg-earth-100 opacity-90">
          <div>
            <h3 className="text-xl font-bold text-earth-800 animate-pulse">地图资源加载中...</h3>
          </div>
        </div>
      )}
      
      {/* Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />
      
      {/* Aesthetic Overlay - Top Gradient */}
      <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-earth-50/90 to-transparent pointer-events-none z-10" />
      
      {/* Location Info Overlay (Optional Game UI) */}
      <div className="absolute bottom-20 right-4 z-10 pointer-events-none">
        <div className="bg-white/80 backdrop-blur px-2 py-1 rounded text-[10px] text-earth-600 font-mono shadow-sm">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </div>
      </div>
    </div>
  );
};

export default MapView;