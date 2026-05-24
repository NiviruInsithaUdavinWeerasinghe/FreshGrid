/**
 * Calculates the delivery fee based on distance, total cart weight, and potential subsidies.
 * 
 * @param {Number} distanceKm - Distance in kilometers
 * @param {Number} totalWeightKg - Total weight of cart in kilograms
 * @param {Object} overrides - Subsidies to apply
 * @returns {Number} Calculated delivery fee in LKR
 */
const calculateDeliveryFee = (distanceKm, totalWeightKg, overrides = {}) => {
  const BASE_FEE = overrides.waiveBaseFee ? 0 : 150;
  const DISTANCE_RATE = 20; // LKR per km
  const WEIGHT_RATE = overrides.discountedWeightRate !== undefined && overrides.discountedWeightRate !== null 
    ? overrides.discountedWeightRate 
    : 30; // LKR per kg

  const distanceCost = distanceKm * DISTANCE_RATE;
  const weightCost = totalWeightKg * WEIGHT_RATE;

  const totalFee = BASE_FEE + distanceCost + weightCost;
  
  // Return rounded to 2 decimal places
  return Number(totalFee.toFixed(2));
};

module.exports = {
  calculateDeliveryFee,
};
