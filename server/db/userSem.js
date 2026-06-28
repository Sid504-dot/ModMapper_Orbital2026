const userProfileDB = require('../db/userProfile');

async function getUserSemByUserID(userID) {
    const profile = await userProfileDB.getUserProfile(userID);

    if (!profile || profile.start_matric_year == null) {
        return null;
    }

    const startMatricYear = profile.start_matric_year;

    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const augustOrLater = month >= 8;

    const acadYearStart = augustOrLater ? year : year - 1;
    const temp = acadYearStart - startMatricYear;

    let sem = temp * 2 + 1;
    if (!augustOrLater) sem += 1;

    return sem;
}

module.exports = {
    getUserSemByUserID
};