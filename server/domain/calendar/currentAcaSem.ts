export function currentAcademicSemester() : number {
    const date = new Date();
    const month = date.getMonth() + 1;
    return month < 5 ? 2 : 1;
}