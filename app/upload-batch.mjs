#!/usr/bin/env node
import { readdir } from 'fs/promises';
import { createReadStream, statSync } from 'fs';
import { join, basename, extname } from 'path';
import { spawn } from 'child_process';

const CATEGORY_MAP = {
  'worship': 'worship',
  'youth': 'youth',
  'events': 'events',
  'community': 'fellowship',
  'outreach': 'outreach'
};

const UPLOADS_DIR = '../uploads/gallery';
const BUCKET_NAME = 'gvim-gallery';
const DB_NAME = 'gvim-db';
const BATCH_SIZE = 5; // Upload 5 at a time
const RETRY_DELAY = 3000; // Wait 3s between batches

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    const proc = spawn('sh', ['-c', cmd], { stdio: 'pipe' });
    let stdout = '';
    let stderr = '';
    
    proc.stdout.on('data', d => stdout += d);
    proc.stderr.on('data', d => stderr += d);
    
    proc.on('close', code => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr || stdout));
    });
  });
}

async function uploadFile(filePath, r2Path, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await runCommand(`npx wrangler r2 object put ${BUCKET_NAME}/${r2Path} --file="${filePath}"`);
      return true;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(2000 * (i + 1)); // Exponential backoff
    }
  }
}

async function insertDB(sql, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      await runCommand(`npx wrangler d1 execute ${DB_NAME} --remote --command="${sql}"`);
      return true;
    } catch (err) {
      if (i === retries - 1) throw err;
      await sleep(2000 * (i + 1));
    }
  }
}

async function uploadGalleryBatch() {
  console.log('📸 Starting batch gallery upload...\n');

  // Collect all files first
  const allFiles = [];
  const categories = await readdir(UPLOADS_DIR);

  for (const category of categories) {
    const categoryPath = join(UPLOADS_DIR, category);
    const stat = statSync(categoryPath);
    
    if (!stat.isDirectory()) continue;

    const dbCategory = CATEGORY_MAP[category] || 'special';
    const files = await readdir(categoryPath);
    
    for (const file of files) {
      const ext = extname(file).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) continue;

      allFiles.push({
        filePath: join(categoryPath, file),
        filename: file,
        category: dbCategory,
        r2Path: `gallery/${dbCategory}/${file}`
      });
    }
  }

  console.log(`📊 Found ${allFiles.length} images to upload\n`);

  let uploaded = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < allFiles.length; i += BATCH_SIZE) {
    const batch = allFiles.slice(i, i + BATCH_SIZE);
    console.log(`\n🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(allFiles.length / BATCH_SIZE)}`);

    for (const item of batch) {
      try {
        console.log(`  ⬆️  ${item.filename}...`);
        
        // Upload to R2
        await uploadFile(item.filePath, item.r2Path);
        
        // Insert to D1
        const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const title = item.filename.replace(extname(item.filename), '').replace(/[_-]/g, ' ');
        const sql = `INSERT INTO gallery (id, title, category, file_path, filename, type) VALUES ('${id}', '${title}', '${item.category}', '${item.r2Path}', '${item.filename}', 'image');`;
        
        await insertDB(sql);
        
        console.log(`  ✅ Done`);
        uploaded++;
        
      } catch (error) {
        console.error(`  ❌ Failed: ${error.message}`);
        failed++;
      }
    }

    // Wait between batches to avoid rate limits
    if (i + BATCH_SIZE < allFiles.length) {
      console.log(`  ⏳ Waiting ${RETRY_DELAY/1000}s before next batch...`);
      await sleep(RETRY_DELAY);
    }
  }

  console.log(`\n✨ Upload complete!`);
  console.log(`   ✅ Uploaded: ${uploaded}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`\n🌐 Visit: https://gvim.pages.dev/gallery`);
}

uploadGalleryBatch().catch(console.error);
