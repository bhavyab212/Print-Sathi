import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import * as fs from 'fs';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUpload() {
  console.log("Testing storage upload...");
  // Create a dummy file
  fs.writeFileSync('dummy.txt', 'Hello World');
  const fileData = fs.readFileSync('dummy.txt');

  const filePath = `68af6ad4-9323-4da0-9ed7-7954b208be1e/${Date.now()}_test.txt`;
  const { data, error } = await supabase.storage.from('customer_uploads').upload(filePath, fileData, {
    contentType: 'text/plain'
  });

  if (error) {
    console.error("Storage Upload Error:", error);
  } else {
    console.log("Storage Upload Success:", data);
  }
}

testUpload();
