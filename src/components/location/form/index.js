import React, { useState, useEffect } from 'react';
import { ref, set } from 'firebase/database';  // For Firebase Realtime Database
import { database } from '../../../firebase';  // Import your Firebase Realtime Database instance
import usePlacesAutocomplete, { getGeocode } from 'use-places-autocomplete';  // For Places API

const MetadataForm = ({ clickedLocation, onFormSubmit, onClose, isOpen }) => {
  const [storeName, setStoreName] = useState('');  // Store name
  const [quantity, setQuantity] = useState('');  // Quantity
  const [description, setDescription] = useState('');  // Description
  const [addressValue, setAddressValue] = useState('');  // Address field for auto-fill
  const [loading, setLoading] = useState(false);  // Loading state for address

  // Places Autocomplete setup
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {},
    debounce: 300,
  });

  // Reverse geocode clicked location to get address
  useEffect(() => {
    if (clickedLocation) {
      const fetchAddress = async () => {
        try {
          setLoading(true);  // Start loading
          const results = await getGeocode({ location: clickedLocation });
          if (results.length > 0) {
            setAddressValue(results[0].formatted_address);  // Set the address from lat/lng
          } else {
            setAddressValue('Address not found');
          }
        } catch (error) {
          console.error("Error fetching address: ", error);
          setAddressValue('Address not found');
        } finally {
          setLoading(false);  // End loading
        }
      };
      fetchAddress();
    }
  }, [clickedLocation]);

  // Handle form submission with validation
  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!storeName || !quantity || !description) {
      alert("All fields are required.");
      return;
    }

    if (!clickedLocation) {
      alert("Please select a location on the map.");
      return;
    }

    try {
      // Replace '.' with '_' to avoid invalid path errors
      const sanitizedLat = clickedLocation.lat.toString().replace(/\./g, '_');
      const sanitizedLng = clickedLocation.lng.toString().replace(/\./g, '_');
      const storeRef = ref(database, `foodStores/${sanitizedLat}_${sanitizedLng}`);
        alert("My name")
      // Add metadata to Firebase Realtime Database
      await set(storeRef, {
        lat: clickedLocation.lat,
        lng: clickedLocation.lng,
        address: addressValue,  // Use the auto-filled address
        storeName,
        quantity: Number(quantity),
        description,
      });

      alert("Metadata added successfully!");
      setStoreName('');
      setDescription('');
      setQuantity('');
      // Let the parent component know that the form was submitted
      onFormSubmit();  // Trigger the parent to clear and close the form
      onClose();  // Close the drawer
      
    } catch (error) {
        alert("Some eror")
      console.error("Error adding metadata: ", error);
    }
  };

  // Handle address selection from autocomplete
  const handleSelectAddress = async (suggestion) => {
    setValue(suggestion.description, false);  // Set the selected address in the input field
    clearSuggestions();  // Clear the suggestions list

    try {
      const results = await getGeocode({ address: suggestion.description });
      setAddressValue(suggestion.description);  // Set the address manually from the suggestion
    } catch (error) {
      console.log("Error fetching address: ", error);
    }
  };

  return (
    <>
      {isOpen && <div className="drawer-overlay" onClick={onClose}></div>}

      <div className={`metadata-form-container sideways-drawer ${isOpen ? 'open' : ''}`}>
        <h3>Add Store Metadata</h3>
        {loading ? <p>Loading address...</p> : null}
        <form onSubmit={handleFormSubmit} className="metadata-form">
          <div className="form-group">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              type="text"
              value={addressValue || value}  // Auto-fill with reverse geocoded address or input value
              onChange={(e) => setValue(e.target.value)}  // Allow user to manually input address
              className="form-input"
              aria-label="Address"
              placeholder="Search for an address"
              required
            />
            {status === "OK" && (
              <ul className="address-suggestions">
                {data.map((suggestion) => (
                  <li key={suggestion.place_id} onClick={() => handleSelectAddress(suggestion)}>
                    {suggestion.description}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="storeName">Store Name</label>
            <input
              id="storeName"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Enter store name"
              required
              className="form-input"
              aria-label="Store Name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
              className="form-input"
              aria-label="Quantity"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter description"
              required
              className="form-input"
              aria-label="Description"
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="submit-btn">Submit</button>
            <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
          </div>
        </form>
      </div>
    </>
  );
};

export default MetadataForm;
