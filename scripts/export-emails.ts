#!/usr/bin/env node
/**
 * Export all emails from auth.users to CSV
 * 
 * Usage:
 *   SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key npm run export:emails
 *   or
 *   tsx scripts/export-emails.ts
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
  console.error('   SUPABASE_SERVICE_ROLE_KEY=your_key tsx scripts/export-emails.ts');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface UserWithEmail {
  id: string;
  email: string | null;
  email_confirmed_at: string | null;
  created_at: string | null;
  full_name?: string | null;
  phone_number?: string | null;
  phone_verified?: boolean | null;
  email_notifications_enabled?: boolean | null;
  whatsapp_notifications_enabled?: boolean | null;
  profile_created_at?: string | null;
  profile_updated_at?: string | null;
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
    'Email Confirmed At',
    'Full Name',
    'Phone Number',
    'Phone Verified',
    'Email Notifications Enabled',
    'WhatsApp Notifications Enabled',
    'User Created At',
    'Profile Created At',
    'Profile Updated At'
  ];
  
  // Create CSV rows
  const rows = data.map(user => [
    escapeCsvField(user.id),
    escapeCsvField(user.email),
    escapeCsvField(user.email_confirmed_at || ''),
    escapeCsvField(user.full_name || ''),
    escapeCsvField(user.phone_number || ''),
    escapeCsvField(user.phone_verified?.toString() || ''),
    escapeCsvField(user.email_notifications_enabled?.toString() || ''),
    escapeCsvField(user.whatsapp_notifications_enabled?.toString() || ''),
    escapeCsvField(user.created_at || ''),
    escapeCsvField(user.profile_created_at || ''),
    escapeCsvField(user.profile_updated_at || '')
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
async function exportEmails() {
  try {
    console.log('📧 Fetching emails from database...');
    
    // Fetch all users with emails using the RPC function
    let usersWithEmails: UserWithEmail[] = [];
    
    try {
      // Try using the RPC function first
      const { data: allUsers, error: usersError } = await supabase
        .rpc('get_all_users_with_roles');
      
      if (usersError) {
        console.warn('⚠️  RPC function failed (may require admin role):', usersError.message);
        console.log('   Trying alternative approach...');
        
        // Fallback: Query user_profiles and try to get emails via admin API
        // Since we have service role, we can use admin.auth.listUsers()
        // But first, let's try a SQL-based approach via a custom RPC
        throw new Error('RPC function requires admin role');
      }
      
      if (!allUsers || !Array.isArray(allUsers)) {
        throw new Error('Invalid response from get_all_users_with_roles');
      }
      
      console.log(`✅ Found ${allUsers.length} users via RPC`);
      
      // Filter users with emails
      const usersWithEmail = allUsers.filter((user: any) => 
        user.email && user.email.trim() !== ''
      );
      
      console.log(`✅ Found ${usersWithEmail.length} users with emails`);
      
      // Fetch profile data for these users
      const userIds = usersWithEmail.map((u: any) => u.user_id);
      
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name, phone_number, phone_verified, email_notifications_enabled, whatsapp_notifications_enabled, created_at, updated_at')
          .in('id', userIds);
        
        if (profilesError) {
          console.warn('⚠️  Could not fetch user profiles:', profilesError.message);
        }
        
        // Create a map of user_id -> profile
        const profileMap = new Map();
        if (profiles) {
          profiles.forEach((profile: any) => {
            profileMap.set(profile.id, profile);
          });
        }
        
        // Merge user data with profile data
        usersWithEmails = usersWithEmail.map((user: any) => {
          const profile = profileMap.get(user.user_id);
          return {
            id: user.user_id,
            email: user.email,
            email_confirmed_at: user.email_confirmed_at || null,
            created_at: user.created_at || null,
            full_name: profile?.full_name || null,
            phone_number: profile?.phone_number || null,
            phone_verified: profile?.phone_verified || null,
            email_notifications_enabled: profile?.email_notifications_enabled || null,
            whatsapp_notifications_enabled: profile?.whatsapp_notifications_enabled || null,
            profile_created_at: profile?.created_at || null,
            profile_updated_at: profile?.updated_at || null,
          };
        });
      }
      
    } catch (error) {
      // Fallback: Use admin API to list users
      console.log('📧 Using Admin API to fetch users...');
      
      try {
        // Use Supabase Admin API to list all users
        const adminApiUrl = `${SUPABASE_URL}/auth/v1/admin/users`;
        const response = await fetch(adminApiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Admin API error: ${response.status} ${response.statusText}`);
        }
        
        const adminData = await response.json();
        const allUsers = adminData.users || [];
        
        console.log(`✅ Found ${allUsers.length} users via Admin API`);
        
        // Filter users with emails
        const usersWithEmail = allUsers.filter((user: any) => 
          user.email && user.email.trim() !== ''
        );
        
        console.log(`✅ Found ${usersWithEmail.length} users with emails`);
        
        // Fetch profile data for these users
        const userIds = usersWithEmail.map((u: any) => u.id);
        
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('id, full_name, phone_number, phone_verified, email_notifications_enabled, whatsapp_notifications_enabled, created_at, updated_at')
            .in('id', userIds);
          
          if (profilesError) {
            console.warn('⚠️  Could not fetch user profiles:', profilesError.message);
          }
          
          // Create a map of user_id -> profile
          const profileMap = new Map();
          if (profiles) {
            profiles.forEach((profile: any) => {
              profileMap.set(profile.id, profile);
            });
          }
          
          // Merge user data with profile data
          usersWithEmails = usersWithEmail.map((user: any) => {
            const profile = profileMap.get(user.id);
            return {
              id: user.id,
              email: user.email,
              email_confirmed_at: user.email_confirmed_at || null,
              created_at: user.created_at || null,
              full_name: profile?.full_name || null,
              phone_number: profile?.phone_number || null,
              phone_verified: profile?.phone_verified || null,
              email_notifications_enabled: profile?.email_notifications_enabled || null,
              whatsapp_notifications_enabled: profile?.whatsapp_notifications_enabled || null,
              profile_created_at: profile?.created_at || null,
              profile_updated_at: profile?.updated_at || null,
            };
          });
        }
      } catch (adminError) {
        console.error('❌ Error using Admin API:', adminError);
        if (adminError instanceof Error) {
          console.error('   Message:', adminError.message);
        }
        console.error('\n💡 Tip: You can also use the SQL script (scripts/export-emails.sql) in Supabase SQL Editor');
        console.error('   The SQL script works directly in Supabase Dashboard > SQL Editor');
        process.exit(1);
      }
    }
    
    if (usersWithEmails.length === 0) {
      console.log('⚠️  No emails found in the database.');
      return;
    }
    
    // Generate CSV
    console.log('📄 Generating CSV...');
    const csvContent = arrayToCsv(usersWithEmails);
    
    // Create output filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `emails-export-${timestamp}.csv`;
    const filepath = path.join(process.cwd(), filename);
    
    // Write CSV file
    fs.writeFileSync(filepath, csvContent, 'utf-8');
    
    console.log(`✅ Successfully exported ${usersWithEmails.length} emails to: ${filename}`);
    console.log(`📁 File location: ${filepath}`);
    
    // Print summary
    const emailConfirmedCount = usersWithEmails.filter(u => u.email_confirmed_at !== null).length;
    const phoneVerifiedCount = usersWithEmails.filter(u => u.phone_verified === true).length;
    const emailNotificationsEnabledCount = usersWithEmails.filter(u => u.email_notifications_enabled === true).length;
    const whatsappNotificationsEnabledCount = usersWithEmails.filter(u => u.whatsapp_notifications_enabled === true).length;
    const withFullNameCount = usersWithEmails.filter(u => u.full_name && u.full_name.trim() !== '').length;
    
    console.log('\n📊 Summary:');
    console.log(`   Total emails: ${usersWithEmails.length}`);
    console.log(`   Email confirmed: ${emailConfirmedCount}`);
    console.log(`   Phone verified: ${phoneVerifiedCount}`);
    console.log(`   Email notifications enabled: ${emailNotificationsEnabledCount}`);
    console.log(`   WhatsApp notifications enabled: ${whatsappNotificationsEnabledCount}`);
    console.log(`   With full name: ${withFullNameCount}`);
    
  } catch (error) {
    console.error('❌ Error exporting emails:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
    }
    process.exit(1);
  }
}

// Run the export
exportEmails();
