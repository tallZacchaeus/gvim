#!/usr/bin/env node
import { readdir } from 'fs/promises';
import { statSync } from 'fs';
import { join, extname } from 'path';
import { execSync } from 'child_process';

const CATEGORY_MAP = {
  'worship': 'worship',
  'youth': 'youth',
  'events': 'events',
  'community': 'fellowship',
  'outreach': 'outreach'
};

const UPLOADS_DIR = '../uploads/gallery';
const DB_NAME = 'gvim-db';

async function indexGallery() {
  console.log('📇 Indexing gallery in D1 database...\n');

  const categories = await readdir(UPLOADS_DIR);
  let totalIndexed = 0;

  // Build bulk SQL
  const inserts = [];

  for (const category of categories) {
    const categoryPath = join(UPLOADS_DIR, category);
    const stat = statSync(categoryPath);
    
    if (!stat.isDirectory()) continue;

    const dbCategory = CATEGORY_MAP[category] || 'special';
    const files = await readdir(categoryPath);
    
    for (const file of files) {
      const ext = extname(file).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) continue;

      const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const title = file.replace(extname(file), '').replace(/[_-]/g, ' ');
      const r2Path = `gallery/${dbCategory}/${file}`;
      
      inserts.push(`('${id}', '${title}', '${dbCategory}', '${r2Path}', '${file}', 'image')`);
      totalIndexed++;
    }
  }

  // Batch insert
  const sql = `INSERT INTO gallery (id, title, category, file_path, filename, type) VALUES ${inserts.join(', ')};`;
  
  console.log(`Inserting ${totalIndexed} records...`);
  
  try {
    execSync(
      `npx wrangler d1 execute ${DB_NAME} --remote --command="${sql}"`,
      { stdio: 'inherit' }
    );
    
    console.log(`\n✅ Successfully indexed ${totalIndexed} images!`);
    console.log(`\n🌐 Gallery live at: https://gvim.pages.dev/gallery`);
  } catch (error) {
    console.error('❌ Failed to index gallery:', error.message);
  }
}

indexGallery().catch(console.error);
