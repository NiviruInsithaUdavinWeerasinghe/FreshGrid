const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Uses Gemini API to estimate the unit and weight of a product based on its details.
 * @param {string} name - The product name
 * @param {string} category - The product category
 * @param {string} description - The product description
 * @returns {Promise<{unit: string, weightPerUnit: number}>}
 */
const estimateProductMetrics = async (name, category, description) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables.');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    // Using gemini-2.5-flash which might have a higher free tier limit
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an expert grocer and supply chain analyst. I need you to estimate the most sensible unit of measure and weight-per-unit (in kg) for a grocery product based on its name, category, and description.

Product Details:
- Name: "${name}"
- Category: "${category}"
- Description: "${description}"

Rules:
1. "unit" MUST be exactly one of the following strings: "kg", "g", "L", "ml", "piece", "dozen", "pack".
2. "weightPerUnit" MUST be a number representing the estimated weight in kilograms. For liquids (L/ml), assume 1L ≈ 1kg.
3. "price" MUST be a number representing a sensible, average market price for this product in Sri Lankan Rupees (LKR) for the estimated unit and weight.
4. Return ONLY a valid JSON object with the keys "unit", "weightPerUnit", and "price". No markdown formatting, no code blocks, just raw JSON.
`;

    console.log(`\n[Gemini AI] Requesting metrics for: "${name}"...`);
    const startTime = Date.now();

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    
    const durationMs = Date.now() - startTime;
    console.log(`[Gemini AI] Response received in ${durationMs}ms`);
    console.log(`[Gemini AI] Raw Output:`, responseText);

    // Remove potential markdown code blocks if the model ignored the rule
    const cleanedText = responseText.replace(/```json/i, '').replace(/```/g, '').trim();
    
    const data = JSON.parse(cleanedText);
    
    // Validate unit against enum
    const allowedUnits = ['kg', 'g', 'L', 'ml', 'piece', 'dozen', 'pack'];
    if (!allowedUnits.includes(data.unit)) {
      data.unit = 'piece'; // fallback
    }

    // Ensure weight is a valid positive number
    if (typeof data.weightPerUnit !== 'number' || data.weightPerUnit <= 0 || isNaN(data.weightPerUnit)) {
      data.weightPerUnit = 1; // fallback
    }

    // Ensure price is a valid positive number
    if (typeof data.price !== 'number' || data.price <= 0 || isNaN(data.price)) {
      data.price = 100; // fallback base price
    }

    return {
      unit: data.unit,
      weightPerUnit: Number(data.weightPerUnit.toFixed(3)),
      price: Math.round(data.price)
    };
  } catch (error) {
    console.error('Gemini API Error:', error.message);
    throw new Error('Failed to estimate product metrics using AI.');
  }
};

module.exports = {
  estimateProductMetrics
};
