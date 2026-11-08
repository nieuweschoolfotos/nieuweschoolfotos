const fs = require('fs');
const path = require('path');

const GITHUB_USERNAME = 'nieuweschoolfotos';
const GITHUB_REPO = 'nieuweschoolfotos';
const BRANCH = 'main';

function getFiles(dir, baseDir = '') {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const dirent of list) {
    const fullPath = path.join(dir, dirent.name);
    const relPath = path.posix.join(baseDir, dirent.name);
    if (dirent.isDirectory()) {
      results = results.concat(getFiles(fullPath, relPath));
    } else {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

function generateManifest() {
  const rootDir = __dirname;
  const fotoDir = path.join(rootDir, 'foto');
  
  const manifest = {
    school: {},
    eigen: {}
  };

  if (!fs.existsSync(fotoDir)) {
    console.log("foto klasoru bulunamadi!");
    return;
  }

  const allFiles = getFiles(fotoDir, 'foto');
  const imageRegex = /\.(jpe?g|png|webp|avif|gif|svg)$/i;

  for (const file of allFiles) {
    const parts = file.relPath.split('/');
    // foto/school/...
    if (parts[0] === 'foto' && parts[1] === 'school' && parts.length >= 4) {
      const year = parts[2];
      let subFolder = 'Algemeen';
      let fileName = '';

      if (parts.length === 4) {
        fileName = parts[3];
      } else {
        subFolder = parts[3];
        fileName = parts[4];
      }

      if (imageRegex.test(fileName)) {
        if (!manifest.school[year]) manifest.school[year] = [];
        
        let photoItem = manifest.school[year].find(p => p.name === fileName);
        if (!photoItem) {
          photoItem = {
            id: `school_${year}_${fileName}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
            name: fileName,
            year: year,
            versions: []
          };
          manifest.school[year].push(photoItem);
        }

        const bgTitle = isNaN(subFolder) ? subFolder : `Arkaplan ${subFolder}`;
        photoItem.versions.push({
          folder: subFolder,
          backgroundName: bgTitle,
          url: `./${file.relPath}`,
          backupUrl: `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${BRANCH}/${file.relPath}`
        });
      }
    }

    // foto/eigen/...
    if (parts[0] === 'foto' && parts[1] === 'eigen' && parts.length >= 4) {
      const year = parts[2];
      const studentName = parts[3].replace(/_/g, ' ');

      if (!manifest.eigen[year]) manifest.eigen[year] = [];
      let studentObj = manifest.eigen[year].find(s => s.student === studentName);
      if (!studentObj) {
        studentObj = { student: studentName, password: '123', photos: [] };
        manifest.eigen[year].push(studentObj);
      }

      if (parts.length === 5 && parts[4] === 'pass.txt') {
        try {
          studentObj.password = fs.readFileSync(file.fullPath, 'utf8').trim();
        } catch (e) {}
      } else {
        let subFolder = 'Algemeen';
        let fileName = '';
        if (parts.length === 5) {
          fileName = parts[4];
        } else if (parts.length >= 6) {
          subFolder = parts[4];
          fileName = parts[5];
        }

        if (imageRegex.test(fileName)) {
          let photoItem = studentObj.photos.find(p => p.name === fileName);
          if (!photoItem) {
            photoItem = {
              id: `eigen_${year}_${studentName}_${fileName}`.replace(/[^a-zA-Z0-9_-]/g, '_'),
              name: fileName,
              year: year,
              student: studentName,
              versions: []
            };
            studentObj.photos.push(photoItem);
          }

          const bgTitle = isNaN(subFolder) ? subFolder : `Arkaplan ${subFolder}`;
          photoItem.versions.push({
            folder: subFolder,
            backgroundName: bgTitle,
            url: `./${file.relPath}`,
            backupUrl: `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${GITHUB_REPO}/${BRANCH}/${file.relPath}`
          });
        }
      }
    }
  }

  const outputJs = `// Otomatik olusturulmus fotograf listesi
// Olusturulma zamani: ${new Date().toISOString()}
window.LOCAL_MANIFEST = ${JSON.stringify(manifest, null, 2)};
`;

  fs.writeFileSync(path.join(rootDir, 'manifest.js'), outputJs, 'utf8');
  console.log(`[OK] manifest.js guncellendi! (${new Date().toLocaleTimeString()})`);
}

generateManifest();

// Watch modu
if (process.argv.includes('--watch')) {
  console.log("Gozetleme (Watch) modu baslatildi: 'foto' klasorundeki degisiklikler bekleniyor...");
  let timeout = null;
  fs.watch(path.join(__dirname, 'foto'), { recursive: true }, (eventType, filename) => {
    if (filename && (filename.endsWith('.tmp') || filename.startsWith('.'))) return;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      console.log(`Degisiklik algilandi (${filename}), guncelleniyor...`);
      generateManifest();
    }, 300);
  });
}
