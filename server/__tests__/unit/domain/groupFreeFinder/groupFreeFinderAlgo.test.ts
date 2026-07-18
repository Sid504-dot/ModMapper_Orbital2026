import { describe, expect, test } from '@jest/globals';
import { freeFinder } from '../../../../domain/groupFreeFinder/groupFreeFinderAlgo';

describe('freeFinder', () => {

    test('returns all slots empty when there are no users', () => {
        const result = freeFinder([]);

        expect(result.Monday[800]).toEqual([]);
        expect(result.Monday[2100]).toEqual([]);
        expect(result.Friday[1200]).toEqual([]);
    });

    test('single user busy for one lesson', () => {
        const timetables = [
            {
                user_id: 'u1',
                timetable_data: [
                    {
                        day: 'Monday',
                        startTime: '1000',
                        endTime: '1200'
                    }
                ]
            }
        ];

        const result = freeFinder(timetables);

        expect(result.Monday[1000]).toEqual([]);
        expect(result.Monday[1100]).toEqual([]);
        expect(result.Monday[1200]).toEqual(['u1']);
        expect(result.Monday[900]).toEqual(['u1']);
    });

    test('multiple users with overlapping lessons', () => {
        const timetables = [
            {
                user_id: 'u1',
                timetable_data: [
                    { day: 'Monday', startTime: '1000', endTime: '1200' }
                ]
            },
            {
                user_id: 'u2',
                timetable_data: [
                    { day: 'Monday', startTime: '1100', endTime: '1300' }
                ]
            }
        ];

        const result = freeFinder(timetables);

        expect(result.Monday[1000]).toEqual(['u2']);
        expect(result.Monday[1100]).toEqual([]);
        expect(result.Monday[1200]).toEqual(['u1']);
        expect(result.Monday[900]).toEqual(['u1', 'u2']);
    });

    test('lessons on different days are independent', () => {
        const timetables = [
            {
                user_id: 'u1',
                timetable_data: [
                    { day: 'Tuesday', startTime: '900', endTime: '1000' }
                ]
            }
        ];

        const result = freeFinder(timetables);

        expect(result.Monday[900]).toEqual(['u1']);
        expect(result.Tuesday[900]).toEqual([]);
    });

    test('adjacent lessons occupy the correct slots', () => {
        const timetables = [
            {
                user_id: 'u1',
                timetable_data: [
                    { day: 'Monday', startTime: '900', endTime: '1000' },
                    { day: 'Monday', startTime: '1000', endTime: '1100' }
                ]
            }
        ];

        const result = freeFinder(timetables);

        expect(result.Monday[900]).toEqual([]);
        expect(result.Monday[1000]).toEqual([]);
        expect(result.Monday[1100]).toEqual(['u1']);
    });

    test('user busy for the whole day', () => {
        const timetables = [
            {
                user_id: 'u1',
                timetable_data: [
                    {
                        day: 'Monday',
                        startTime: '800',
                        endTime: '2200'
                    }
                ]
            }
        ];

        const result = freeFinder(timetables);

        expect(result.Monday[800]).toEqual([]);
        expect(result.Monday[1300]).toEqual([]);
        expect(result.Monday[2100]).toEqual([]);
    });

});