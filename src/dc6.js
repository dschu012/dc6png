class DC6 {
  
  constructor(buffer) {
    this.header = {
      directions: buffer.readInt32LE(0x10),
      framesPerDirection: buffer.readInt32LE(0x14)
    };
    this.frames = new Array(this.header.directions);
    for(let i = 0; i < this.header.directions; i++) {
      this.frames[i] = new Array(this.header.framesPerDirection);
    }
    this._indexFrames(buffer);
  }

  _indexFrames(buffer) {
    const nFrames = this.header.directions * this.header.framesPerDirection;
    let frameOffsets = [];
    for (let i = 0; i < nFrames; i += 1) {
      frameOffsets.push(buffer.readUInt32LE(DC6.HEADER_SIZE + (0x4 * i)));
    }
    frameOffsets.push(buffer.length);
    for (let i = 0, fo = 0; i < this.header.directions; i += 1) {
      for (let j = 0; j < this.header.framesPerDirection; j += 1, fo += 1) {
        this.frames[i][j] = new DC6Frame(buffer.slice(frameOffsets[fo], frameOffsets[fo + 1]));
      }
    }
  }

}

class DC6Frame {

  constructor(buffer) {
    this.header = {
      flip: buffer.readInt32LE(0x0),
      width: buffer.readInt32LE(0x4),
      height: buffer.readInt32LE(0x8),
      offsetX: buffer.readInt32LE(0xc),
      offsetY: buffer.readInt32LE(0x10),
      length: buffer.readInt32LE(0x1c),
    };
    //indexed data
    this.data = [];
    this._indexFrame(buffer);
  }

  _indexFrame(buffer) {
    let x = 0, y = this.header.height - 1;
    for (let i = 0; i < this.header.height; i += 1) {
      this.data[i] = Buffer.alloc(this.header.width);
    }
    for (let i = 0; i < this.header.length;) {
      let chunkSize = buffer.readUInt8(DC6Frame.HEADER_SIZE + i++);
      if (chunkSize === 0x80) { //eol
        x = 0, y -= 1;
      } else if (chunkSize & 0x80) { //transparent repeat for chunkSize bytes
        x += chunkSize & 0x7F;
      } else { //read chunkSize bytes
        let start = DC6Frame.HEADER_SIZE + i;
        buffer.copy(this.data[y], x, start, start + chunkSize);
        x += chunkSize, i += chunkSize;
      }
    }
  }

  transform(transform) {
    for(let y = 0; y < this.header.height; y += 1) {
      for(let x = 0; x < this.header.width; x += 1) {
        let paletteIdx = this.data[y][x];
        if(paletteIdx === 0) {
          continue;
        }
        this.data[y][x] = transform[paletteIdx];
      }
    }
  }

}

DC6.HEADER_SIZE = 0x18;
DC6Frame.HEADER_SIZE = 0x20;

module.exports = DC6;