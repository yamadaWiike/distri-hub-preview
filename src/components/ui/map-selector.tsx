import { useCallback, useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { L } from '../../lib/leaflet-icon-fix';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

interface SearchResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

// Custom hook for address search
function useAddressSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAddress = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      // Use OpenStreetMap Nominatim API
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: query,
          format: 'json',
          addressdetails: 1,
          limit: 5,
          countrycodes: 'id', // Limit to Indonesia
          'accept-language': 'id', // Indonesian language results (as param to avoid CORS)
        },
      });
      
      setSearchResults(response.data);
    } catch (err) {
      console.error('Error searching address:', err);
      setError('Gagal mencari alamat. Silakan coba lagi.');
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  // Reverse geocoding - get address from coordinates
  const getAddressFromCoords = useCallback(async (lat: number, lng: number) => {
    setIsSearching(true);
    setError(null);
    
    try {
      // Use OpenStreetMap Nominatim API for reverse geocoding
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          lat: lat,
          lon: lng,
          format: 'json',
          addressdetails: 1,
          zoom: 18,
          'accept-language': 'id', // Indonesian language results (as param to avoid CORS)
        },
      });
      
      if (response.data && response.data.display_name) {
        return response.data.display_name;
      } else {
        throw new Error('No address found');
      }
    } catch (err) {
      console.error('Error getting address from coordinates:', err);
      setError('Gagal mendapatkan alamat dari koordinat.');
      return null;
    } finally {
      setIsSearching(false);
    }
  }, []);

  return { 
    searchTerm, 
    setSearchTerm, 
    searchAddress, 
    searchResults, 
    isSearching,
    error,
    getAddressFromCoords
  };
}

// Map click handler component
interface MapClickHandlerProps {
  onLocationSelected: (lat: number, lng: number) => void;
  onAddressFetched?: (address: string) => void;
  getAddressFromCoords?: (lat: number, lng: number) => Promise<string | null>;
  initialPosition?: [number, number];
}

function MapClickHandler({ 
  onLocationSelected, 
  onAddressFetched, 
  getAddressFromCoords,
  initialPosition 
}: MapClickHandlerProps) {
  const [position, setPosition] = useState<[number, number] | null>(initialPosition || null);
  
  const map = useMapEvents({
    click(e) {
      e.originalEvent.stopPropagation();
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);
      
      // Update the position
      onLocationSelected(lat, lng);
      
      // If we have the reverse geocoding function and address callback, use them
      if (getAddressFromCoords && onAddressFetched) {
        getAddressFromCoords(lat, lng).then(address => {
          if (address) {
            onAddressFetched(address);
          }
        });
      }
    },
  });

  useEffect(() => {
    if (initialPosition) {
      setPosition(initialPosition);
    }
  }, [initialPosition]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>Lokasi yang dipilih</Popup>
    </Marker>
  );
}

// Map recenter component
interface MapRecenterProps {
  position: [number, number];
}

function MapRecenter({ position }: MapRecenterProps) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(position, 16);
  }, [map, position]);
  
  return null;
}

interface MapSelectorProps {
  onLocationSelected: (lat: number, lng: number) => void;
  onAddressFound?: (address: string) => void;
  initialPosition?: string | null;
  readOnly?: boolean;
}

