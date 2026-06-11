const groupsDB = require('./groups');
const timetableDB = require('./timetable');


async function freeTimeFinder(groupId) {
    const groupMembers = await groupsDB.getGroupMembers(groupId);
    const userTimetables = (await Promise.all(groupMembers.filter(y => y.status === 'active')
        .map(x => timetableDB.getTimetableByUserID(x.user_id))))
        .filter(Boolean);

    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

    const busy = userTimetables.map(x => {
        const b = { id: x.user_id };
        for (const day of days) {
            const slots = [];
            for (const o of x.timetable_data) {
                if (o.day === day) {
                    const s = Number(o.startTime);
                    const e = Number(o.endTime);

                    for (let i = s; i < e; i += 100) {
                        slots.push(i);
                    }
                }
            }
             b[day] = slots;
        }
        return b;
    });

    const ans = {};
    for (const day of days) {
        let temp = {};
        for (let i = 800; i <= 2100; i += 100) {
            const u = [];
            for (const x of busy) {
                if (!x[day].includes(i)) {
                    u.push(x.id);
                }
            }
            temp[i] = u;
        }
        ans[day] = temp;
    }

    return ans;
    
}


module.exports = {
    freeTimeFinder
}