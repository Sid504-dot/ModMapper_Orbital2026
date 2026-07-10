import { beforeEach, describe, expect, jest, test } from '@jest/globals';

process.env.GEMINI_KEY = 'test-key';

import { parsePreferencesWithGemini } from '../../../../services/timetableGen';
import * as validator from '../../../../domain/timetableGenerator/validateParsedConstraints';

describe('parsePreferencesWithGemini', () => {

    beforeEach(() => {
        jest.restoreAllMocks();
    });

    test('empty preference returns default constraints without calling Gemini', async () => {

        const result = await parsePreferencesWithGemini('   ');

        expect(result.valid).toBe(true);
        expect(result.issues).toEqual([]);
    });

    test('successful Gemini response is validated', async () => {

        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: JSON.stringify({
                                        hard: {
                                            freeDays: [],
                                            earliestStart: null,
                                            latestEnd: null,
                                            maxDailyHours: null
                                        },
                                        soft: {
                                            preferBackToBack: true,
                                            preferEarlyStart: null,
                                            preferLateStart: null,
                                            preferFreeDays: [],
                                            minimizeCampusDays: null
                                        }
                                    })
                                }
                            ]
                        }
                    }
                ]
            })
        } as any);

        jest.spyOn(validator, 'validateParsedConstraints')
            .mockReturnValue({
                constraints: {} as any,
                valid: true,
                issues: []
            });

        const result = await parsePreferencesWithGemini(
            'I like back to back classes'
        );

        expect(result.valid).toBe(true);
        expect(validator.validateParsedConstraints).toHaveBeenCalled();
    });

    test('HTTP failure returns validator(null)', async () => {

        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: false
        } as any);

        jest.spyOn(validator, 'validateParsedConstraints')
            .mockReturnValue({
                constraints: {} as any,
                valid: false,
                issues: ['invalid']
            });

        const result = await parsePreferencesWithGemini('hello');

        expect(result.valid).toBe(false);
        expect(validator.validateParsedConstraints)
            .toHaveBeenCalledWith(null);
    });

    test('missing candidate text returns validator(null)', async () => {

        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: []
            })
        } as any);

        jest.spyOn(validator, 'validateParsedConstraints')
            .mockReturnValue({
                constraints: {} as any,
                valid: false,
                issues: ['invalid']
            });

        await parsePreferencesWithGemini('hello');

        expect(validator.validateParsedConstraints)
            .toHaveBeenCalledWith(null);
    });

    test('invalid JSON returns validator(null)', async () => {

        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: '{invalid json'
                                }
                            ]
                        }
                    }
                ]
            })
        } as any);

        jest.spyOn(validator, 'validateParsedConstraints')
            .mockReturnValue({
                constraints: {} as any,
                valid: false,
                issues: ['invalid']
            });

        await parsePreferencesWithGemini('hello');

        expect(validator.validateParsedConstraints)
            .toHaveBeenCalledWith(null);
    });

    test('network error returns validator(null)', async () => {

        jest.spyOn(global, 'fetch')
            .mockRejectedValue(new Error('Network'));

        jest.spyOn(validator, 'validateParsedConstraints')
            .mockReturnValue({
                constraints: {} as any,
                valid: false,
                issues: ['invalid']
            });

        await parsePreferencesWithGemini('hello');

        expect(validator.validateParsedConstraints)
            .toHaveBeenCalledWith(null);
    });

    test('validator receives parsed JSON', async () => {

        const parsed = {
            hard: {
                freeDays: ['Friday'],
                earliestStart: null,
                latestEnd: null,
                maxDailyHours: null
            },
            soft: {
                preferBackToBack: true,
                preferEarlyStart: null,
                preferLateStart: null,
                preferFreeDays: [],
                minimizeCampusDays: null
            }
        };

        jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: async () => ({
                candidates: [
                    {
                        content: {
                            parts: [
                                {
                                    text: JSON.stringify(parsed)
                                }
                            ]
                        }
                    }
                ]
            })
        } as any);

        jest.spyOn(validator, 'validateParsedConstraints')
            .mockReturnValue({
                constraints: parsed as any,
                valid: true,
                issues: []
            });

        await parsePreferencesWithGemini('Friday free');

        expect(validator.validateParsedConstraints)
            .toHaveBeenCalledWith(parsed);
    });

});