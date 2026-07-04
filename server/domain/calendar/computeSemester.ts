export function computeSemester(startMatricYear: number): number {
    const year = new Date().getFullYear();
    const month = new Date().getMonth() + 1;
    const augustOrLater = month >= 8;

    const acadYearStart = augustOrLater ? year : year - 1;
    const temp = acadYearStart - startMatricYear;

    let sem = temp * 2 + 1;
    if (!augustOrLater) sem += 1;

    return sem;
}