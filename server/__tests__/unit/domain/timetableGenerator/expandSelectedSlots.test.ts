import { describe, expect, test } from '@jest/globals';
import { expandSelectedSlots } from '../../../../domain/timetableGenerator/expandSelectedSlots';
import { ModuleRecord } from '../../../../types/timetableGenerator';

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
                    },
                    {
                        lessonType: 'Tutorial',
                        classNo: '01',
                        day: 'Tuesday',
                        startTime: '1400',
                        endTime: '1500',
                        venue: 'COM1',
                        size: 25,
                        weeks: [1, 2, 3]
                    },
                    {
                        lessonType: 'Tutorial',
                        classNo: '02',
                        day: 'Wednesday',
                        startTime: '1500',
                        endTime: '1600',
                        venue: 'COM1',
                        size: 25,
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
                        classNo: '1',
                        day: 'Thursday',
                        startTime: '1000',
                        endTime: '1200',
                        venue: 'LT27',
                        size: 150,
                        weeks: [1, 2, 3]
                    }
                ]
            }
        ]
    }
];

describe('expandSelectedSlots', () => {

    test('Empty selectedSlots returns empty array', () => {

        const result = expandSelectedSlots({}, modules, 1);

        expect(result).toEqual([]);
    });


    test('Single module with one lesson type', () => {

        const result = expandSelectedSlots(
            {
                CS1010: {
                    Lecture: '1'
                }
            },
            modules,
            1
        );

        expect(result).toEqual([
            {
                moduleCode: 'CS1010',
                lessonType: 'Lecture',
                classNo: '1',
                day: 'Monday',
                startTime: '1000',
                endTime: '1200'
            }
        ]);
    });


    test('Single module with multiple lesson types', () => {

        const result = expandSelectedSlots(
            {
                CS1010: {
                    Lecture: '1',
                    Tutorial: '01'
                }
            },
            modules,
            1
        );

        expect(result).toHaveLength(2);

        expect(result).toContainEqual({
            moduleCode: 'CS1010',
            lessonType: 'Lecture',
            classNo: '1',
            day: 'Monday',
            startTime: '1000',
            endTime: '1200'
        });

        expect(result).toContainEqual({
            moduleCode: 'CS1010',
            lessonType: 'Tutorial',
            classNo: '01',
            day: 'Tuesday',
            startTime: '1400',
            endTime: '1500'
        });
    });


    test('Multiple modules', () => {

        const result = expandSelectedSlots(
            {
                CS1010: {
                    Lecture: '1'
                },
                MA1521: {
                    Lecture: '1'
                }
            },
            modules,
            1
        );

        expect(result).toHaveLength(2);

        expect(result).toContainEqual({
            moduleCode: 'CS1010',
            lessonType: 'Lecture',
            classNo: '1',
            day: 'Monday',
            startTime: '1000',
            endTime: '1200'
        });

        expect(result).toContainEqual({
            moduleCode: 'MA1521',
            lessonType: 'Lecture',
            classNo: '1',
            day: 'Thursday',
            startTime: '1000',
            endTime: '1200'
        });
    });


    test('Module not selected is ignored', () => {

        const result = expandSelectedSlots(
            {
                MA1521: {
                    Lecture: '1'
                }
            },
            modules,
            1
        );

        expect(result).toHaveLength(1);

        expect(result[0].moduleCode).toBe('MA1521');
    });


    test('Selected class does not exist', () => {

        const result = expandSelectedSlots(
            {
                CS1010: {
                    Lecture: '99'
                }
            },
            modules,
            1
        );

        expect(result).toEqual([]);
    });


    test('Selected lesson type does not exist', () => {

        const result = expandSelectedSlots(
            {
                CS1010: {
                    Laboratory: '1'
                }
            },
            modules,
            1
        );

        expect(result).toEqual([]);
    });


    test('Semester does not exist', () => {

        const result = expandSelectedSlots(
            {
                CS1010: {
                    Lecture: '1'
                }
            },
            modules,
            2
        );

        expect(result).toEqual([]);
    });


    test('Multiple lesson rows for same class are all expanded', () => {

        const multiRowModules: ModuleRecord[] = [
            {
                moduleCode: 'CS2103T',
                title: 'Software Engineering',
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
                                weeks: [1, 2]
                            },
                            {
                                lessonType: 'Lecture',
                                classNo: '1',
                                day: 'Wednesday',
                                startTime: '1000',
                                endTime: '1200',
                                venue: 'LT19',
                                size: 100,
                                weeks: [1, 2]
                            }
                        ]
                    }
                ]
            }
        ];

        const result = expandSelectedSlots(
            {
                CS2103T: {
                    Lecture: '1'
                }
            },
            multiRowModules,
            1
        );

        expect(result).toHaveLength(2);

        expect(result[0].day).toBe('Monday');
        expect(result[1].day).toBe('Wednesday');
    });


    test('Output contains only fields required for saving timetable', () => {

        const result = expandSelectedSlots(
            {
                CS1010: {
                    Lecture: '1'
                }
            },
            modules,
            1
        );

        expect(result[0]).toEqual({
            moduleCode: 'CS1010',
            lessonType: 'Lecture',
            classNo: '1',
            day: 'Monday',
            startTime: '1000',
            endTime: '1200'
        });
    });

});