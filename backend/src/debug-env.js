// Debug script to check environment variables
console.log('=== ENVIRONMENT DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('EVOLUTION_API_URL:', process.env.EVOLUTION_API_URL ? 'SET' : 'NOT SET');
console.log('EVOLUTION_API_KEY:', process.env.EVOLUTION_API_KEY ? 'SET' : 'NOT SET');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('All environment variables:');
Object.keys(process.env).sort().forEach(key => {
  if (key.includes('SUPABASE') || key.includes('EVOLUTION') || key.includes('JWT') || key.includes('API')) {
    console.log(`${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
  }
});
console.log('=== END DEBUG ===');