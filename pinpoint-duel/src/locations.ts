export const getRandomCoordinates = () => {
  // Generate random coordinates
  // Lat: -60 to 70 (avoiding poles for better street view hits)
  // Lng: -180 to 180
  const lat = Math.random() * 130 - 60;
  const lng = Math.random() * 360 - 180;
  return { lat, lng };
};
