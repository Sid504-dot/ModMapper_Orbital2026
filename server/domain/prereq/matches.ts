export function n0f(node: { nOf: [number, string[]] }, moduleCode: string) {
    const [, modules] = node.nOf;

    return modules.some(m => matches(moduleCode, m));
}


export function matches(prereq: string, candidate: unknown) {
    if (typeof candidate !== 'string') {
        return false;
    }

    const clean = candidate.replace(':D', '');

    if (clean.endsWith('%')) {
        return prereq.startsWith(clean.slice(0, -1));
    }

    return clean === prereq;
}