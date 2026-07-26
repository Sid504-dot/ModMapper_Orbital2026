import { validateParsedConstraints } from '../domain/timetableGenerator/validateParsedConstraints';

const GEMINI_KEY = process.env.GEMINI_KEY;

const GENERATION_MODEL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash';

const CONSTRAINT_PROMPT = `
You extract timetable preferences into JSON. Return JSON only.

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

HARD vs SOFT — this is the most important rule.
"hard" means the timetable is REJECTED if violated. Only use hard when the user
expresses a genuine impossibility or an explicit numeric cutoff: "cannot",
"must not", "I work Fridays", "no classes after 4pm", "nothing before 10".
Everything else — likes, prefers, ideally, would rather, wants — is SOFT.
When unsure, choose SOFT.

FORMATS
- Days: full English names, capitalised. "Monday", "Friday". Never "Mon"/"friday".
- Times: "HHMM", 24-hour, always 4 digits. "0800", "1630". Never "8", "8am", "16:30".
- maxDailyHours: a number, only if the user states a limit in hours.

OTHER RULES
- Do not invent preferences the user did not state.
- Never set both preferEarlyStart and preferLateStart to true.
- Use null for unknown scalars, [] for unknown arrays.

EXAMPLES

Input: "morning classes"
{"hard":{"freeDays":[],"earliestStart":null,"latestEnd":null,"maxDailyHours":null},
 "soft":{"preferBackToBack":null,"preferEarlyStart":true,"preferLateStart":null,
         "preferFreeDays":[],"minimizeCampusDays":null}}

Input: "I work Fridays so I can't have anything then, and please no classes after 6pm. Would be nice to keep Wednesday light too."
{"hard":{"freeDays":["Friday"],"earliestStart":null,"latestEnd":"1800","maxDailyHours":null},
 "soft":{"preferBackToBack":null,"preferEarlyStart":null,"preferLateStart":null,
         "preferFreeDays":["Wednesday"],"minimizeCampusDays":null}}
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