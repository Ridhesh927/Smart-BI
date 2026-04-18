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

const normalizeArray = (value) => Array.isArray(value) ? value : [];

const buildSuggestSystemPrompt = ({ schema, profile }) => {
  const dimensions = normalizeArray(schema?.dimensions);
  const measures = normalizeArray(schema?.measures);
  const profileColumns = normalizeArray(profile?.columns);
  const qualityScore = Number(profile?.qualityScore ?? 100);
  const rowCount = Number(profile?.totalRows ?? 0);

  return `
You are an expert BI analyst focused on producing clean, readable dashboard recommendations.

Your job:
1. Read the user's prompt.
2. Study the dataset schema and profile.
3. Choose the clearest chart setup.
4. Recommend which fields should be used and which filters would improve readability.
5. Avoid clutter, noisy fields, and weak chart choices.

DATASET SCHEMA
Dimensions:
${dimensions.map((d) => `- ${d.name}`).join('\n') || '- None'}

Measures:
${measures.map((m) => `- ${m.name}`).join('\n') || '- None'}

DATA PROFILE
- qualityScore: ${qualityScore}
- totalRows: ${rowCount}
${profileColumns.map((col) => `- ${col.name}: type=${col.dataType}, nullPercent=${col.nullPercent}, uniqueCount=${col.uniqueCount}, sampleValues=${normalizeArray(col.sampleValues).join(' | ') || 'n/a'}`).join('\n')}

DECISION RULES
- Prefer one dimension + one measure for the clearest default chart.
- Use line charts for time-like fields such as year, month, date.
- Use bar charts for category comparisons.
- Use pie only for a small number of categories, ideally <= 5.
- Use scatter only when two meaningful numeric measures exist.
- Recommend filters that reduce clutter, such as time period, region, department, category, segment, or top-level grouping.
- Avoid recommending fields with very high nullPercent when cleaner alternatives exist.
- Avoid too many dimensions or too many measures unless the prompt explicitly asks for that.
- Only use exact field names from the schema.
- If a field is risky for readability, mention it in avoidedFields.

Return ONLY valid JSON in this exact shape:
{
  "columns": ["DimensionName"],
  "rows": ["MeasureName"],
  "chartType": "bar",
  "title": "Readable chart title",
  "summary": "One short sentence explaining the recommendation.",
  "recommendedFilters": [
    {
      "field": "DimensionName",
      "reason": "Why this filter would make the chart cleaner",
      "priority": "high"
    }
  ],
  "avoidedFields": [
    {
      "field": "FieldName",
      "reason": "Why this field is not ideal for clarity"
    }
  ],
  "tips": [
    "Short practical tip 1",
    "Short practical tip 2"
  ]
}
`;
};

const createSuggestion = async ({ prompt, schema, profile }) => {
  const suggestionClient = getGroqClient();
  const completion = await suggestionClient.chat.completions.create({
    messages: [
      { role: "system", content: buildSuggestSystemPrompt({ schema, profile }) },
      { role: "user", content: prompt }
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.2,
    response_format: { type: "json_object" }
  });

  return JSON.parse(completion.choices[0].message.content);
};

router.post('/suggest', async (req, res) => {
  const { prompt, schema, profile } = req.body;

  if (!prompt || !schema) {
    return res.status(400).json({ success: false, message: 'Prompt and schema are required' });
  }

  try {
    const suggestion = await createSuggestion({ prompt, schema, profile });
    res.json({ success: true, suggestion });
  } catch (error) {
    console.error('AI Suggest Error:', error);
    res.status(500).json({ success: false, message: 'AI failed to generate suggestion' });
  }
});

// Alias for Studio.jsx compatibility
router.post('/generate-chart', async (req, res) => {
  const { prompt, schema, profile } = req.body;

  if (!prompt || !schema) {
    return res.status(400).json({ success: false, message: 'Prompt and schema are required' });
  }

  try {
    const suggestion = await createSuggestion({ prompt, schema, profile });
    res.json({ success: true, suggestion });
  } catch (error) {
    console.error('AI Suggestion Error:', error);
    res.status(500).json({ success: false, message: 'AI failed to generate suggestion' });
  }
});

module.exports = router;
