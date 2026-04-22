import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../services/firebase';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet setup to fix missing marker icons in React
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Helper component to auto-recenter map when live coordinates update
function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  return null;
}

const MapView = ({ lat, lng, uid }) => {
  const [liveLocation, setLiveLocation] = useState({ lat, lng });

  // Sync initial static props
  useEffect(() => {
    if (lat && lng) {
      setLiveLocation({ lat, lng });
    }
  }, [lat, lng]);

  // Sync real-time firestore movements if viewing as Contact
  useEffect(() => {
    if (!uid) return;

    const unsubscribe = onSnapshot(doc(db, 'liveLocations', uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.location?.latitude && data.location?.longitude) {
          setLiveLocation({ 
            lat: data.location.latitude, 
            lng: data.location.longitude 
          });
        }
      }
    });

    return () => unsubscribe(); // Snapshot cleanup memory leak fix
  }, [uid]);

  // Show fallback if no location yet
  if (!liveLocation.lat || !liveLocation.lng) {
    return (
      <div className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center py-10 gap-3">
        <span className="text-4xl">📍</span>
        <p className="text-sm font-semibold text-gray-600">Location unavailable</p>
        <p className="text-xs text-gray-400 text-center px-4">
          Enable location permission in your browser to see the live map.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl overflow-hidden border-2 border-gray-200 shadow-sm relative z-0">
      <MapContainer
        center={[liveLocation.lat, liveLocation.lng]}
        zoom={15}
        style={{ height: '300px', width: '100%', zIndex: 0 }}
        zoomControl={false}
      >
        <MapUpdater center={[liveLocation.lat, liveLocation.lng]} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <Marker position={[liveLocation.lat, liveLocation.lng]} />
      </MapContainer>
    </div>
  );
};

export default MapView;
