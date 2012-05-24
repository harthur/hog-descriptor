var _ = require("underscore"),
    processing = require("./processing"),
    norms = require("./norms");

_(module.exports).extend(processing);

exports.extractHOG = function(canvas, options) {
  options = options || {};
  var cellSize = options.cellSize || 6;
  var blockSize = options.blockSize || 2;
  var bins = options.bins || 6;
  var normalize = norms[options.norm || "L1"];

  var vectors = processing.gradientVectors(canvas);

  var cellsWide = Math.floor(canvas.width / cellSize);
  var cellsHigh = Math.floor(canvas.height / cellSize);
  var histograms = new Array(cellsHigh);

  for (var i = 0; i < cellsHigh; i++) {
    histograms[i] = new Array(cellsWide);

    for (var j = 0; j < cellsWide; j++) {
      var cell = getSquare(vectors, j * cellSize, i * cellSize, cellSize);
      histograms[i][j] = getHistogram(cell, bins);
    }
  }
  var blocks = getNormalizedBlocks(histograms, blockSize, normalize);
  return _(blocks).flatten();
}

function getNormalizedBlocks(histograms, blockSize, normalize) {
  var blocks = [];
  var blocksHigh = histograms.length - blockSize + 1;
  var blocksWide = histograms[0].length - blockSize + 1;

  for (var y = 0; y < blocksHigh; y++) {
    for (var x = 0; x < blocksWide; x++) {
      var block = getBlock(histograms, x, y, blockSize);
      normalize(block);
      blocks.push(block);
    }
  }
  return blocks;
}

function getBlock(matrix, x, y, length) {
  var square = [];
  for (var i = y; i < y + length; i++) {
    var row = matrix[i];
    for (var j = x; j < x + length; j++) {
      square = square.concat(row[j]);
    }
  }
  return square;
}


function getHistogram(cell, bins) {
  var histogram = zeros(bins);
  var size = cell.length;

  for (var i = 0; i < size; i++) {
    for (var j = 0; j < size; j++) {
      var vector = cell[i][j];
      var bin = binFor(vector.orient, bins);
      histogram[bin] += vector.mag;
    }
  }
  return histogram;
}

function getSquare(elements, x, y, size) {
  var square = new Array(size);

  for (var i = 0; i < size; i++) {
    square[i] = new Array(size);

    for (var j = 0; j < size; j++) {
      square[i][j] = elements[y + i][x + j];
    }
  }
  return square;
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
