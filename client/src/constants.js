// Central configuration constants for the whole app.
// Every fetch call across the codebase imports BACKEND from here so there's
// one place to change if the deployment URL ever moves.

export const BACKEND = 'https://modmapper-orbital2026.onrender.com'

export const CURRENT_ACAD_YEAR = '2024-2025'

export const NUSMODS_API = `https://api.nusmods.com/v2/${CURRENT_ACAD_YEAR}`

export const NUSMODS_MODULE_LIST_URL = `${NUSMODS_API}/moduleList.json`
export const NUSMODS_MODULE_URL = (moduleCode) => `${NUSMODS_API}/modules/${encodeURIComponent(moduleCode)}.json`

// Weekday keys which kept as full names because NUSMods returns 'Monday', 'Tuesday' etc
export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

// Shortened labels for display in narrow grid headers
export const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI']

// Hour keys matching Siddharth's group-free-finder response shape
export const HOUR_SLOTS = [
    '800', '900', '1000', '1100', '1200', '1300',
    '1400', '1500', '1600', '1700', '1800', '1900', '2000', '2100'
]

// Module colour cycle — each added module picks the next colour in order.
// Six colours means up to six visually distinct modules per timetable.
export const MODULE_COLOURS = [
    '#b85c38', '#1a2744', '#3d5a73',
    '#7a6a5a', '#c9a84c', '#2e3f6f'
]

// SoC fallback programme catalog — used when GET /planner/ returns an empty programmes table.
// TODO: Remove once Siddharth's programmes table is seeded; dropdowns will then be API-driven.
export const SOC_MAJORS = [
    { value: 'cs', label: 'Computer Science' },
    { value: 'bza', label: 'Business Analytics' },
    { value: 'is', label: 'Information Systems' },
    { value: 'infosec', label: 'Information Security' },
    { value: 'ceg', label: 'Computer Engineering' },
]

export const SOC_SECOND_MAJORS = [
    'Mathematics', 'Statistics', 'Economics', 'Finance',
    'Data Science & Analytics', 'Applied Mathematics', 'Quantitative Finance',
]

export const SOC_MINORS = [
    'Statistics', 'Mathematics', 'Economics', 'Financial Mathematics',
    'Data Science & Analytics', 'Entrepreneurship (i&E)', 'Public Policy', 'Management',
]