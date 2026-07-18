import 'dotenv/config';

import { rerankAndRationale } from '../../services/rerank';

describe('rerankAndRationale', () => {

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('returns empty array when no modules are provided', async () => {

        const fetchSpy = jest.spyOn(global, 'fetch');

        const result = await rerankAndRationale(
            'AI',
            []
        );

        expect(result).toEqual([]);
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('returns single module without calling Gemini', async () => {

        const fetchSpy = jest.spyOn(global, 'fetch');

        const result = await rerankAndRationale(
            'AI',
            [
                {
                    module_code: 'CS2030',
                    description: 'Programming Methodology II'
                }
            ]
        );

        expect(result).toEqual([
            {
                code: 'CS2030',
                score: 100,
                rationale: ''
            }
        ]);

        expect(fetchSpy).not.toHaveBeenCalled();
    });

    test('returns reranked modules from Gemini', async () => {

        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: JSON.stringify([
                                        {
                                            module_code: 'CS2030',
                                            score: 98,
                                            rationale: 'Excellent fit'
                                        }
                                    ])
                                }
                            ]
                        }
                    }
                ]
            })
        } as Response);

        const result = await rerankAndRationale(
            'Artificial Intelligence',
            [
                {
                    module_code: 'CS2030',
                    description: 'Programming Methodology II'
                },
                {
                    module_code: 'CS2040',
                    description: 'Data Structures'
                }
            ]
        );

        expect(result).toEqual([
            {
                code: 'CS2030',
                score: 98,
                rationale: 'Excellent fit'
            }
        ]);
    });

    test('filters modules not present in the candidate list', async () => {

        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: JSON.stringify([
                                        {
                                            module_code: 'CS2030',
                                            score: 98,
                                            rationale: 'Good'
                                        },
                                        {
                                            module_code: 'FAKE1000',
                                            score: 100,
                                            rationale: 'Hallucinated'
                                        }
                                    ])
                                }
                            ]
                        }
                    }
                ]
            })
        } as Response);

        const result = await rerankAndRationale(
            'AI',
            [
                {
                    module_code: 'CS2030',
                    description: 'Programming'
                },
                {
                    module_code: 'CS2040',
                    description: 'Data Structures'
                }
            ]
        );

        expect(result).toEqual([
            {
                code: 'CS2030',
                score: 98,
                rationale: 'Good'
            }
        ]);
    });

    test('throws when Gemini returns an error', async () => {

        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: false,
            json: async () => ({
                error: {
                    message: 'Gemini failed'
                }
            })
        } as Response);

        await expect(
            rerankAndRationale(
                'AI',
                [
                    {
                        module_code: 'CS2030',
                        description: 'Programming'
                    },
                    {
                        module_code: 'CS2040',
                        description: 'DSA'
                    }
                ]
            )
        ).rejects.toThrow('Gemini rerank failed: Gemini failed');
    });

    test('throws when Gemini returns empty content', async () => {

        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: []
                        }
                    }
                ]
            })
        } as Response);

        await expect(
            rerankAndRationale(
                'AI',
                [
                    {
                        module_code: 'CS2030',
                        description: 'Programming'
                    },
                    {
                        module_code: 'CS2040',
                        description: 'DSA'
                    }
                ]
            )
        ).rejects.toThrow('Gemini returned an empty rerank response.');
    });

    test('throws when Gemini returns invalid JSON', async () => {

        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: 'not json'
                                }
                            ]
                        }
                    }
                ]
            })
        } as Response);

        await expect(
            rerankAndRationale(
                'AI',
                [
                    {
                        module_code: 'CS2030',
                        description: 'Programming'
                    },
                    {
                        module_code: 'CS2040',
                        description: 'DSA'
                    }
                ]
            )
        ).rejects.toThrow('Gemini returned invalid JSON.');
    });

    test('throws when Gemini returns an object instead of an array', async () => {

        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: JSON.stringify({
                                        module_code: 'CS2030'
                                    })
                                }
                            ]
                        }
                    }
                ]
            })
        } as Response);

        await expect(
            rerankAndRationale(
                'AI',
                [
                    {
                        module_code: 'CS2030',
                        description: 'Programming'
                    },
                    {
                        module_code: 'CS2040',
                        description: 'DSA'
                    }
                ]
            )
        ).rejects.toThrow('Gemini returned an invalid response format.');
    });

});