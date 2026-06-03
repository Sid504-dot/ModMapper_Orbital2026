    const supabase = require('./supabase');
    const userProfileDB = require('../db/userProfile');

    async function getUserSemByUserID(userID) {
        const startMatricYear = (await userProfileDB.getUserProfile(userID)).start_matric_year;
        const year = new Date().getFullYear();
        const month = new Date().getMonth() + 1; 
        const temp = year - startMatricYear;
        const augustOrLater = month >= 8;   
        let sem = temp * 2 + 1;
        if (augustOrLater) sem += 1;

        if (sem < 1) sem = 1;
        if (sem > 8) sem = 8;

        return sem;
    }

    module.exports = {
        getUserSemByUserID
    }