export default function MapSelector({ onLocationSelected, onAddressFound, initialPosition, readOnly = false }: MapSelectorProps) {
  const [mapPosition, setMapPosition] = useState<[number, number]>([-6.200000, 106.816666]); // Default to Jakarta
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showResults, setShowResults] = useState(false);
  const { 
    searchTerm, 
    setSearchTerm, 
    searchAddress, 
    searchResults, 
    isSearching, 
    error,
    getAddressFromCoords
  } = useAddressSearch();
  
  // Parse initialPosition if provided
  useEffect(() => {
    if (initialPosition) {
      try {
        const [lat, lng] = initialPosition.split(',').map(coord => parseFloat(coord.trim()));
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapPosition([lat, lng]);
          
          // Also fetch the address for the initial position
          getAddressFromCoords(lat, lng).then(address => {
            if (address) {
              setSearchTerm(address);
            }
          });
        }
      } catch (error) {
        console.error('Error parsing coordinates:', error);
      }
    }
  }, [initialPosition, getAddressFromCoords, setSearchTerm]);

  const handleLocationSelected = useCallback((lat: number, lng: number) => {
    setMapPosition([lat, lng]);
  }, []);
  
  const handleAddressFetched = useCallback((address: string) => {
    setSearchTerm(address);
    setShowResults(false);
    
    // Pass the address to the parent component if onAddressFound is provided
    if (onAddressFound) {
      onAddressFound(address);
    }
  }, [setSearchTerm, onAddressFound]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowResults(true);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchAddress(searchTerm);
    // Just show the search results without saving the location
  };

  const handleResultClick = (result: SearchResult, e: React.MouseEvent) => {
    // Stop event propagation to prevent the dialog from closing
    e.stopPropagation();
    e.preventDefault();
    
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    // Only update the map position but don't save the location yet
    setMapPosition([lat, lng]);
    setSearchTerm(result.display_name);
    setShowResults(false);
    
    // Pass the address to the parent component if onAddressFound is provided
    if (onAddressFound) {
      onAddressFound(result.display_name);
    }
  };
  
  // Save the currently selected location
  const handleSaveLocation = () => {
    // Extract lat/lng from current map position
    const [lat, lng] = mapPosition;
    onLocationSelected(lat, lng);
    // No need to close the dialog here as the parent component will handle it
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowResults(false);
    }
  };
  
  // Focus search input when component mounts
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  return (
    <div className="flex flex-col h-full">
      {!readOnly && (
        <div className="p-2 bg-background border-b relative z-10">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={handleSearchInput}
                onKeyDown={(e) => {
                  handleKeyDown(e);
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    searchAddress(searchTerm);
                  }
                }}
                onFocus={() => setShowResults(true)}
                placeholder="Cari alamat..."
                className="w-full px-3 py-2 rounded-md border text-sm"
              />
              {showResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg mt-1 max-h-60 overflow-auto z-20 search-results-dropdown">
                  {searchResults.map(result => (
                    <button
                      key={result.place_id}
                      type="button"
                      onClick={(e) => handleResultClick(result, e)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted/50 border-b last:border-0"
                    >
                      {result.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                searchAddress(searchTerm);
              }}
              className="px-3 py-2 rounded-md bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/90 transition-colors"
              disabled={isSearching || !searchTerm.trim()}
            >
              {isSearching ? 'Mencari...' : 'Cari'}
            </button>
          </div>
          {error && (
            <p className="text-xs text-destructive mt-1">{error}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Cari alamat, klik hasil pencarian, atau langsung klik pada peta untuk memilih lokasi.
          </p>
        </div>
      )}
      <div className="flex-1 relative">
        <div 
          className="h-[310px] rounded-md"
          onClick={(e) => e.stopPropagation()} // Stop propagation on container
        >
          <MapContainer 
            center={mapPosition} 
            zoom={13} 
            scrollWheelZoom={!readOnly} 
            className="h-full w-full"
            dragging={!readOnly}
            touchZoom={!readOnly}
            doubleClickZoom={!readOnly}
            boxZoom={!readOnly}
            keyboard={!readOnly}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={mapPosition}>
              <Popup>
                {readOnly ? 'Lokasi Gudang' : 'Lokasi yang dipilih'}
              </Popup>
            </Marker>
            {!readOnly && (
              <MapClickHandler 
                onLocationSelected={(lat, lng) => {
                  setMapPosition([lat, lng]);
                  onLocationSelected(lat, lng);
                }} 
                onAddressFetched={handleAddressFetched}
                getAddressFromCoords={getAddressFromCoords}
                initialPosition={mapPosition} 
              />
            )}
            <MapRecenter position={mapPosition} />
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
