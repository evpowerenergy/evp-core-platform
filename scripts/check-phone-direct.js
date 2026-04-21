// Script to check phone number 0855601245 directly from Supabase
// Run with: node check-phone-direct.js

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ttfjapfdzrxmbxbarfbn.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ Missing SUPABASE_ANON_KEY or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Normalize function (same as in Edge Function)
const normalizePhone = (phoneNumber) => {
  if (!phoneNumber) return '';
  return phoneNumber.trim().replace(/[^\d]/g, '');
};

const targetPhone = '0855601245';
const normalizedTarget = normalizePhone(targetPhone);

console.log('🔍 Checking phone number:', targetPhone);
console.log('📱 Normalized target:', normalizedTarget);
console.log('');

async function checkPhone() {
  try {
    // 1. Get all leads with phone numbers
    console.log('📊 Fetching all leads with phone numbers...');
    const { data: allLeads, error: fetchError } = await supabase
      .from('leads')
      .select('id, tel, full_name, created_by, created_at')
      .not('tel', 'is', null)
      .limit(10000);

    if (fetchError) {
      console.error('❌ Error fetching leads:', fetchError);
      return;
    }

    console.log(`✅ Found ${allLeads?.length || 0} leads with phone numbers`);
    console.log('');

    // 2. Check exact match
    console.log('🔍 Checking exact match...');
    const exactMatch = allLeads?.filter(lead => lead.tel === targetPhone);
    if (exactMatch && exactMatch.length > 0) {
      console.log(`✅ Found ${exactMatch.length} exact match(es):`);
      exactMatch.forEach(lead => {
        console.log(`   - ID: ${lead.id}, Tel: "${lead.tel}", Name: ${lead.full_name}, Created by: ${lead.created_by}`);
      });
    } else {
      console.log('❌ No exact match found');
    }
    console.log('');

    // 3. Check normalized match
    console.log('🔍 Checking normalized match...');
    const normalizedMatches = allLeads?.filter(lead => {
      const normalizedLeadPhone = normalizePhone(lead.tel || '');
      return normalizedLeadPhone === normalizedTarget;
    });

    if (normalizedMatches && normalizedMatches.length > 0) {
      console.log(`✅ Found ${normalizedMatches.length} normalized match(es):`);
      normalizedMatches.forEach(lead => {
        const normalized = normalizePhone(lead.tel || '');
        console.log(`   - ID: ${lead.id}`);
        console.log(`     Original tel: "${lead.tel}"`);
        console.log(`     Normalized: "${normalized}"`);
        console.log(`     Name: ${lead.full_name}`);
        console.log(`     Created by: ${lead.created_by}`);
        console.log(`     Created at: ${lead.created_at}`);
        console.log('');
      });
    } else {
      console.log('❌ No normalized match found');
      console.log('');
      
      // 4. Show similar phone numbers (for debugging)
      console.log('🔍 Showing similar phone numbers (first 20)...');
      const similar = allLeads
        ?.map(lead => ({
          ...lead,
          normalized: normalizePhone(lead.tel || '')
        }))
        .filter(lead => 
          lead.normalized.includes('855601245') || 
          lead.normalized.includes('0855601245') ||
          lead.tel?.includes('855601245') ||
          lead.tel?.includes('0855601245')
        )
        .slice(0, 20);

      if (similar && similar.length > 0) {
        console.log(`Found ${similar.length} similar phone numbers:`);
        similar.forEach(lead => {
          console.log(`   - ID: ${lead.id}, Tel: "${lead.tel}", Normalized: "${lead.normalized}"`);
        });
      } else {
        console.log('❌ No similar phone numbers found');
      }
    }

    // 5. Show first 10 phone numbers for reference
    console.log('');
    console.log('📋 First 10 phone numbers in database (for reference):');
    allLeads?.slice(0, 10).forEach((lead, index) => {
      const normalized = normalizePhone(lead.tel || '');
      console.log(`   ${index + 1}. ID: ${lead.id}, Tel: "${lead.tel}", Normalized: "${normalized}"`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkPhone();

