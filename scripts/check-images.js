#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando imágenes en producción...\n');

const publicDir = path.join(__dirname, '..', 'public');
const assetsDir = path.join(publicDir, 'assets', 'imgs');

// Lista de imágenes esperadas
const expectedImages = [
  'loading_logo_black.PNG',
  'loading_logo_white.PNG',
  'estudio_maker_black.PNG',
  'estudio_maker_white.PNG',
  'logo.PNG'
];

console.log('📁 Directorio público:', publicDir);
console.log('📁 Directorio de assets:', assetsDir);
console.log('');

// Verificar si el directorio existe
if (!fs.existsSync(assetsDir)) {
  console.error('❌ El directorio de assets no existe:', assetsDir);
  process.exit(1);
}

// Verificar cada imagen
let allImagesExist = true;
expectedImages.forEach(imageName => {
  const imagePath = path.join(assetsDir, imageName);
  const exists = fs.existsSync(imagePath);
  
  if (exists) {
    const stats = fs.statSync(imagePath);
    const sizeKB = Math.round(stats.size / 1024);
    console.log(`✅ ${imageName} - ${sizeKB}KB`);
  } else {
    console.log(`❌ ${imageName} - NO ENCONTRADA`);
    allImagesExist = false;
  }
});

console.log('');

if (allImagesExist) {
  console.log('🎉 Todas las imágenes están presentes');
} else {
  console.log('⚠️  Algunas imágenes faltan');
}

// Verificar estructura de directorios
console.log('\n📂 Estructura de directorios:');
function printTree(dir, prefix = '') {
  const items = fs.readdirSync(dir);
  items.forEach((item, index) => {
    const itemPath = path.join(dir, item);
    const isLast = index === items.length - 1;
    const currentPrefix = isLast ? '└── ' : '├── ';
    const nextPrefix = prefix + (isLast ? '    ' : '│   ');
    
    console.log(prefix + currentPrefix + item);
    
    if (fs.statSync(itemPath).isDirectory()) {
      printTree(itemPath, nextPrefix);
    }
  });
}

printTree(publicDir);
