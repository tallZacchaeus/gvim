#!/usr/bin/env node
import { readdir } from 'fs/promises';
import { readFileSync, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { execSync } from 'child_process';

// Category mapping: folder name -> DB slug
const CATEGORY_MAP = {
  'worship': 'worship',
  'youth': 'youth',
  'events': 'events',
  'community': 'fellowship', // Map community to fellowship category
  'outreach': 'outreach'
};

const UPLOADS_DIR = '../uploads/gallery';
const BUCKET_NAME = 'gvim-gallery';
const DB_NAME = 'gvim-db';

async function uploadGallery() {
  console.log('📸 Starting gallery upload to R2 and D1...\n');

  const categories = await readdir(UPLOADS_DIR);
  let totalUploaded = 0;
  let totalSkipped = 0;

  for (const category of categories) {
    const categoryPath = join(UPLOADS_DIR, category);
    const stat = statSync(categoryPath);
    
    if (!stat.isDirectory()) continue;

    const dbCategory = CATEGORY_MAP[category] || 'special';
    console.log(`\n📁 Processing category: ${category} -> ${dbCategory}`);

    const files = await readdir(categoryPath);
    
    for (const file of files) {
      const ext = extname(file).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        continue;
      }

      const filePath = join(categoryPath, file);
      const r2Path = `gallery/${dbCategory}/${file}`;
      
      try {
        // Upload to R2
        console.log(`  ⬆️  Uploading ${file}...`);
        execSync(
          `npx wrangler r2 object put ${BUCKET_NAME}/${r2Path} --file="${filePath}"`,
          { stdio: 'pipe' }
        );

        // Generate ID and prepare DB insert
        const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const title = file.replace(extname(file), '').replace(/[_-]/g, ' ');
        
        // Insert into D1
        const sql = `INSERT INTO gallery (id, title, category, file_path, filename, type) VALUES ('${id}', '${title}', '${dbCategory}', '${r2Path}', '${file}', 'image');`;
        
        execSync(
          `npx wrangler d1 execute ${DB_NAME} --remote --command="${sql}"`,
          { stdio: 'pipe' }
        );

        console.log(`  ✅ ${file} uploaded and indexed`);
        totalUploaded++;
        
      } catch (error) {
        console.error(`  ❌ Failed to upload ${file}:`, error.message);
        totalSkipped++;
      }
    }
  }

  console.log(`\n✨ Upload complete!`);
  console.log(`   Uploaded: ${totalUploaded}`);
  console.log(`   Skipped: ${totalSkipped}`);
  console.log(`\n🌐 Gallery available at: https://gvim.pages.dev/gallery`);
}

uploadGallery().catch(console.error);
