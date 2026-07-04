import supabase from './supabase';
import { getTimetableBySemNumber } from './timetable';
import { getUserSemByUserID } from './userSem';
import { currentAcademicSemester } from '../domain/calendar/currentAcaSem';

export async function needToUpdateSlotDemand(moduleCode: string) {
    const { data: existing, error } = await supabase
        .from('slot_demand')
        .select('computed_at')
        .eq('module_code', moduleCode);

    if (error) {
        throw new Error(`Error fetching slot demand: ${error.message}`);
    }

    let needToUpdate = existing.length === 0;

    if (!needToUpdate) {
        const { data: moduleData, error: moduleError } = await supabase
            .from('modules')
            .select('cached_at')
            .eq('module_code', moduleCode)
            .single();

        if (moduleError) {
            throw new Error(`Error fetching module: ${moduleError.message}`);
        }

        if (existing[0].computed_at < moduleData.cached_at) {
            needToUpdate = true;
        }
    }

    if (needToUpdate) {
        const { data: moduleData, error: moduleError } = await supabase
            .from('modules')
            .select('semesters')
            .eq('module_code', moduleCode)
            .single();

        if (moduleError) {
            throw new Error(`Error fetching module timetable: ${moduleError.message}`);
        }

        const semData = moduleData.semesters.find(
            (s: any) => s.semester === currentAcademicSemester()
        );

        if (!semData) {
            throw new Error('No timetable found for current academic semester');
        }

        await updateSlot(moduleCode, semData);
    }
}

export async function updateSlot(moduleCode: string, semData: any) {
    const { error: deleteError } = await supabase
        .from('slot_demand')
        .delete()
        .eq('module_code', moduleCode);

    if (deleteError) {
        throw new Error(`Error updating slot demand: ${deleteError.message}`);
    }

    for (const slot of semData.timetable) {
        const { error } = await supabase
            .from('slot_demand')
            .upsert(
                {
                    module_code: moduleCode,
                    day: slot.day,
                    max_size: slot.size,
                    venue: slot.venue,
                    class_no: slot.classNo,
                    lesson_type: slot.lessonType
                },
                {
                    onConflict: 'module_code,lesson_type,class_no'
                }
            );

        if (error) {
            throw new Error(`Error updating slot demand: ${error.message}`);
        }
    }
}

export async function getSlotDemand(slot: {
    module_code: string;
    lesson_type: string;
    class_no: string;
}) {
    const { data: userIDs, error } = await supabase
        .from('user_profile')
        .select('user_id');

    if (error) {
        throw new Error(`Error fetching users: ${error.message}`);
    }

    let count = 0;

    for (const { user_id } of userIDs) {
        const currentSem = await getUserSemByUserID(user_id);

        if (currentSem === null) {
            continue;
        }

        const timetableData = await getTimetableBySemNumber(currentSem, user_id);

        for (const lesson of timetableData[0]?.timetable_data ?? []) {
            if (
                lesson.moduleCode === slot.module_code &&
                lesson.lessonType === slot.lesson_type &&
                lesson.classNo === slot.class_no
            ) {
                count++;
            }
        }
    }

    return count;
}

export async function updateHeatMap(moduleCode: string) {
    const { data: slots, error } = await supabase
        .from('slot_demand')
        .select('*')
        .eq('module_code', moduleCode);

    if (error) {
        throw new Error(`Error fetching slot demand: ${error.message}`);
    }

    for (const slot of slots) {
        const demand = await getSlotDemand(slot);

        const { error: updateError } = await supabase
            .from('slot_demand')
            .update({ user_count: demand })
            .eq('module_code', moduleCode)
            .eq('lesson_type', slot.lesson_type)
            .eq('class_no', slot.class_no);

        if (updateError) {
            throw new Error(`Error updating heatmap: ${updateError.message}`);
        }
    }
}