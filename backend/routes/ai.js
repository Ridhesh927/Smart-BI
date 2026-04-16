const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

let groq;
const getGroqClient = () => {
  if (!groq) {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
      throw new Error('GROQ_API_KEY is missing or invalid. Please check your .env file.');
    }
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groq;
};

router.post('/suggest', async (req, res) => {
  // ... existing suggest logic ...
});

// Alias for Studio.jsx compatibility
router.post('/generate-chart', async (req, res) => {
  const { prompt, schema } = req.body;

  if (!prompt || !schema) {
    return res.status(400).json({ success: false, message: 'Prompt and schema are required' });
  }

  try {
    const systemPrompt = `
      You are an expert Data Scientist and BI Assistant. 
      Your task is to take a natural language prompt and a dataset schema, then suggest a visualization configuration.
      
      SCHEMA:
      Dimensions: ${schema.dimensions.map(d => d.name).join(', ')}
      Measures: ${schema.measures.map(m => m.name).join(', ')}
      
      RULES:
      1. ONLY return a JSON object.
      2. Suggest 'columns' (array of dimension names) and 'rows' (array of measure names).
      3. Suggest a 'chartType' (bar, line, pie, map, scatter).
      4. Suggest a 'title' for the chart.
      5. If the user asks for mapping, prioritize geographic dimensions in columns.
      6. Use exactly the column names provided in the schema.

      RESPONSE FORMAT:
      {
        "columns": ["DimensionName"],
        "rows": ["MeasureName"],
        "chartType": "bar",
        "title": "Sales by Region"
      }
    `;

    const suggestionClient = getGroqClient();
    const completion = await suggestionClient.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.2,
      response_format: { type: "json_object" }
    });

    const suggestion = JSON.parse(completion.choices[0].message.content);
    res.json({ success: true, suggestion });

  } catch (error) {
    console.error('AI Suggestion Error:', error);
    res.status(500).json({ success: false, message: 'AI failed to generate suggestion' });
  }
});

module.exports = router;
