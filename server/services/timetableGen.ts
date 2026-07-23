import { validateParsedConstraints } from '../domain/timetableGenerator/validateParsedConstraints';

const GEMINI_KEY = process.env.GEMINI_KEY;

const GENERATION_MODEL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash';

const CONSTRAINT_PROMPT = `
You extract timetable preferences into JSON.

Return only valid JSON.

{
  "hard": {
    "freeDays": string[],
    "earliestStart": string | null,
    "latestEnd": string | null,
    "maxDailyHours": number | null
  },
  "soft": {
    "preferBackToBack": boolean | null,
    "preferEarlyStart": boolean | null,
    "preferLateStart": boolean | null,
    "preferFreeDays": string[],
    "minimizeCampusDays": boolean | null
  }
}

Rules:
- Do not invent preferences the user did not state.
- Use null for unknown scalar values.
- Use [] for unknown array values.
- Return JSON only.
`;

export async function parsePreferencesWithGemini( preferenceText: string, systemPrompt = CONSTRAINT_PROMPT) {

    if (preferenceText.trim() === '') {
        return {
            constraints: {
                hard: {
                    freeDays: [],
                    earliestStart: null,
                    latestEnd: null,
                    maxDailyHours: null
                },
                soft: {
                    preferBackToBack: null,
                    preferEarlyStart: null,
                    preferLateStart: null,
                    preferFreeDays: [],
                    minimizeCampusDays: null
                }
            },
            valid: true,
            issues: []
        };
    }

    if (!GEMINI_KEY) {
        // Server misconfiguration, not a recoverable runtime failure.
        throw new Error('Missing GEMINI_KEY');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    try {

        const res = await fetch(
            `${GENERATION_MODEL}:generateContent`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-goog-api-key': GEMINI_KEY,
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [{ text: systemPrompt }],
                    },
                    contents: [
                        {
                            parts: [{ text: preferenceText }],
                        },
                    ],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        temperature: 0,
                    },
                }),
                signal: controller.signal,
            }
        );

        if (!res.ok) {
            return validateParsedConstraints(null);
        }

        const data = await res.json();

        const raw =
            data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!raw) {
            return validateParsedConstraints(null);
        }

        let parsed: unknown;

        try {
            parsed = JSON.parse(raw);
        } catch {
            return validateParsedConstraints(null);
        }

        return validateParsedConstraints(parsed);

    } catch {
        return validateParsedConstraints(null);
    } finally {
        clearTimeout(timeout);
    }
}