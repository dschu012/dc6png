#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const jimp = require('jimp');
const DC6 = require('./dc6');
const glob = require('fast-glob');

const OUTPUT_TYPES = {
  'png': jimp.MIME_PNG,
  'jpeg': jimp.MIME_JPEG,
  'bmp': jimp.MIME_BMP,
  'tiff': jimp.MIME_TIFF
};

function readPalette(file) {
  const palette = [];
  INFO(`Reading palette data: ${file}`);
  const buffer = fs.readFileSync(file);
  for (let i = 0; i < 256; i += 1) {
    palette.push([buffer[i * 3 + 2], buffer[i * 3 + 1], buffer[i * 3]]);
  }
  return palette;
}

function readTransforms(file) {
  const transforms = [];
  INFO(`Reading transforms data: ${file}`);
  const buffer = fs.readFileSync(file);
  for (let i = 0; i < 21; i += 1) {
    transforms.push(buffer.slice(0 + (i * 256), 256 + (i * 256)));
  }
  return transforms;
}

function getImageData(frame) {
  const image = new jimp(frame.header.width, frame.header.height);
  let data = image.bitmap.data;
  for (let y = 0, offset = 0; y < image.bitmap.height; y += 1) {
    for (let x = 0; x < image.bitmap.width; x += 1, offset += 4) {
        const paletteIdx = frame.data[y][x];
        //transparent
        if(paletteIdx === 0) {
          continue;
        }
        const rgb = global.palette[paletteIdx];
        Buffer.from([...rgb, 255]).copy(data, offset, 0, 4);
    }
  }
  return image;
}

function processFile(file) {
  INFO(`Reading file: ${file}`);
  const p = path.parse(file);
  const buffer = fs.readFileSync(file);
  const dc6 = DC6.from(buffer);
  DEBUG(JSON.stringify(dc6.header));
  for(let i = 0; i < dc6.header.directions; i += 1) {
    for(let j = 0; j < dc6.header.framesPerDirection; j += 1) {
      const frame = dc6.frames[i][j];
      DEBUG(`direction: ${i} frame: ${j}`);
      if(argv.c >= 0 && global.transforms) {
        DEBUG(`transforming to color index ${argv.c} using ${argv.t}`);
        frame.transform(global.transforms[argv.c]);
      }
      DEBUG(JSON.stringify(frame.header));
      const image = getImageData(frame, global.palette);
      for(const mediaType of argv.m) {
        if(!OUTPUT_TYPES[mediaType]) {
          throw new Error(`Unknown media type output [${mediaType}].`);
        }
        image.getBuffer(OUTPUT_TYPES[mediaType], function(err, b) {
          if(err) {
            throw err;
          }
          let name = `${p.name}.`;
          if(dc6.header.direction > 1 || dc6.header.framesPerDirection > 1) {
            name = `${p.name}_${i}_${j}.`;
          }
          name += mediaType;
          const outfile = path.resolve(path.join(argv.o ? argv.o : p.dir, `${name}`));
          INFO(`Writing file: ${outfile}`);
          fs.writeFileSync(outfile, b);
        });
      }
    }
  }
}

const argv = require('yargs')
  .option('p', {
    alias: 'palette',
    nargs: 1,
    describe: 'color palette. ex: (ACT1/pal.dat)',
    demand: true
  })
  .option('t', {
    alias: 'transform',
    nargs: 1,
    describe: 'transform file. ex: (grey.dat)'
  })
  .option('c', {
    alias: 'transform-color',
    nargs: 1,
    describe: 'transform color. (0-20)',
    type: 'number'
  })
  .option('d', {
    alias: 'dir',
    describe: 'output directory (must exist)',
    required: false,
    nargs: 1
  })
  .option('f', {
    alias: 'file',
    describe: 'file to process',
    type: 'array'
  })
  .options('m', {
    alias: 'media-type',
    describe: 'media type to output',
    type: 'array',
    default: 'png',
    choices: Object.keys(OUTPUT_TYPES)
  })
  .option('v', {
    alias: 'verbose',
    count: true,
  })
  .check((argv) => {
    if(argv.d || argv.f) {
      return true;
    } else {
      throw new Error("File or directory must be specified")
    }
  })
  .help('h')
  .alias('h', 'help')
  .argv;

const VERBOSE_LEVEL = argv.verbose;
function WARN()  { VERBOSE_LEVEL >= 0 && console.log.apply(console, arguments); }
function INFO()  { VERBOSE_LEVEL >= 1 && console.log.apply(console, arguments); }
function DEBUG() { VERBOSE_LEVEL >= 2 && console.log.apply(console, arguments); }

global.palette = readPalette(path.resolve(argv.p));

if(argv.t) {
  global.transforms = readTransforms(path.resolve(argv.t));
}


if(argv.f) {
  for(let f of argv.f) {
    //hacks to get glob working...
    //turn the relative path to an absoulte one and use posix seperators since that
    //is what the glob library supports.
    DEBUG(`File glob: ${f}`)
    f = path.resolve(f);
    f = f.split(path.sep);
    f = f.join(path.posix.sep);
    let files = glob.sync(f, {
      caseSensitiveMatch: false,
      dot: true,
      cwd: path.posix.sep
    });
    DEBUG(`Matches: [${files.join(', ')}]`);
    for(const file of files) {
      processFile(path.resolve(file));
    }
  }
}

INFO("Success!");