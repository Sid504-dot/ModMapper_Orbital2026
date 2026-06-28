const cors = require('cors')
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const supabase = require('./db/supabase');
const authRouter = require('./routes/auth');
const modulesRouter = require('./routes/modules');
require('./services/cron');
require('./services/heatMapUpdate');
const timetableRouter = require('./routes/timetable');
const suRouter = require('./routes/su');
const heatMapGetRouter = require('./routes/heatMap');
const groupsRouter = require('./routes/groups');
const groupFreeFinderRouter = require('./routes/groupFreeFinder');
const prereqTreeRouter = require('./routes/prereqTree');
const ueReccomenderRouter = require('./routes/ueRecommender');
const qnaHubRouter = require('./routes/qnaHub');

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/test-supabase', async (req, res) => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  res.json({ message: 'Supabase connected successfully', data });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});