async function moduleGetData (moduleCode) {

    const year = new Date().getFullYear();
    try {
        const url_next_year = `https://api.nusmods.com/v2/${year}-${year+1}/modules/${moduleCode}.json`;
        const response = await fetch(url_next_year);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();

    } catch (error) {
        const url_current_year = `https://api.nusmods.com/v2/${year-1}-${year}/modules/${moduleCode}.json`;
        const response = await fetch(url_current_year);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`, { cause: error });
        }
        return await response.json();
    }
}

async function getAllModules() {
    const year = new Date().getFullYear();
    try {
        const url_next_year = `https://api.nusmods.com/v2/${year}-${year+1}/moduleList.json`;
        const response = await fetch(url_next_year);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();

    } catch (error) {
        const url_current_year = `https://api.nusmods.com/v2/${year-1}-${year}/moduleList.json`;
        const response = await fetch(url_current_year);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`, { cause: error });
        }
        return await response.json();
    }
}




module.exports = {
    moduleGetData,
    getAllModules
};