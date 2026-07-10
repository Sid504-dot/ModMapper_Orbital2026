import supabase from './supabase';
import { getUserSemByUserID } from './userSem';

import { SavedLesson } from '../domain/timetableGenerator/expandSelectedSlots';

export interface UpsertTimetableEntry {
    user_id: string;
    timetable_data: SavedLesson[];
    sem_number?: number;
}

export async function getTimetableByUserID(userID: string) {
    const sem = await getUserSemByUserID(userID);
    const { data, error } = await supabase.from('user_timetable')
        .select().eq('user_id', userID).eq('sem_number', sem).maybeSingle();
    if (error) {
        throw new Error(`getTimetableByUserID failed: ${error.message}`, { cause: error });
    }
    return data;
}

export async function upsertTimetableEntry(entryData: UpsertTimetableEntry) {
    const sem = await getUserSemByUserID(entryData.user_id);

    if (sem === null) {
        throw new Error('Cannot determine semester: matriculation year not set');
    }

    entryData.sem_number = sem;

    const { data, error } = await supabase
        .from('user_timetable')
        .upsert(entryData, { onConflict: 'user_id,sem_number' })
        .select();

    if (error) {
        throw new Error(`upsertTimetableEntry failed: ${error.message}`, { cause: error });
    }

    return data;
}

export async function getTimetableBySemNumber(semNumber: number, userID: string) {
    const { data, error } = await supabase.from('user_timetable').select().eq('sem_number', semNumber).eq('user_id', userID);
    if (error) {
        throw new Error(`getTimetableBySemNumber failed: ${error.message}`, { cause: error });
    }
    return data;
}

