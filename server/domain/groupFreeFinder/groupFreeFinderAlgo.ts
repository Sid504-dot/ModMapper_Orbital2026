const days = ['Monday','Tuesday','Wednesday','Thursday','Friday'];

export function freeFinder(userTimetables: any[]) {
    const busy = userTimetables.map(x => {
        const b: Record<string, any> = { id: x.user_id };
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

    const ans: Record<string, any> = {};
    for (const day of days) {
        let temp: Record<number, any> = {};
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
