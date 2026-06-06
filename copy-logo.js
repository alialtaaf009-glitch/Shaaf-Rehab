import fs from 'fs';
import path from 'path';

// Source logo can live in either of these locations depending on tooling history.
const candidates = [
  path.join(process.cwd(), 'src', 'lib', 'assets', 'images', 'app_logo_1780731422770.png'),
  path.join(process.cwd(), 'src', 'assets', 'images', 'app_logo_1780731422770.png'),
];
const source = candidates.find(p => fs.existsSync(p));

const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Only copy the master into app_logo.png. The sized icons (144/192/512 and
// maskable variants) are pre-generated and committed in /public, so we must
// NOT overwrite them with the full-size master (that was the old bug that made
// every icon 1024x1024).
if (source) {
  try {
    fs.copyFileSync(source, path.join(publicDir, 'app_logo.png'));
    console.log('Copied master logo to public/app_logo.png');
  } catch (err) {
    console.error('Error copying master logo:', err);
  }
} else {
  console.warn('Master logo source not found; using existing public/ icons.');
}
