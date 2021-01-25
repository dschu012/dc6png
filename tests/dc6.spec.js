const assert = require('assert');
const fs = require('fs');

const DC6 = require('../src/dc6');

describe('DC6', function() {
  it('can parse', function() {
    const buffer = fs.readFileSync('./tests/data/global/items/invcap.DC6');
    const result = new DC6(buffer);
    
    assert.strictEqual(1, result.header.directions);
    assert.strictEqual(1, result.header.framesPerDirection);
    assert.strictEqual(1, result.frames.length);
    //invcap is 56x56
    let direction = 0, frame = 0;
    assert.strictEqual(56, result.frames[direction][frame].header.width);
    assert.strictEqual(56, result.frames[direction][frame].header.height);
  });
});