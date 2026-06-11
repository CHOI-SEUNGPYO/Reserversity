const fs = require('fs');
const path = require('path');

/**
 * afterPack hook: electron-builder의 glob이 .prisma(dot-dir)를 무시하는 버그 우회.
 * 패키징 후 .prisma/client를 app.asar.unpacked/node_modules/.prisma/client 로 직접 복사.
 */
exports.default = async function (context) {
  const src = path.join(context.packager.projectDir, 'node_modules', '.prisma', 'client');
  const dest = path.join(
    context.appOutDir,
    'resources',
    'app.asar.unpacked',
    'node_modules',
    '.prisma',
    'client'
  );

  fs.mkdirSync(dest, { recursive: true });
  copyDirSync(src, dest);
  console.log('afterPack: Copied .prisma/client →', dest);
};

function copyDirSync(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
