import cors from 'cors';
import express, { Request, Response } from 'express';
import supabase from './db/supabase';
import authRouter from './routes/auth';
import modulesRouter from './routes/modules';
import './services/cron';
import './services/heatMapUpdate';
import timetableRouter from './routes/timetable';
import suRouter from './routes/su';
import heatMapGetRouter from './routes/heatMap';
import groupsRouter from './routes/groups';
import groupFreeFinderRouter from './routes/groupFreeFinder';
import prereqTreeRouter from './routes/prereqTree';
import ueReccomenderRouter from './routes/ueRecommender';
import qnaHubRouter from './routes/qnaHub';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: '*' }))
app.use('/auth', authRouter);
app.use('/modules', modulesRouter);
app.use('/timetable', timetableRouter);
app.use('/su', suRouter);
app.use('/heatmap', heatMapGetRouter);
app.use('/api', groupsRouter);
app.use('/api', groupFreeFinderRouter);
app.use('/prereqTree', prereqTreeRouter);
app.use('/ueReccomender', ueReccomenderRouter);
app.use('/qnahub',qnaHubRouter)

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/test-supabase', async (req: Request, res: Response) => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ message: 'Supabase connected successfully', data });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});