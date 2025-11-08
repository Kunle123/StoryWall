/**
 * Script to add varied theme colors to seed files
 */

import fs from 'fs';
import path from 'path';

const themeColors = [
  '#A855F7', // vibrant purple
  '#10B981', // emerald green
  '#F97316', // warm orange
  '#EF4444', // crimson red
  '#EC4899', // vivid pink
  '#EAB308', // golden yellow
  '#3B82F6', // bright blue
  '#14B8A6', // teal
];

function assignColor(index: number): string {
  return themeColors[index % themeColors.length];
}

async function addThemeColors(filename: string) {
  const filepath = path.join(process.cwd(), 'data', filename);
  
  console.log(`🎨 Adding theme colors to ${filename}...`);
  
  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  
  let colorIndex = 0;
  for (const entry of data) {
    for (const timeline of entry.timelines) {
      timeline.themeColor = assignColor(colorIndex);
      colorIndex++;
    }
  }
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  
  console.log(`✅ Updated ${filename}`);
}

async function main() {
  await addThemeColors('seed-30-timelines.json');
  await addThemeColors('seed-60-timelines.json');
  
  console.log('\n✨ All seed files now have varied theme colors!');
}

main();

