import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { Location } from '../types';
import { formatTime } from '../utils/format';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LocationMapProps {
  locations: Location[];
}

export function LocationMap({ locations }: LocationMapProps) {
  if (locations.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Brak danych lokalizacji z tego dnia
      </div>
    );
  }

  // Calculate center and bounds
  const center: [number, number] = [
    locations.reduce((sum, loc) => sum + loc.latitude, 0) / locations.length,
    locations.reduce((sum, loc) => sum + loc.longitude, 0) / locations.length,
  ];

  const positions: [number, number][] = locations.map(loc => [loc.latitude, loc.longitude]);

  return (
    <div className="h-96 rounded-lg overflow-hidden shadow-md">
      <MapContainer center={center} zoom={13} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Draw path */}
        {locations.length > 1 && (
          <Polyline positions={positions} color="blue" weight={3} opacity={0.7} />
        )}

        {/* Show markers for significant points */}
        {locations
          .filter((_, index) => index % Math.ceil(locations.length / 10) === 0)
          .map((location) => (
            <Marker key={location.id} position={[location.latitude, location.longitude]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{formatTime(location.timestamp)}</p>
                  {location.address && <p>{location.address}</p>}
                  {location.speed && (
                    <p>Prędkość: {(location.speed * 3.6).toFixed(1)} km/h</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
}
