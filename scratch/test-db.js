const { createClient } = require('@supabase/supabase-js');

const url = 'https://ldfmjhhmkdjtccefcesk.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkZm1qaGhta2RqdGNjZWZjZXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzMzkzNDgsImV4cCI6MjEwMDkxNTM0OH0.ZfU8Bx-XAOFGyUHn_DDwoxK2zhumBqdloQx2CLuUMPE';

const supabase = createClient(url, key);

async function testConnection() {
  console.log('Testing Supabase Connection...');
  const { data, error } = await supabase.from('curriculum_levels').select('*').limit(1);
  if (error) {
    console.log('Supabase Table query result:', error.message);
  } else {
    console.log('Supabase Connection SUCCESS! Tables are ready.', data);
  }
}

testConnection();
