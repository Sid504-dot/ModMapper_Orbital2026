import { describe, expect, test } from '@jest/globals';
import { buildLessonGroups } from '../../../../domain/timetableGenerator/timetableOptions';
import { ModuleRecord } from '../../../../types/timetableGenerator';

describe('buildLessonGroups', () => {

    test('Single module with one lesson type -> produces one lesson group', () => {
        const modules: ModuleRecord[] = [{
            moduleCode: 'CS1010',
            title: 'Programming Methodology',
            semesterData: [
                {
                    semester: 1,
                    timetable: [
                        {
                            lessonType: 'Lecture',
                            classNo: '1',
                            day: 'Monday',
                            startTime: '1000',
                            endTime: '1200',
                            venue: 'LT19',
                            size: 100,
                            weeks: [1, 2, 3]
                        }
                    ]
                }
            ]
        }];

        const result = buildLessonGroups(modules, 1);

        expect(result.CS1010).toBeDefined();
        expect(result.CS1010.Lecture).toBeDefined();
        expect(result.CS1010.Lecture['1']).toHaveLength(1);
        expect(result.CS1010.Lecture['1'][0].lessonType).toBe('Lecture');
    });

    test('Module with lecture and tutorial combinations', () => {
        const modules: ModuleRecord[] = [{
            moduleCode: 'CS1010',
            title: 'Programming Methodology',
            semesterData: [
                {
                    semester: 1,
                    timetable: [
                        {
                            lessonType: 'Lecture',
                            classNo: '1',
                            day: 'Monday',
                            startTime: '1000',
                            endTime: '1200',
                            venue: 'LT19',
                            size: 100,
                            weeks: [1, 2, 3]
                        },
                        {
                            lessonType: 'Tutorial',
                            classNo: '01',
                            day: 'Tuesday',
                            startTime: '1200',
                            endTime: '1300',
                            venue: 'COM1',
                            size: 25,
                            weeks: [1, 2, 3]
                        },
                        {
                            lessonType: 'Tutorial',
                            classNo: '02',
                            day: 'Wednesday',
                            startTime: '1200',
                            endTime: '1300',
                            venue: 'COM1',
                            size: 25,
                            weeks: [1, 2, 3]
                        }
                    ]
                }
            ]
        }];

        const result = buildLessonGroups(modules, 1);

        expect(result.CS1010).toBeDefined();

        expect(result.CS1010.Lecture).toBeDefined();
        expect(result.CS1010.Lecture['1']).toHaveLength(1);

        expect(result.CS1010.Tutorial).toBeDefined();
        expect(result.CS1010.Tutorial['01']).toHaveLength(1);
        expect(result.CS1010.Tutorial['02']).toHaveLength(1);
    });

    test('Module has no timetable for the requested semester', () => {
        const modules: ModuleRecord[] = [{
            moduleCode: 'CS1010',
            title: 'Programming Methodology',
            semesterData: [
                {
                    semester: 2,
                    timetable: [
                        {
                            lessonType: 'Lecture',
                            classNo: '1',
                            day: 'Monday',
                            startTime: '1000',
                            endTime: '1200',
                            venue: 'LT19',
                            size: 100,
                            weeks: [1, 2, 3]
                        }
                    ]
                }
            ]
        }];

        const result = buildLessonGroups(modules, 1);

        expect(result.CS1010).toBeUndefined();
        expect(Object.keys(result)).toHaveLength(0);
    });

    test('Module with empty timetable', () => {
        const modules: ModuleRecord[] = [{
            moduleCode: 'CS1010',
            title: 'Programming Methodology',
            semesterData: [
                {
                    semester: 1,
                    timetable: []
                }
            ]
        }];

        const result = buildLessonGroups(modules, 1);

        expect(result.CS1010).toEqual({});
        expect(Object.keys(result.CS1010)).toHaveLength(0);
    });

    test('Multiple modules are grouped independently', () => {
        const modules: ModuleRecord[] = [
            {
                moduleCode: 'CS1010',
                title: 'Programming Methodology',
                semesterData: [
                    {
                        semester: 1,
                        timetable: [
                            {
                                lessonType: 'Lecture',
                                classNo: '1',
                                day: 'Monday',
                                startTime: '1000',
                                endTime: '1200',
                                venue: 'LT19',
                                size: 100,
                                weeks: [1, 2, 3]
                            }
                        ]
                    }
                ]
            },
            {
                moduleCode: 'MA1521',
                title: 'Calculus',
                semesterData: [
                    {
                        semester: 1,
                        timetable: [
                            {
                                lessonType: 'Lecture',
                                classNo: '2',
                                day: 'Tuesday',
                                startTime: '1400',
                                endTime: '1600',
                                venue: 'LT27',
                                size: 150,
                                weeks: [1, 2, 3]
                            }
                        ]
                    }
                ]
            }
        ];

        const result = buildLessonGroups(modules, 1);

        expect(Object.keys(result)).toHaveLength(2);

        expect(result.CS1010).toBeDefined();
        expect(result.MA1521).toBeDefined();

        expect(result.CS1010.Lecture['1']).toHaveLength(1);
        expect(result.MA1521.Lecture['2']).toHaveLength(1);
    });

    test('Multiple lessons with the same class number are grouped together', () => {
        const modules: ModuleRecord[] = [{
            moduleCode: 'CS1010',
            title: 'Programming Methodology',
            semesterData: [
                {
                    semester: 1,
                    timetable: [
                        {
                            lessonType: 'Tutorial',
                            classNo: '01',
                            day: 'Monday',
                            startTime: '1000',
                            endTime: '1100',
                            venue: 'COM1',
                            size: 25,
                            weeks: [1, 2, 3]
                        },
                        {
                            lessonType: 'Tutorial',
                            classNo: '01',
                            day: 'Wednesday',
                            startTime: '1000',
                            endTime: '1100',
                            venue: 'COM1',
                            size: 25,
                            weeks: [1, 2, 3]
                        }
                    ]
                }
            ]
        }];

        const result = buildLessonGroups(modules, 1);

        expect(result.CS1010.Tutorial['01']).toHaveLength(2);
    });

    test('Multiple class numbers for the same lesson type', () => {
        const modules: ModuleRecord[] = [{
            moduleCode: 'CS1010',
            title: 'Programming Methodology',
            semesterData: [
                {
                    semester: 1,
                    timetable: [
                        {
                            lessonType: 'Lecture',
                            classNo: '1',
                            day: 'Monday',
                            startTime: '1000',
                            endTime: '1200',
                            venue: 'LT19',
                            size: 100,
                            weeks: [1, 2, 3]
                        },
                        {
                            lessonType: 'Lecture',
                            classNo: '2',
                            day: 'Tuesday',
                            startTime: '1000',
                            endTime: '1200',
                            venue: 'LT19',
                            size: 100,
                            weeks: [1, 2, 3]
                        }
                    ]
                }
            ]
        }];

        const result = buildLessonGroups(modules, 1);

        expect(result.CS1010.Lecture['1']).toHaveLength(1);
        expect(result.CS1010.Lecture['2']).toHaveLength(1);
    });

});