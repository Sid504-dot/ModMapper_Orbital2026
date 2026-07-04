import { getUserProfile } from '../db/userProfile';
import { computeSemester } from '../domain/calendar/computeSemester';

export async function getUserSemByUserID(userID: string) {
    const profile = await getUserProfile(userID);

    if (!profile || profile.start_matric_year == null) {
        return null;
    }

    const startMatricYear = profile.start_matric_year;

    return computeSemester(startMatricYear);
}

