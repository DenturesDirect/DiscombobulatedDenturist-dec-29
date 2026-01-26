/**
 * List All Files in Supabase Storage Bucket
 * 
 * Shows all files in your Supabase Storage bucket, even if not in database
 * 
 * Usage:
 *   SUPABASE_URL=your_url SUPABASE_SERVICE_ROLE_KEY=your_key npm run list-supabase-files
 */

import { getSupabaseClient } from "../server/supabaseStorage";

async function listSupabaseFiles() {
  console.log("🔍 Listing all files in Supabase Storage bucket...\n");

  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ ERROR: Supabase not configured!");
    console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
    process.exit(1);
  }

  const supabase = getSupabaseClient();
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || "patient-files";

  try {
    // List all files recursively
    async function listFiles(path: string = '', files: Array<{ name: string; path: string; size: number; updated: string }> = []): Promise<Array<{ name: string; path: string; size: number; updated: string }>> {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list(path, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (error) {
        console.error(`❌ Error listing ${path}:`, error.message);
        return files;
      }

      if (!data) {
        return files;
      }

      for (const item of data) {
        const fullPath = path ? `${path}/${item.name}` : item.name;
        
        if (item.id) {
          // It's a folder, recurse
          const subFiles = await listFiles(fullPath, files);
          files = subFiles;
        } else {
          // It's a file
          files.push({
            name: item.name,
            path: fullPath,
            size: item.metadata?.size || 0,
            updated: item.updated_at || item.created_at || 'unknown'
          });
        }
      }

      return files;
    }

    console.log(`📦 Listing files from bucket: ${bucketName}\n`);
    const allFiles = await listFiles();

    console.log(`📊 Found ${allFiles.length} file(s) in Supabase Storage:\n`);

    // Group by type
    const images = allFiles.filter(f => /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(f.name));
    const pdfs = allFiles.filter(f => /\.pdf$/i.test(f.name));
    const others = allFiles.filter(f => !/\.(jpg|jpeg|png|gif|svg|webp|pdf)$/i.test(f.name));

    console.log(`📸 Images: ${images.length}`);
    console.log(`📄 PDFs: ${pdfs.length}`);
    console.log(`📁 Other: ${others.length}\n`);

    console.log("📋 All Files:\n");
    allFiles.forEach((file, index) => {
      const sizeKB = (file.size / 1024).toFixed(2);
      console.log(`${index + 1}. ${file.path}`);
      console.log(`   Size: ${sizeKB} KB`);
      console.log(`   Updated: ${file.updated}`);
      console.log('');
    });

    console.log(`\n✅ Total: ${allFiles.length} file(s) ready to migrate`);

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

listSupabaseFiles().catch(console.error);
