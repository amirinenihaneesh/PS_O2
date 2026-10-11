const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

async function run() {
  try {
    console.log('Listing buckets...');
    const list = await (supabase.storage.listBuckets ? supabase.storage.listBuckets() : supabase.storage.getBuckets());
    console.log('Buckets:', list);

    const bucket = 'issues-images';
    const filePath = 'scripts/test_upload_payload.txt';
    fs.writeFileSync(filePath, 'hello-from-test-upload');
    const fileName = `test-${Date.now()}.txt`;

    console.log(`Uploading ${fileName} to bucket ${bucket}...`);
    const file = fs.createReadStream(filePath);
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
    if (error) {
      console.error('Upload error:', error);
      process.exit(1);
    }
    console.log('Upload data:', data);

    const publicRes = supabase.storage.from(bucket).getPublicUrl(fileName);
    console.log('Public URL:', publicRes);

    if (publicRes && publicRes.data && publicRes.data.publicUrl) {
      console.log('Fetching public URL...');
      const resp = await fetch(publicRes.data.publicUrl);
      console.log('Fetch status:', resp.status);
      const text = await resp.text();
      console.log('First 200 chars:', text.slice(0,200));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
