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

        return validateParsedConstraints(normaliseConstraints(parsed));

    } catch {
        return validateParsedConstraints(null);
    } finally {
        clearTimeout(timeout);
    }
}

// Gemini returns "10:00" / "10am" and validateParsedConstraints
// rejects anything that isn't HHMM so normalise before validating.
function normaliseTime(value: unknown): unknown {
    if (typeof value !== 'string') return value;

    const trimmed = value.trim().toLowerCase();

    const digits = trimmed.match(/^(\d{1,2}):?(\d{2})$/);
    if (digits) {
        return digits[1].padStart(2, '0') + digits[2];
    }

    const meridiem = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
    if (meridiem) {
        let hour = parseInt(meridiem[1], 10) % 12;
        if (meridiem[3] === 'pm') hour += 12;
        return String(hour).padStart(2, '0') + (meridiem[2] ?? '00');
    }

    return value;
}

function normaliseConstraints(raw: unknown): unknown {
    if (typeof raw !== 'object' || raw === null) return raw;

    const obj = raw as Record<string, unknown>;

    if (typeof obj.hard !== 'object' || obj.hard === null) return obj;

    const hard = { ...obj.hard as Record<string, unknown> };
    hard.earliestStart = normaliseTime(hard.earliestStart);
    hard.latestEnd = normaliseTime(hard.latestEnd);

    return { ...obj, hard };
}