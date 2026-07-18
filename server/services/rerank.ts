const GENERATION_MODEL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash';

const RERANK_PROMPT = `You are helping an NUS student choose which
module to take from a fixed list of options for one semester slot.
Score the given candidate modules by how well they fit the student's
stated interest.

Only score modules from the provided list — do not invent, add, or
suggest modules outside it.

For every candidate module, give:
- a score from 0 to 100 (higher = better fit)
- a one-sentence rationale explaining the fit in terms of the student's interest.

Do not omit any candidate. Every module provided must appear exactly once in the output.`;

interface CandidateModule {
  module_code: string;
  description: string;
}

export interface RerankedModule {
  code: string;
  score: number;
  rationale: string;
}

export async function rerankAndRationale(text: string, modulesJson: CandidateModule[], rerankPrompt = RERANK_PROMPT): Promise<RerankedModule[]> {
    const geminiKey = process.env.GEMINI_KEY;
    
    if (!geminiKey) {
        throw new Error('Missing GEMINI_KEY');
    }

    if (!modulesJson || modulesJson.length === 0) {
        return [];
    }

    if (modulesJson.length === 1) {
        const m = modulesJson[0];
        return [
        {
            code: m.module_code,
            score: 100,
            rationale: '',
        },
        ];
    }

    const interestText = text.trim().slice(0, 500);

    const res = await fetch(
        `${GENERATION_MODEL}:generateContent`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': geminiKey,
            },
            body: JSON.stringify({systemInstruction: {parts: [{ text: rerankPrompt }],
        },
            contents: [
            {
                parts: [
                {
                    text:`Student's interest:\n${interestText}\n\n` + `Candidate modules:\n${JSON.stringify(modulesJson)}`,
                },
                ],
            },
            ],
            generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: 'ARRAY',
                items: {
                type: 'OBJECT',
                properties: {
                    module_code: {
                    type: 'STRING',
                    },
                    score: {
                    type: 'INTEGER',
                    },
                    rationale: {
                    type: 'STRING',
                    },
                },
                required: [
                    'module_code',
                    'score',
                    'rationale',
                ],
                },
            },
            temperature: 0,
            },
        }),
        }
    );

    const data = await res.json();

    if (!res.ok) {
        throw new Error(`Gemini rerank failed: ${data.error?.message ?? 'Unknown error'}`);
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!raw) {
        throw new Error('Gemini returned an empty rerank response.');
    }

    let parsed: unknown;

    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error('Gemini returned invalid JSON.');
    }

    if (!Array.isArray(parsed)) {
        throw new Error('Gemini returned an invalid response format.');
    }

    const validCodes = new Set(
        modulesJson.map(m => m.module_code)
    );

    return parsed
        .filter((item: { module_code: string; score: number; rationale: string }) => validCodes.has(item.module_code))
        .map((item: { module_code: string; score: number; rationale: string }): RerankedModule => ({
            code: item.module_code,
            score: item.score,
            rationale: item.rationale,
        }));
}