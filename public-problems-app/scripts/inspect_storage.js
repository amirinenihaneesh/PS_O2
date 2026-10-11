const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function inspect() {
  console.log('Supabase URL:', url);
  try {
    console.log('Available storage methods:', Object.keys(supabase.storage));
    // Try to call listBuckets / getBuckets / list
    if (typeof supabase.storage.listBuckets === 'function') {
      console.log('Calling storage.listBuckets()...');
      const res = await supabase.storage.listBuckets();
      console.log('listBuckets result:', res);
    } else if (typeof supabase.storage.getBuckets === 'function') {
      console.log('Calling storage.getBuckets()...');
      const res = await supabase.storage.getBuckets();
      console.log('getBuckets result:', res);
    } else if (typeof supabase.storage.buckets === 'object' && typeof supabase.storage.buckets.list === 'function') {
      console.log('Calling storage.buckets.list()...');
      const res = await supabase.storage.buckets.list();
      console.log('buckets.list result:', res);
    } else {
      console.log('No bucket-listing method found. Attempting to get a public URL for a sample path...');
      const publicRes = supabase.storage.from('issues-images').getPublicUrl('test');
      console.log('getPublicUrl output:', publicRes);
    }
  } catch (err) {
    console.error('Error when inspecting storage:', err.message || err);
  }
}

inspect();
