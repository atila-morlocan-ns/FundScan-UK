// ═══════════════════════════════════════════════════════
// FundScan UK — Pitch Deck Analyzer
// Uses Gemini 2.0 Flash to extract startup profiles
// from uploaded pitch deck PDFs (runs client-side)
// ═══════════════════════════════════════════════════════

import { GoogleGenerativeAI } from '@google/generative-ai';

const MODEL = 'gemini-2.0-flash';

const VALID_SECTORS = [
    'ai', 'healthtech', 'lifescience', 'cleantech', 'fintech', 'deeptech',
    'creative', 'agritech', 'spacetech', 'biotech',
    'manufacturing', 'edtech', 'cyber', 'mobility', 'general',
];

const VALID_STAGES = [
    'idea', 'prototype', 'mvp', 'revenue', 'growth', 'scaleup',
];

const EXTRACTION_PROMPT = `You are an expert startup funding analyst. Analyse this pitch deck and extract the following structured profile for a UK funding matching engine.

Return a JSON object with EXACTLY these fields:

{
  "companyName": "Company name",
  "companyDesc": "2-3 sentence description of what the company does, its product, and target market",
  "sectors": ["array of sector IDs from this list: ${VALID_SECTORS.join(', ')}"],
  "stages": ["array of stage IDs from this list: ${VALID_STAGES.join(', ')}"],
  "teamSize": "one of: 1, 2-5, 6-10, 11-25, 26-50, 50+",
  "fundingNeeded": integer in GBP (best estimate from the deck, e.g. 250000 for £250K),
  "keyDifferentiators": ["3-5 bullet points on what makes this company unique"],
  "targetMarket": "Brief description of the target market and size if mentioned",
  "trl": integer 1-9 (Technology Readiness Level, estimate from product maturity described),
  "ukBased": true/false (whether the company appears to be UK-based),
  "confidence": {
    "companyName": "high/medium/low",
    "sectors": "high/medium/low",
    "stages": "high/medium/low",
    "fundingNeeded": "high/medium/low"
  }
}

RULES:
- sectors MUST only contain values from the provided list. Choose the most relevant 1-3.
- stages MUST only contain values from the provided list. Choose 1-2 that best describe current state.
- If you cannot determine a field, use null — do NOT guess.
- fundingNeeded should be an integer in GBP. If the deck mentions a raise amount, use that. If not, estimate based on stage and sector, or use null.
- For teamSize, infer from team slide or mentions. Default to "2-5" if unclear.
- Return ONLY valid JSON, no markdown or explanation.`;

/**
 * Read a File object and return base64 string
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // result is "data:application/pdf;base64,XXXX" — extract just the base64
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Analyse a pitch deck PDF file using Gemini
 * @param {File} file - PDF file from file input
 * @param {string} apiKey - Gemini API key
 * @param {function} onProgress - Progress callback: (phase) => void
 * @returns {Promise<object>} Extracted profile data
 */
export async function analyzePitchDeck(file, apiKey, onProgress = () => {}) {
    if (!apiKey) {
        throw new Error('Gemini API key is required. Add VITE_GEMINI_API_KEY to your .env file or enter it in Settings.');
    }

    if (!file) {
        throw new Error('No file provided');
    }

    // Validate file type
    const validTypes = ['application/pdf'];
    if (!validTypes.includes(file.type)) {
        throw new Error(`Unsupported file type: ${file.type}. Please upload a PDF file.`);
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
        throw new Error('File too large. Maximum size is 20MB.');
    }

    try {
        // Phase 1: Reading file
        onProgress('reading');
        const base64Data = await fileToBase64(file);

        // Phase 2: Sending to Gemini
        onProgress('analyzing');
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: MODEL });

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: file.type,
                    data: base64Data,
                },
            },
            { text: EXTRACTION_PROMPT },
        ]);

        const text = result.response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI did not return structured data. The file may not be a valid pitch deck.');
        }

        const extracted = JSON.parse(jsonMatch[0]);

        // Phase 3: Validating
        onProgress('validating');

        // Normalize and validate extracted data
        const profile = normalizeExtraction(extracted);

        onProgress('complete');
        return profile;

    } catch (err) {
        if (err.message.includes('API_KEY_INVALID') || err.message.includes('403')) {
            throw new Error('Invalid Gemini API key. Please check your key and try again.');
        }
        if (err.message.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('Gemini API rate limit reached. Please wait a moment and try again.');
        }
        throw err;
    }
}

/**
 * Normalize and validate extracted data to match our schema
 */
function normalizeExtraction(raw) {
    return {
        companyName: raw.companyName || '',
        companyDesc: raw.companyDesc || '',
        sectors: (raw.sectors || []).filter(s => VALID_SECTORS.includes(s)),
        stages: (raw.stages || []).filter(s => VALID_STAGES.includes(s)),
        teamSize: ['1', '2-5', '6-10', '11-25', '26-50', '50+'].includes(raw.teamSize) ? raw.teamSize : '2-5',
        fundingNeeded: typeof raw.fundingNeeded === 'number' ? raw.fundingNeeded : null,
        // Extra metadata from analysis
        _analysis: {
            keyDifferentiators: raw.keyDifferentiators || [],
            targetMarket: raw.targetMarket || '',
            trl: typeof raw.trl === 'number' ? raw.trl : null,
            ukBased: raw.ukBased ?? null,
            confidence: raw.confidence || {},
            analyzedAt: new Date().toISOString(),
            source: 'pitch-deck',
        },
    };
}

/**
 * Analyse from pasted text (fallback when PDF upload isn't available)
 */
export async function analyzeFromText(text, apiKey, onProgress = () => {}) {
    if (!apiKey) {
        throw new Error('Gemini API key is required.');
    }

    onProgress('analyzing');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL });

    const result = await model.generateContent([
        { text: `${EXTRACTION_PROMPT}\n\nHere is the company information:\n\n${text}` },
    ]);

    const responseText = result.response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error('AI did not return structured data.');
    }

    const extracted = JSON.parse(jsonMatch[0]);
    onProgress('complete');
    return normalizeExtraction(extracted);
}
