import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const LOGO_PATH = '/Users/sajjad/Desktop/syco/physio-mobile/assets/images/logo.png';

const ANDROID_SIZES = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 }
];

async function generate() {
  if (!fs.existsSync(LOGO_PATH)) {
    console.error('Logo file not found:', LOGO_PATH);
    process.exit(1);
  }

  const logoData = fs.readFileSync(LOGO_PATH).toString('base64');
  const dataUrl = `data:image/png;base64,${logoData}`;

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <canvas id="canvas"></canvas>
      <script>
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        const img = new Image();
        img.src = '${dataUrl}';

        window.renderIcon = (size, isRound, format) => {
          return new Promise((resolve) => {
            img.onload = () => {
              canvas.width = size;
              canvas.height = size;
              ctx.clearRect(0, 0, size, size);

              if (isRound) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
                ctx.closePath();
                ctx.clip();
              }

              // Background
              ctx.fillStyle = '#ffffff';
              ctx.fillRect(0, 0, size, size);

              // Center logo (taking up 80% of canvas)
              const targetSize = size * 0.8;
              const aspect = img.width / img.height;
              let w = targetSize;
              let h = targetSize;
              if (aspect > 1) {
                h = targetSize / aspect;
              } else {
                w = targetSize * aspect;
              }
              const x = (size - w) / 2;
              const y = (size - h) / 2;
              ctx.drawImage(img, x, y, w, h);

              if (isRound) {
                ctx.restore();
              }

              resolve(canvas.toDataURL(format));
            };
            if (img.complete) {
              img.onload();
            }
          });
        };
      </script>
    </body>
    </html>
  `;

  await page.setContent(html);

  // Helper to draw and get base64 bytes
  const getIconBytes = async (size, isRound, isWebP) => {
    const format = isWebP ? 'image/webp' : 'image/png';
    const dataUri = await page.evaluate((s, r, f) => window.renderIcon(s, r, f), size, isRound, format);
    const base64Data = dataUri.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(base64Data, 'base64');
  };

  const apps = [
    {
      name: 'Patient App',
      iosPath: '/Users/sajjad/Desktop/syco/physio-mobile/ios/PhysioKhom/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png',
      androidRes: '/Users/sajjad/Desktop/syco/physio-mobile/android/app/src/main/res',
      expoIcon: '/Users/sajjad/Desktop/syco/physio-mobile/assets/images/icon.png'
    },
    {
      name: 'Provider App',
      iosPath: '/Users/sajjad/Desktop/syco/physio-provider-mobile/ios/PhysioKhomPro/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png',
      androidRes: '/Users/sajjad/Desktop/syco/physio-provider-mobile/android/app/src/main/res',
      expoIcon: '/Users/sajjad/Desktop/syco/physio-provider-mobile/assets/images/icon.png'
    }
  ];

  for (const app of apps) {
    console.log(`\nGenerating icons for ${app.name}...`);

    // 1. Generate Expo 1024x1024 app icon PNG
    const icon1024Bytes = await getIconBytes(1024, false, false);
    fs.mkdirSync(path.dirname(app.expoIcon), { recursive: true });
    fs.writeFileSync(app.expoIcon, icon1024Bytes);
    console.log(`Saved Expo icon to ${app.expoIcon}`);

    // 2. Generate iOS 1024x1024 app icon PNG
    fs.mkdirSync(path.dirname(app.iosPath), { recursive: true });
    fs.writeFileSync(app.iosPath, icon1024Bytes);
    console.log(`Saved iOS icon to ${app.iosPath}`);

    // 3. Generate Android Launcher Icons WebP
    for (const item of ANDROID_SIZES) {
      const folderPath = path.join(app.androidRes, item.folder);
      fs.mkdirSync(folderPath, { recursive: true });

      // Square webp
      const sqBytes = await getIconBytes(item.size, false, true);
      const sqPath = path.join(folderPath, 'ic_launcher.webp');
      fs.writeFileSync(sqPath, sqBytes);

      // Round webp
      const rdBytes = await getIconBytes(item.size, true, true);
      const rdPath = path.join(folderPath, 'ic_launcher_round.webp');
      fs.writeFileSync(rdPath, rdBytes);

      console.log(`Saved Android ${item.folder} icons (${item.size}x${item.size})`);
    }
  }

  await browser.close();
  console.log('\nAll app icons generated successfully!');
}

generate().catch(console.error);
