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

app.use(express.json());
app.use(cors({ origin: '*' }))
app.use('/auth', authRouter);
app.use('/modules', modulesRouter);
app.use('/timetable', timetableRouter);
app.use('/su', suRouter);

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
