// Debug script to test Supabase connection
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jlgqpslemxirboufbviq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpsZ3Fwc2xlbXhpcmJvdWZidmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNzQyMDUsImV4cCI6MjA3OTk1MDIwNX0.rrP0l2cYZMk5iZBggAEsj7FLp8G01H6e1ChZsc5LlKs';

console.log('🔍 Testing Supabase Connection...');
console.log('URL:', SUPABASE_URL);
console.log('Key (first 20 chars):', SUPABASE_ANON_KEY.substring(0, 20) + '...');

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testConnection() {
    try {
        console.log('\n1. Testing basic connection...');
        const { data, error } = await supabase.from('documents').select('count').limit(1);
        
        if (error) {
            console.error('❌ Connection Error:', error);
            console.error('Error details:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
        } else {
            console.log('✅ Basic connection successful');
            console.log('Response:', data);
        }
    } catch (err) {
        console.error('💥 Network Error:', err.message);
        console.error('Full error:', err);
    }

    try {
        console.log('\n2. Testing auth connection...');
        const { data: { user } } = await supabase.auth.getUser();
        console.log('✅ Auth endpoint accessible');
        console.log('User response:', user);
    } catch (err) {
        console.error('❌ Auth Error:', err.message);
    }

    try {
        console.log('\n3. Testing REST API...');
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        console.log('REST API Response status:', response.status);
        if (response.ok) {
            console.log('✅ REST API accessible');
        } else {
            console.log('❌ REST API Error:', response.status, response.statusText);
        }
    } catch (err) {
        console.error('❌ REST API Network Error:', err.message);
    }
}

testConnection();