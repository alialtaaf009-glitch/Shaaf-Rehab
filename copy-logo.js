import fs from 'fs';
import path from 'path';

const source = path.join(process.cwd(), 'src', 'assets', 'images', 'app_logo_1780731422770.png');
const publicDir = path.join(process.cwd(), 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const targets = ['app_logo.png', 'icon-192.png', 'icon-512.png', 'icon-144.png'];

targets.forEach(target => {
  const dest = path.join(publicDir, target);
  try {
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, dest);
      console.log(`Successfully copied logo to ${dest}`);
    } else {
      console.warn(`Source logo not found at: ${source}`);
    }
  } catch (err) {
    console.error(`Error copying logo to ${target}:`, err);
  }
});
