import supabase from './supabase';
import { getUserSemByUserID } from './userSem';
import { NUSModsLesson } from '../types/timetableGenerator';

export async function getTimetableByUserID(userID: string) {
    const sem = await getUserSemByUserID(userID);
    const { data, error } = await supabase.from('user_timetable')
        .select().eq('user_id', userID).eq('sem_number', sem).maybeSingle();
    if (error) {
        throw new Error(`getTimetableByUserID failed: ${error.message}`, { cause: error });
    }
    return data;
}

export async function upsertTimetableEntry(entryData: { user_id: string; sem_number: number }) {
    const sem = await getUserSemByUserID(entryData.user_id);
    if (sem === null) {
        throw new Error('Cannot determine semester: matriculation year not set');
    }
    entryData.sem_number = sem;
    const { data, error } = await supabase.from('user_timetable')
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

export async function getTimingsForModules (modules: string[]) {
    const { data: d, error } = await supabase
        .from('modules')
        .select('module_code, semesters')
        .in('module_code', modules);

    if (error) {
        throw new Error(`Error placing module: ${error.message}`, { cause: error });
    }

    const sem = new Date().getMonth() + 1 >= 7 ? 2 : 1;

    const moduleTimings: Map<string, {examDate: Date, semester: number, timetable: NUSModsLesson[] | undefined}> = new Map();

    for (const i of d) {
        const semData : {examDate: Date, semester: number, timetable: NUSModsLesson[] | undefined} = i.semesters.find((s: any) => s.semester === sem);
        if (semData) moduleTimings.set(i.module_code, semData);
    }

    return moduleTimings;
}
