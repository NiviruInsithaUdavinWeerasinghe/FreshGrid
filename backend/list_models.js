const dotenv = require('dotenv');
dotenv.config();

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  let allModels = [];
  let pageToken = '';
  do {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const response = await fetch(url);
    const result = await response.json();
    if (result.models) {
      allModels.push(...result.models.map(m => m.name));
    }
    pageToken = result.nextPageToken || '';
  } while (pageToken);
  console.log(JSON.stringify(allModels, null, 2));
}

listModels();
