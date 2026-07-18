import { getGroupMembers } from './groups';
import { getTimetableByUserID } from './timetable';
import { freeFinder } from '../domain/groupFreeFinder/groupFreeFinderAlgo';


export async function freeTimeFinder(groupId: string) {
    const groupMembers = await getGroupMembers(groupId);
    const userTimetables = (await Promise.all(groupMembers.filter(y => y.status === 'active')
        .map(x => getTimetableByUserID(x.user_id))))
        .filter(Boolean);

    return freeFinder(userTimetables);
    
}


