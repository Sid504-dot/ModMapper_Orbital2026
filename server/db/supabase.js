require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
console.log('SUPABASE KEY ROLE:', supabaseKey
  ? JSON.parse(Buffer.from(supabaseKey.split('.')[1], 'base64').toString()).role
  : 'UNDEFINED');
const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;