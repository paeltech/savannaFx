#!/usr/bin/env node
/**
 * Export all phone numbers from user_profiles to CSV
 * 
 * Usage:
 *   SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key npm run export:phones
 *   or
 *   tsx scripts/export-phone-numbers.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Get environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://iurstpwtdnlmpvwyhqfn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('\nTo get your service role key:');
  console.error('1. Go to Supabase Dashboard > Settings > API');
  console.error('2. Copy the "service_role" key');
  console.error('3. Set it as an environment variable:');
  console.error('   export SUPABASE_SERVICE_ROLE_KEY=your_key_here');
  console.error('\nOr run:');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_key tsx scripts/export-phone-numbers.ts');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface UserProfile {
  id: string;
  phone_number: string | null;
  phone_verified: boolean | null;
  whatsapp_notifications_enabled: boolean | null;
  email_notifications_enabled: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

interface UserWithEmail extends UserProfile {
  email: string | null;
}

/**
 * Escape CSV field values
 */
function escapeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap it in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCsv(data: UserWithEmail[]): string {
  if (data.length === 0) {
    return '';
  }
  
  // CSV headers
  const headers = [
    'User ID',
    'Email',
    'Phone Number',
    'Phone Verified',
    'WhatsApp Notifications Enabled',
    'Email Notifications Enabled',
    'Created At',
    'Updated At'
  ];
  
  // Create CSV rows
  const rows = data.map(user => [
    escapeCsvField(user.id),
    escapeCsvField(user.email),
    escapeCsvField(user.phone_number),
    escapeCsvField(user.phone_verified?.toString() || ''),
    escapeCsvField(user.whatsapp_notifications_enabled?.toString() || ''),
    escapeCsvField(user.email_notifications_enabled?.toString() || ''),
    escapeCsvField(user.created_at || ''),
    escapeCsvField(user.updated_at || '')
  ]);
  
  // Combine headers and rows
  const csvLines = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ];
  
  return csvLines.join('\n');
}

/**
 * Main export function
 */
async function exportPhoneNumbers() {
  try {
    console.log('📞 Fetching phone numbers from database...');
    
    // Fetch user profiles with phone numbers
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, phone_number, phone_verified, whatsapp_notifications_enabled, email_notifications_enabled, created_at, updated_at')
      .not('phone_number', 'is', null)
      .order('created_at', { ascending: false });
    
    if (profilesError) {
      throw new Error(`Failed to fetch user profiles: ${profilesError.message}`);
    }
    
    if (!profiles || profiles.length === 0) {
      console.log('⚠️  No phone numbers found in the database.');
      return;
    }
    
    console.log(`✅ Found ${profiles.length} user profiles with phone numbers`);
    
    // Fetch emails from auth.users for matching user IDs
    console.log('📧 Fetching user emails...');
    const usersWithEmails: UserWithEmail[] = [];
    let emailMap = new Map<string, string>();
    
    // Try to get emails using the get_all_users_with_roles function
    // Note: This function checks for admin role, but service role should bypass RLS
    try {
      const { data: allUsers, error: usersError } = await supabase
        .rpc('get_all_users_with_roles');
      
      if (!usersError && allUsers && Array.isArray(allUsers)) {
        // Create a map of user_id -> email
        allUsers.forEach((user: any) => {
          if (user.user_id && user.email) {
            emailMap.set(user.user_id, user.email);
          }
        });
        console.log(`✅ Fetched ${emailMap.size} user emails`);
      } else {
        console.log('⚠️  Could not fetch emails via RPC function. Exporting phone numbers only.');
        console.log('   Note: You can also use the SQL script (scripts/export-phone-numbers.sql) in Supabase SQL Editor');
      }
    } catch (error) {
      console.log('⚠️  Could not fetch emails. Exporting phone numbers only.');
      console.log('   Note: You can also use the SQL script (scripts/export-phone-numbers.sql) in Supabase SQL Editor');
      if (error instanceof Error) {
        console.log(`   Error: ${error.message}`);
      }
    }
    
    // Merge emails with profiles
    profiles.forEach((profile: UserProfile) => {
      usersWithEmails.push({
        ...profile,
        email: emailMap.get(profile.id) || null
      });
    });
    
    // Generate CSV
    console.log('📄 Generating CSV...');
    const csvContent = arrayToCsv(usersWithEmails);
    
    // Create output filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `phone-numbers-export-${timestamp}.csv`;
    const filepath = path.join(process.cwd(), filename);
    
    // Write CSV file
    fs.writeFileSync(filepath, csvContent, 'utf-8');
    
    console.log(`✅ Successfully exported ${usersWithEmails.length} phone numbers to: ${filename}`);
    console.log(`📁 File location: ${filepath}`);
    
    // Print summary
    const verifiedCount = usersWithEmails.filter(u => u.phone_verified === true).length;
    const whatsappEnabledCount = usersWithEmails.filter(u => u.whatsapp_notifications_enabled === true).length;
    const withEmailCount = usersWithEmails.filter(u => u.email !== null).length;
    
    console.log('\n📊 Summary:');
    console.log(`   Total phone numbers: ${usersWithEmails.length}`);
    console.log(`   Verified phones: ${verifiedCount}`);
    console.log(`   WhatsApp enabled: ${whatsappEnabledCount}`);
    console.log(`   With email: ${withEmailCount}`);
    
  } catch (error) {
    console.error('❌ Error exporting phone numbers:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

// Run the export
exportPhoneNumbers();
