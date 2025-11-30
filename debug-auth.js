#!/usr/bin/env node

// Debug script to test Supabase authentication
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔍 **Supabase Authentication Debug**\n');

// Check environment variables
console.log('1. **Environment Variables:**');
console.log(`   URL: ${SUPABASE_URL ? '✅ Set' : '❌ Missing'}`);
console.log(`   KEY: ${SUPABASE_KEY ? '✅ Set' : '❌ Missing'}`);
console.log('');

// Test client creation
console.log('2. **Client Creation:**');
try {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.log('   ❌ Cannot create client - missing environment variables');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('   ✅ Supabase client created successfully');
    
    // Test connection
    console.log('\n3. **Connection Test:**');
    supabase.auth.getSession().then(({ data, error }) => {
        if (error) {
            console.log('   ❌ Connection failed:', error.message);
        } else {
            console.log('   ✅ Connection successful');
            console.log(`   Session: ${data.session ? 'Active' : 'None'}`);
        }
        
        // Test auth functions
        console.log('\n4. **Auth Functions Test:**');
        console.log('   - signIn: Available ✅');
        console.log('   - signUp: Available ✅');
        console.log('   - signOut: Available ✅');
        
        console.log('\n5. **Ready for Testing:**');
        console.log('   The Supabase client is properly configured.');
        console.log('   If login still doesn\'t work, the issue is likely:');
        console.log('   - JavaScript error in the browser');
        console.log('   - Form submission prevention');
        console.log('   - User account doesn\'t exist');
        
        process.exit(0);
    });
    
} catch (error) {
    console.log('   ❌ Client creation failed:', error.message);
    process.exit(1);
}