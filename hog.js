var processing = require("./processing"),
    norms = require("./norms");

// also export all the functions from processing.js
for (var func in processing) {
  exports[func] = processing[func];
}

exports.extractHOG = function(canvas, options) {
  options = options || {};
  var cellSize = options.cellSize || 6;
  var blockSize = options.blockSize || 2;
  var bins = options.bins || 6;
  var blockStride = options.blockStride || (blockSize / 2);
  var normalize = norms[options.norm || "L1"];

  var vectors = processing.gradientVectors(canvas);

  var cellsWide = Math.floor(canvas.width / cellSize);
  var cellsHigh = Math.floor(canvas.height / cellSize);
  var histograms = new Array(cellsHigh);

  for (var i = 0; i < cellsHigh; i++) {
    histograms[i] = new Array(cellsWide);

    for (var j = 0; j < cellsWide; j++) {
      histograms[i][j] = getHistogram(vectors, j * cellSize, i * cellSize,
                                      cellSize, bins);
    }
  }
  var blocks = getNormalizedBlocks(histograms, blockSize, blockStride, normalize);
  return blocks;
}

function getNormalizedBlocks(histograms, blockSize, blockStride, normalize) {
  var blocks = [];
  var blocksHigh = histograms.length - blockSize + 1;
  var blocksWide = histograms[0].length - blockSize + 1;

  for (var y = 0; y < blocksHigh; y += blockStride) {
    for (var x = 0; x < blocksWide; x += blockStride) {
      var block = getBlock(histograms, x, y, blockSize);
      normalize(block);
      blocks.push(block);
    }
  }
  return Array.prototype.concat.apply([], blocks);
}

function getBlock(matrix, x, y, length) {
  var square = [];
  for (var i = y; i < y + length; i++) {
    var row = matrix[i];
    for (var j = x; j < x + length; j++) {
      square.push(row[j]);
    }
  }
  return Array.prototype.concat.apply([], square);
}

function getHistogram(elements, x, y, size, bins) {
  var histogram = zeros(bins);

  for (var i = 0; i < size; i++) {
    for (var j = 0; j < size; j++) {
      var vector = elements[y + i][x + j];
      var bin = binFor(vector.orient, bins);
      histogram[bin] += vector.mag;
    }
  }
  return histogram;
}

function binFor(radians, bins) {
  var angle = radians * (180 / Math.PI);
  if (angle < 0) {
    angle += 180;
  }
  var bin = Math.floor(angle / 181 * bins);
  return bin;
}

function zeros(size) {
  var array = new Array(size);
  for (var i = 0; i < size; i++) {
    array[i] = 0;
  }
  return array;
}
