import { ModuleRecord } from '../../types/timetableGenerator';

export interface SavedLesson {
    moduleCode: string;
    lessonType: string;
    classNo: string;
    day: string;
    startTime: string;
    endTime: string;
}

export function expandSelectedSlots( selectedSlots: Record<string, Record<string, string>>, modules: ModuleRecord[], semester: number): SavedLesson[] {
    const timetableData: SavedLesson[] = [];

    for (const module of modules) {

        const chosenLessons = selectedSlots[module.moduleCode];

        if (!chosenLessons) {
            continue;
        }

        const semesterData = module.semesterData.find(s => s.semester === semester);

        if (!semesterData) {
            continue;
        }

        for (const lessonType of Object.keys(chosenLessons)) {

            const classNo = chosenLessons[lessonType];

            for (const lesson of semesterData.timetable) {

                if (lesson.lessonType !== lessonType || lesson.classNo !== classNo) {
                    continue;
                }

                timetableData.push({
                    moduleCode: module.moduleCode,
                    lessonType: lesson.lessonType,
                    classNo: lesson.classNo,
                    day: lesson.day,
                    startTime: lesson.startTime,
                    endTime: lesson.endTime
                });
            }
        }
    }

    return timetableData;
}