import { describe, expect, test } from '@jest/globals';
import { buildDecisions } from '../../../../domain/timetableGenerator/timetableOptions';
import { LessonGroups } from '../../../../domain/timetableGenerator/timetableOptions';

describe('buildDecisions', () => {
    test('Single module with one lesson type', () => {
        const groups: LessonGroups = {
            CS1010: {
                Lecture: {
                    '1': [{
                        lessonType: 'Lecture',
                        classNo: '1',
                        day: 'Monday',
                        startTime: '1000',
                        endTime: '1200',
                        venue: 'LT19',
                        size: 100,
                        weeks: [1, 2, 3]
                    }]
                }
            }
        };

        const result = buildDecisions(groups);

        expect(result).toHaveLength(1);
        expect(result[0].moduleCode).toBe('CS1010');
        expect(result[0].lessonType).toBe('Lecture');
        expect(result[0].candidates).toHaveLength(1);
    });

    test('Module with multiple lesson types', () => {
        const groups: LessonGroups = {
            CS1010: {
                Lecture: {
                    '1': [{
                        lessonType: 'Lecture',
                        classNo: '1',
                        day: 'Monday',
                        startTime: '1000',
                        endTime: '1200',
                        venue: 'LT19',
                        size: 100,
                        weeks: [1, 2, 3]
                    }]
                },
                Tutorial: {
                    '01': [{
                        lessonType: 'Tutorial',
                        classNo: '01',
                        day: 'Tuesday',
                        startTime: '1200',
                        endTime: '1300',
                        venue: 'COM1',
                        size: 25,
                        weeks: [1, 2, 3]
                    }]
                }
            }
        };

        const result = buildDecisions(groups);

        expect(result).toHaveLength(2);

        expect(result[0].moduleCode).toBe('CS1010');
        expect(result[1].moduleCode).toBe('CS1010');

        expect(result.some(d => d.lessonType === 'Lecture')).toBe(true);
        expect(result.some(d => d.lessonType === 'Tutorial')).toBe(true);
    });

    test('Multiple modules', () => {
        const groups: LessonGroups = {
            CS1010: {
                Lecture: {
                    '1': [{
                        lessonType: 'Lecture',
                        classNo: '1',
                        day: 'Monday',
                        startTime: '1000',
                        endTime: '1200',
                        venue: 'LT19',
                        size: 100,
                        weeks: [1]
                    }]
                }
            },
            MA1521: {
                Lecture: {
                    '2': [{
                        lessonType: 'Lecture',
                        classNo: '2',
                        day: 'Tuesday',
                        startTime: '1400',
                        endTime: '1600',
                        venue: 'LT27',
                        size: 150,
                        weeks: [1]
                    }]
                }
            }
        };

        const result = buildDecisions(groups);

        expect(result).toHaveLength(2);

        expect(result.some(d => d.moduleCode === 'CS1010')).toBe(true);
        expect(result.some(d => d.moduleCode === 'MA1521')).toBe(true);
    });

    test('One lesson type with multiple candidates', () => {
        const groups: LessonGroups = {
            CS1010: {
                Lecture: {
                    '1': [{
                        lessonType: 'Lecture',
                        classNo: '1',
                        day: 'Monday',
                        startTime: '1000',
                        endTime: '1200',
                        venue: 'LT19',
                        size: 100,
                        weeks: [1]
                    }],
                    '2': [{
                        lessonType: 'Lecture',
                        classNo: '2',
                        day: 'Tuesday',
                        startTime: '1000',
                        endTime: '1200',
                        venue: 'LT19',
                        size: 100,
                        weeks: [1]
                    }],
                    '3': [{
                        lessonType: 'Lecture',
                        classNo: '3',
                        day: 'Wednesday',
                        startTime: '1000',
                        endTime: '1200',
                        venue: 'LT19',
                        size: 100,
                        weeks: [1]
                    }]
                }
            }
        };

        const result = buildDecisions(groups);

        expect(result).toHaveLength(1);
        expect(result[0].candidates).toHaveLength(3);
    });

    test('Decisions are sorted by candidate count', () => {
        const groups: LessonGroups = {
            CS1010: {
                Lecture: {
                    '1': [{
                        lessonType: 'Lecture',
                        classNo: '1',
                        day: 'Monday',
                        startTime: '1000',
                        endTime: '1200',
                        venue: 'LT19',
                        size: 100,
                        weeks: [1]
                    }],
                    '2': [{
                        lessonType: 'Lecture',
                        classNo: '2',
                        day: 'Tuesday',
                        startTime: '1000',
                        endTime: '1200',
                        venue: 'LT19',
                        size: 100,
                        weeks: [1]
                    }],
                    '3': [{
                        lessonType: 'Lecture',
                        classNo: '3',
                        day: 'Wednesday',
                        startTime: '1000',
                        endTime: '1200',
                        venue: 'LT19',
                        size: 100,
                        weeks: [1]
                    }]
                },
                Tutorial: {
                    '01': [{
                        lessonType: 'Tutorial',
                        classNo: '01',
                        day: 'Thursday',
                        startTime: '1200',
                        endTime: '1300',
                        venue: 'COM1',
                        size: 25,
                        weeks: [1]
                    }]
                }
            }
        };

        const result = buildDecisions(groups);

        expect(result).toHaveLength(2);

        expect(result[0].lessonType).toBe('Tutorial');
        expect(result[0].candidates).toHaveLength(1);

        expect(result[1].lessonType).toBe('Lecture');
        expect(result[1].candidates).toHaveLength(3);
    });

    test('Empty lesson groups', () => {
        const groups: LessonGroups = {};

        const result = buildDecisions(groups);

        expect(result).toEqual([]);
    });
})