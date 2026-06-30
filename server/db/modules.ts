import supabase from './supabase';

export function getModuleByCode(moduleCode: string) {
    return supabase.from('modules').select().eq('module_code', moduleCode);
}

export function upsertModule(moduleData: any) {
    return supabase.from('modules').upsert(moduleData, { onConflict: 'module_code' });
}

export function getAllModules() {
    return supabase.from('modules').select();
}

export function getSuAbleModulesByCodes(moduleCodes: string[]) {
    return supabase.from('modules').select('module_code, is_su_eligible').in('module_code', moduleCodes);
}



