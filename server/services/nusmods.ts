export async function moduleGetData(moduleCode: string) {
    const year = new Date().getFullYear();

    try {
        const url_next_year = `https://api.nusmods.com/v2/${year}-${year+1}/modules/${moduleCode}.json`;
        const controller1 = new AbortController();
        const timeout1 = setTimeout(() => controller1.abort(), 15000);
        try {
            const response = await fetch(url_next_year, { signal: controller1.signal });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } finally {
            clearTimeout(timeout1);
        }

    } catch (error) {
        const url_current_year = `https://api.nusmods.com/v2/${year-1}-${year}/modules/${moduleCode}.json`;
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 15000);
        try {
            const response = await fetch(url_current_year, { signal: controller2.signal });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`, { cause: error });
            }
            return await response.json();
        } finally {
            clearTimeout(timeout2);
        }
    }
}

export async function getAllModules() {
    const year = new Date().getFullYear();

    try {
        const url_next_year = `https://api.nusmods.com/v2/${year}-${year+1}/moduleList.json`;
        const controller1 = new AbortController();
        const timeout1 = setTimeout(() => controller1.abort(), 15000);
        try {
            const response = await fetch(url_next_year, { signal: controller1.signal });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } finally {
            clearTimeout(timeout1);
        }

    } catch (error) {
        const url_current_year = `https://api.nusmods.com/v2/${year-1}-${year}/moduleList.json`;
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 15000);
        try {
            const response = await fetch(url_current_year, { signal: controller2.signal });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`, { cause: error });
            }
            return await response.json();
        } finally {
            clearTimeout(timeout2);
        }
    }
}