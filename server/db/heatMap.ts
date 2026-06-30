import supabase from './supabase';
import { getTimetableBySemNumber } from './timetable';
import { getUserSemByUserID } from './userSem';


export async function needToUpdateSlotDemand(moduleCode: string) {
    const ifModuleExists = await supabase
        .from('slot_demand')
        .select('module_code')
        .eq('module_code', moduleCode);

    if (ifModuleExists.error) {
        throw new Error(`Error fetching timetable: ${ifModuleExists.error.message}`);
    }

    let needToUpdate = false;

    if(ifModuleExists.data.length > 0) {
        const slotDemandTimeStamp = await supabase
            .from('slot_demand')
            .select('computed_at')
            .eq('module_code', moduleCode)
            .limit(1); 
        
        if(slotDemandTimeStamp.error) {
            throw new Error(`Error fetching timetable: ${slotDemandTimeStamp.error.message}`);
        }
        
        const moduleCachedTimeStamp = await supabase
            .from('modules')
            .select('cached_at')
            .eq('module_code', moduleCode)
            .single();
        
        if(moduleCachedTimeStamp.error) {
            throw new Error(`Error fetching timetable: ${moduleCachedTimeStamp.error.message}`);
        }

        if (slotDemandTimeStamp.data[0].computed_at < moduleCachedTimeStamp.data.cached_at) {
            needToUpdate = true;
        }
    }

    const month = new Date().getMonth() + 1;
    const beforeMay =  month < 5;

    if (ifModuleExists.data.length === 0 || needToUpdate) {
        const academicYearData = await supabase
            .from('modules')
            .select('semesters')
            .eq('module_code', moduleCode)
            .single();
        
        if(academicYearData.error) {
            throw new Error(`Error fetching timetable: ${academicYearData.error.message}`);
        }

        let whichSem = 1;

        if (beforeMay) {
            whichSem = 2;
        }
        
        const semData = academicYearData.data.semesters.find((s: any) => s.semester === whichSem);
        await updateSlot(moduleCode, semData);
    }

}

export async function updateSlot(moduleCode: string, semData: any) {
    const deleteResult = await supabase
        .from('slot_demand')
        .delete()
        .eq('module_code', moduleCode);

    if (deleteResult.error) {
        throw new Error(`Error updating slot demand: ${deleteResult.error.message}`);
    }
    
    for (const slot of semData.timetable) {
        await supabase.from('slot_demand').upsert({
            module_code: moduleCode,
            day: slot.day,
            max_size: slot.size,
            venue: slot.venue,
            class_no: slot.classNo,
            lesson_type: slot.lessonType
        }, {
            onConflict: 'module_code,lesson_type,class_no'
        });
    }
}

export async function getSlotDemand(slot: { module_code: string; lesson_type: string; class_no: string }) {
    const userIDs = await supabase
        .from('user_profile')
        .select('user_id')
    
    if (userIDs.error) {
        throw new Error(`Error fetching timetable: ${userIDs.error.message}`);
    }

    let count = 0;

    for (const ID of userIDs.data) {
        const currentSem = await getUserSemByUserID(ID.user_id);
        if (currentSem === null) {
            continue;
        }
        const timetableData = await getTimetableBySemNumber(currentSem, ID.user_id);

        for (const lesson of timetableData[0]?.timetable_data ?? []) {
            if (lesson.moduleCode === slot.module_code &&
                lesson.lessonType === slot.lesson_type &&
                lesson.classNo === slot.class_no) {
                    count ++;
            }
        }
    }

    return count;
}

export async function updateHeatMap(moduleCode: string) {
    const slotDemandData = await supabase
        .from('slot_demand')
        .select('*')
        .eq('module_code', moduleCode);

    if (slotDemandData.error) {
        throw new Error(`Error fetching timetable: ${slotDemandData.error.message}`);
    }

    for (const slot of slotDemandData.data) {
        const demand = await getSlotDemand(slot);
        await supabase.from('slot_demand')
            .update({ user_count: demand })
            .eq('module_code', moduleCode)
            .eq('lesson_type', slot.lesson_type)
            .eq('class_no', slot.class_no);
    }
}

