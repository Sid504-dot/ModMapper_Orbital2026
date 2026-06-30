import { refreshModules } from './refresh';
import { syncModuleEmbeddings } from '../db/moduleEmbeddings';
import cron from 'node-cron';

cron.schedule('0 2 * * *', () => {
    const date = new Date().getDate();
    const month = new Date().getMonth() + 1;
    if ((date >= 15 && month === 7) || (date <= 25 && month === 8)
    || (date >= 15 && month === 12) || (date <= 25 && month === 1)) {
        console.log('Running daily module refresh at 2 AM');
        refreshModules();
        syncModuleEmbeddings();
    } else if (date === 1) {
        console.log('Running daily module refresh at 2 AM');
        refreshModules();
        syncModuleEmbeddings();
    }
});

console.log('Cron job for daily module refresh has been set up');  