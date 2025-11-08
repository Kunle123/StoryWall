/**
 * Script to update seed file image styles to use variety
 */

import fs from 'fs';
import path from 'path';

const styles = [
  'photorealistic', // For celebrities/sports/political figures
  'illustration',
  'minimalist',
  'vintage',
  'watercolor',
  '3D Render',
  'sketch',
  'abstract'
];

// Topics that should use photorealistic (celebrities, sports with known athletes, political figures)
const photorealisticKeywords = [
  'super bowl', 'nba', 'grammy', 'oscar', 'emmy', 'golden globe', 'wimbledon',
  'masters', 'world series', 'tour de france', 'us open', 'kentucky derby',
  'daytona', 'cma', 'vma', 'billboard', 'british open', 'australian open',
  'ryder cup', 'rose bowl', 'sag awards', 'tony awards', 'people\'s choice'
];

function shouldUsePhotorealistic(title: string, description: string): boolean {
  const text = (title + ' ' + description).toLowerCase();
  return photorealisticKeywords.some(keyword => text.includes(keyword));
}

function assignStyle(index: number, title: string, description: string): string {
  // Use photorealistic for celebrity/sports content
  if (shouldUsePhotorealistic(title, description)) {
    return 'photorealistic';
  }
  
  // Distribute other styles evenly
  const nonPhotoStyles = styles.filter(s => s !== 'photorealistic');
  return nonPhotoStyles[index % nonPhotoStyles.length];
}

async function updateSeedFile(filename: string) {
  const filepath = path.join(process.cwd(), 'data', filename);
  
  console.log(`📝 Updating ${filename}...`);
  
  const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  
  let styleIndex = 0;
  for (const entry of data) {
    for (const timeline of entry.timelines) {
      const newStyle = assignStyle(styleIndex, timeline.title, timeline.description);
      timeline.imageStyle = newStyle;
      styleIndex++;
    }
  }
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  
  // Count styles used
  const styleCounts: Record<string, number> = {};
  for (const entry of data) {
    for (const timeline of entry.timelines) {
      styleCounts[timeline.imageStyle] = (styleCounts[timeline.imageStyle] || 0) + 1;
    }
  }
  
  console.log(`✅ Updated ${filename}`);
  console.log('Style distribution:');
  Object.entries(styleCounts).forEach(([style, count]) => {
    console.log(`   ${style}: ${count}`);
  });
  console.log('');
}

async function main() {
  await updateSeedFile('seed-30-timelines.json');
  await updateSeedFile('seed-60-timelines.json');
  
  console.log('✨ All seed files updated!');
}

main();

