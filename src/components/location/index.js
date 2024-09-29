import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, LoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { ref, onValue } from 'firebase/database';  // Firebase Realtime Database
import { database } from '../../firebase';  // Firebase config
import MetadataForm from './form';  // Import the form component
import './form/form.css';  // Import the form's CSS

const mapContainerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = {
  lat: 40.712776, // Default latitude (New York City)
  lng: -74.005974, // Default longitude (New York City)
};

const SearchAllPage = () => {
  const [currentLocation, setCurrentLocation] = useState(null);  // Store user's location
  const [clickedLocation, setClickedLocation] = useState(null);  // Store clicked map location
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);  // Control drawer visibility
  const [address, setAddress] = useState('');  // Store address from reverse geocoding
  const [markers, setMarkers] = useState([]);  // Store markers retrieved from Firebase
  const [selectedMarker, setSelectedMarker] = useState(null);  // For showing info windows

  // Function to reverse geocode lat/lng to an address
  const getAddressFromLatLng = useCallback(async (lat, lng) => {
    const geocoder = new window.google.maps.Geocoder();
    try {
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results.length > 0) {
        return response.results[0].formatted_address;
      }
      return 'Address not found';
    } catch (error) {
      console.error("Error fetching address: ", error);
      return 'Address not found';
    }
  }, []);

  // Get user's current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {
          setCurrentLocation(defaultCenter);  // Fallback to default if denied
        }
      );
    } else {
      setCurrentLocation(defaultCenter);  // Fallback to default if not supported
    }
  }, []);

  // Retrieve data from Firebase Realtime Database
  useEffect(() => {
    const storeRef = ref(database, 'foodStores');
    
    // Use onValue to listen for real-time updates
    onValue(storeRef, (snapshot) => {
      const data = snapshot.val();
      const markerData = [];

      for (let key in data) {
        const { lat, lng, quantity, storeName } = data[key];
        if (quantity >= 1) {  // Only show entries with quantity >= 1
          markerData.push({
            lat,
            lng,
            quantity,
            storeName,
          });
        }
      }
      setMarkers(markerData);  // Update state with new markers
    });
  }, []);

  // Handle map click to get lat/lng and reverse geocode address
  const handleMapClick = async (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    
    setClickedLocation({ lat, lng });
    setIsDrawerOpen(false);  // Hide the drawer if it's open

    const fetchedAddress = await getAddressFromLatLng(lat, lng);  // Reverse geocode address
    setAddress(fetchedAddress);  // Store the fetched address
  };

  // Handle "Add Metadata" click to show the drawer
  const handleAddMetadata = () => {
    setIsDrawerOpen(true);  // Open the drawer
  };

  // Handle form submission (clears clicked location and hides the drawer)
  const handleFormSubmit = () => {
    setClickedLocation(null);
    setIsDrawerOpen(false);  // Close the drawer after form submission
  };

  // Handle drawer cancellation (close the drawer)
  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);  // Close the drawer
  };

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Rescue Food</h1>
      
      <LoadScript googleMapsApiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={['places']}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={currentLocation || defaultCenter}
          zoom={12}
          onClick={handleMapClick}  // Handle map clicks
        >
          {/* Display real-time markers from Firebase */}
          {markers.map((marker, index) => (
            <Marker 
              key={index}
              position={{ lat: marker.lat, lng: marker.lng }}
              label={{
                text: marker.quantity.toString(),
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px',
              }}
              icon={{
                url: "http://maps.google.com/mapfiles/ms/icons/red-dot.png", // You can use a custom icon
              }}
              onClick={() => setSelectedMarker(marker)}  // Set the selected marker for InfoWindow
            >
              {/* Show InfoWindow only if this marker is selected */}
              {selectedMarker === marker && (
                <InfoWindow
                  position={{ lat: marker.lat, lng: marker.lng }}
                  onCloseClick={() => setSelectedMarker(null)}  // Close the InfoWindow
                >
                  <div>
                    <h4>{marker.storeName}</h4>
                    <p>Quantity: {marker.quantity}</p>
                  </div>
                </InfoWindow>
              )}
            </Marker>
          ))}

          {/* Marker for clicked location */}
          {clickedLocation && (
            <Marker position={clickedLocation} />
          )}

          {/* Context menu for adding metadata */}
          {clickedLocation && !isDrawerOpen && (
            <InfoWindow
              position={clickedLocation}
              onCloseClick={() => setClickedLocation(null)}  // Close menu
            >
              <div>
                <button onClick={handleAddMetadata}>Add Metadata</button>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </LoadScript>

      {/* Show the metadata form as a sliding drawer */}
      <MetadataForm
        isOpen={isDrawerOpen}
        clickedLocation={clickedLocation}
        address={address}  // Pass the fetched address as a prop
        onFormSubmit={handleFormSubmit}  // Pass form submit handler
        onClose={handleCloseDrawer}  // Pass close drawer handler
      />
    </div>
  );
};

export default SearchAllPage;
