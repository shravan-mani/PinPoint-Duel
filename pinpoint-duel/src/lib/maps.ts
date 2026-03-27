export const calculatePoints = (distanceInMeters: number): number => {
  const distanceInKm = distanceInMeters / 1000;
  const points = Math.round(5000 * Math.exp(-distanceInKm / 2000));
  return Math.max(0, points);
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

let mapsPromise: Promise<void> | null = null;

export const loadGoogleMaps = (): Promise<void> => {
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  if (mapsPromise) {
    return mapsPromise;
  }

  mapsPromise = new Promise((resolve, reject) => {
    // SECURITY NOTE: The Google Maps JS API key must be exposed to the client.
    // To prevent quota abuse, you MUST restrict this key in the Google Cloud Console
    // to only allow requests from your specific domain (HTTP referrers).
    // For other APIs (like Geocoding or Places), consider using a backend proxy relay.
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('VITE_GOOGLE_MAPS_API_KEY is missing'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry,marker`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      mapsPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };
    document.head.appendChild(script);
  });

  return mapsPromise;
};
