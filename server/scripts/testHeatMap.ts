import * as heatMapDB from '../db/heatMap';

async function main() {
    const moduleCode = process.argv[2];

    if (!moduleCode) {
        console.error('Usage: ts-node scripts/testHeatmap.ts <MODULE_CODE>');
        process.exit(1);
    }

    console.log(`Checking if ${moduleCode} needs update...`);
    await heatMapDB.needToUpdateSlotDemand(moduleCode);

    console.log(`Updating heatmap for ${moduleCode}...`);
    await heatMapDB.updateHeatMap(moduleCode);

    console.log('Done.');
    process.exit(0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});