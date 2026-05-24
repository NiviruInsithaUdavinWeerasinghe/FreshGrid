const axios = require('axios');

/**
 * Fetches the distance in kilometers between two coordinates using the Google Maps Distance Matrix API.
 * @param {Number} originLat - Origin Latitude (e.g., Store location)
 * @param {Number} originLng - Origin Longitude
 * @param {Number} destLat - Destination Latitude (Customer location)
 * @param {Number} destLng - Destination Longitude
 * @returns {Promise<Number>} Distance in kilometers
 */
const getDistance = async (originLat, originLng, destLat, destLng) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Google Maps API key is missing.');
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${destLat},${destLng}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const data = response.data;

    if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
      // distance value is in meters, convert to km
      const distanceMeters = data.rows[0].elements[0].distance.value;
      return distanceMeters / 1000;
    } else {
      console.error('Google Maps API error response:', data);
      throw new Error('Could not calculate distance from Google Maps API.');
    }
  } catch (error) {
    console.error('Error fetching distance from Google Maps:', error.message);
    throw new Error('Distance calculation failed.');
  }
};

module.exports = {
  getDistance,
};
