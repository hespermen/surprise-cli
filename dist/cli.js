#!/usr/bin/env node
import { createRequire as __cliCreateRequire } from "node:module";
const require = __cliCreateRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});
var __commonJS = (cb, mod) => function __require2() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/qrcode/lib/can-promise.js
var require_can_promise = __commonJS({
  "node_modules/qrcode/lib/can-promise.js"(exports, module) {
    module.exports = function() {
      return typeof Promise === "function" && Promise.prototype && Promise.prototype.then;
    };
  }
});

// node_modules/qrcode/lib/core/utils.js
var require_utils = __commonJS({
  "node_modules/qrcode/lib/core/utils.js"(exports) {
    var toSJISFunction;
    var CODEWORDS_COUNT = [
      0,
      // Not used
      26,
      44,
      70,
      100,
      134,
      172,
      196,
      242,
      292,
      346,
      404,
      466,
      532,
      581,
      655,
      733,
      815,
      901,
      991,
      1085,
      1156,
      1258,
      1364,
      1474,
      1588,
      1706,
      1828,
      1921,
      2051,
      2185,
      2323,
      2465,
      2611,
      2761,
      2876,
      3034,
      3196,
      3362,
      3532,
      3706
    ];
    exports.getSymbolSize = function getSymbolSize(version) {
      if (!version) throw new Error('"version" cannot be null or undefined');
      if (version < 1 || version > 40) throw new Error('"version" should be in range from 1 to 40');
      return version * 4 + 17;
    };
    exports.getSymbolTotalCodewords = function getSymbolTotalCodewords(version) {
      return CODEWORDS_COUNT[version];
    };
    exports.getBCHDigit = function(data) {
      let digit = 0;
      while (data !== 0) {
        digit++;
        data >>>= 1;
      }
      return digit;
    };
    exports.setToSJISFunction = function setToSJISFunction(f) {
      if (typeof f !== "function") {
        throw new Error('"toSJISFunc" is not a valid function.');
      }
      toSJISFunction = f;
    };
    exports.isKanjiModeEnabled = function() {
      return typeof toSJISFunction !== "undefined";
    };
    exports.toSJIS = function toSJIS(kanji) {
      return toSJISFunction(kanji);
    };
  }
});

// node_modules/qrcode/lib/core/error-correction-level.js
var require_error_correction_level = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-level.js"(exports) {
    exports.L = { bit: 1 };
    exports.M = { bit: 0 };
    exports.Q = { bit: 3 };
    exports.H = { bit: 2 };
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "l":
        case "low":
          return exports.L;
        case "m":
        case "medium":
          return exports.M;
        case "q":
        case "quartile":
          return exports.Q;
        case "h":
        case "high":
          return exports.H;
        default:
          throw new Error("Unknown EC Level: " + string);
      }
    }
    exports.isValid = function isValid(level) {
      return level && typeof level.bit !== "undefined" && level.bit >= 0 && level.bit < 4;
    };
    exports.from = function from(value, defaultValue) {
      if (exports.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    };
  }
});

// node_modules/qrcode/lib/core/bit-buffer.js
var require_bit_buffer = __commonJS({
  "node_modules/qrcode/lib/core/bit-buffer.js"(exports, module) {
    function BitBuffer() {
      this.buffer = [];
      this.length = 0;
    }
    BitBuffer.prototype = {
      get: function(index) {
        const bufIndex = Math.floor(index / 8);
        return (this.buffer[bufIndex] >>> 7 - index % 8 & 1) === 1;
      },
      put: function(num, length) {
        for (let i = 0; i < length; i++) {
          this.putBit((num >>> length - i - 1 & 1) === 1);
        }
      },
      getLengthInBits: function() {
        return this.length;
      },
      putBit: function(bit) {
        const bufIndex = Math.floor(this.length / 8);
        if (this.buffer.length <= bufIndex) {
          this.buffer.push(0);
        }
        if (bit) {
          this.buffer[bufIndex] |= 128 >>> this.length % 8;
        }
        this.length++;
      }
    };
    module.exports = BitBuffer;
  }
});

// node_modules/qrcode/lib/core/bit-matrix.js
var require_bit_matrix = __commonJS({
  "node_modules/qrcode/lib/core/bit-matrix.js"(exports, module) {
    function BitMatrix(size) {
      if (!size || size < 1) {
        throw new Error("BitMatrix size must be defined and greater than 0");
      }
      this.size = size;
      this.data = new Uint8Array(size * size);
      this.reservedBit = new Uint8Array(size * size);
    }
    BitMatrix.prototype.set = function(row, col, value, reserved) {
      const index = row * this.size + col;
      this.data[index] = value;
      if (reserved) this.reservedBit[index] = true;
    };
    BitMatrix.prototype.get = function(row, col) {
      return this.data[row * this.size + col];
    };
    BitMatrix.prototype.xor = function(row, col, value) {
      this.data[row * this.size + col] ^= value;
    };
    BitMatrix.prototype.isReserved = function(row, col) {
      return this.reservedBit[row * this.size + col];
    };
    module.exports = BitMatrix;
  }
});

// node_modules/qrcode/lib/core/alignment-pattern.js
var require_alignment_pattern = __commonJS({
  "node_modules/qrcode/lib/core/alignment-pattern.js"(exports) {
    var getSymbolSize = require_utils().getSymbolSize;
    exports.getRowColCoords = function getRowColCoords(version) {
      if (version === 1) return [];
      const posCount = Math.floor(version / 7) + 2;
      const size = getSymbolSize(version);
      const intervals = size === 145 ? 26 : Math.ceil((size - 13) / (2 * posCount - 2)) * 2;
      const positions = [size - 7];
      for (let i = 1; i < posCount - 1; i++) {
        positions[i] = positions[i - 1] - intervals;
      }
      positions.push(6);
      return positions.reverse();
    };
    exports.getPositions = function getPositions(version) {
      const coords = [];
      const pos = exports.getRowColCoords(version);
      const posLength = pos.length;
      for (let i = 0; i < posLength; i++) {
        for (let j = 0; j < posLength; j++) {
          if (i === 0 && j === 0 || // top-left
          i === 0 && j === posLength - 1 || // bottom-left
          i === posLength - 1 && j === 0) {
            continue;
          }
          coords.push([pos[i], pos[j]]);
        }
      }
      return coords;
    };
  }
});

// node_modules/qrcode/lib/core/finder-pattern.js
var require_finder_pattern = __commonJS({
  "node_modules/qrcode/lib/core/finder-pattern.js"(exports) {
    var getSymbolSize = require_utils().getSymbolSize;
    var FINDER_PATTERN_SIZE = 7;
    exports.getPositions = function getPositions(version) {
      const size = getSymbolSize(version);
      return [
        // top-left
        [0, 0],
        // top-right
        [size - FINDER_PATTERN_SIZE, 0],
        // bottom-left
        [0, size - FINDER_PATTERN_SIZE]
      ];
    };
  }
});

// node_modules/qrcode/lib/core/mask-pattern.js
var require_mask_pattern = __commonJS({
  "node_modules/qrcode/lib/core/mask-pattern.js"(exports) {
    exports.Patterns = {
      PATTERN000: 0,
      PATTERN001: 1,
      PATTERN010: 2,
      PATTERN011: 3,
      PATTERN100: 4,
      PATTERN101: 5,
      PATTERN110: 6,
      PATTERN111: 7
    };
    var PenaltyScores = {
      N1: 3,
      N2: 3,
      N3: 40,
      N4: 10
    };
    exports.isValid = function isValid(mask) {
      return mask != null && mask !== "" && !isNaN(mask) && mask >= 0 && mask <= 7;
    };
    exports.from = function from(value) {
      return exports.isValid(value) ? parseInt(value, 10) : void 0;
    };
    exports.getPenaltyN1 = function getPenaltyN1(data) {
      const size = data.size;
      let points = 0;
      let sameCountCol = 0;
      let sameCountRow = 0;
      let lastCol = null;
      let lastRow = null;
      for (let row = 0; row < size; row++) {
        sameCountCol = sameCountRow = 0;
        lastCol = lastRow = null;
        for (let col = 0; col < size; col++) {
          let module2 = data.get(row, col);
          if (module2 === lastCol) {
            sameCountCol++;
          } else {
            if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
            lastCol = module2;
            sameCountCol = 1;
          }
          module2 = data.get(col, row);
          if (module2 === lastRow) {
            sameCountRow++;
          } else {
            if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
            lastRow = module2;
            sameCountRow = 1;
          }
        }
        if (sameCountCol >= 5) points += PenaltyScores.N1 + (sameCountCol - 5);
        if (sameCountRow >= 5) points += PenaltyScores.N1 + (sameCountRow - 5);
      }
      return points;
    };
    exports.getPenaltyN2 = function getPenaltyN2(data) {
      const size = data.size;
      let points = 0;
      for (let row = 0; row < size - 1; row++) {
        for (let col = 0; col < size - 1; col++) {
          const last = data.get(row, col) + data.get(row, col + 1) + data.get(row + 1, col) + data.get(row + 1, col + 1);
          if (last === 4 || last === 0) points++;
        }
      }
      return points * PenaltyScores.N2;
    };
    exports.getPenaltyN3 = function getPenaltyN3(data) {
      const size = data.size;
      let points = 0;
      let bitsCol = 0;
      let bitsRow = 0;
      for (let row = 0; row < size; row++) {
        bitsCol = bitsRow = 0;
        for (let col = 0; col < size; col++) {
          bitsCol = bitsCol << 1 & 2047 | data.get(row, col);
          if (col >= 10 && (bitsCol === 1488 || bitsCol === 93)) points++;
          bitsRow = bitsRow << 1 & 2047 | data.get(col, row);
          if (col >= 10 && (bitsRow === 1488 || bitsRow === 93)) points++;
        }
      }
      return points * PenaltyScores.N3;
    };
    exports.getPenaltyN4 = function getPenaltyN4(data) {
      let darkCount = 0;
      const modulesCount = data.data.length;
      for (let i = 0; i < modulesCount; i++) darkCount += data.data[i];
      const k = Math.abs(Math.ceil(darkCount * 100 / modulesCount / 5) - 10);
      return k * PenaltyScores.N4;
    };
    function getMaskAt(maskPattern, i, j) {
      switch (maskPattern) {
        case exports.Patterns.PATTERN000:
          return (i + j) % 2 === 0;
        case exports.Patterns.PATTERN001:
          return i % 2 === 0;
        case exports.Patterns.PATTERN010:
          return j % 3 === 0;
        case exports.Patterns.PATTERN011:
          return (i + j) % 3 === 0;
        case exports.Patterns.PATTERN100:
          return (Math.floor(i / 2) + Math.floor(j / 3)) % 2 === 0;
        case exports.Patterns.PATTERN101:
          return i * j % 2 + i * j % 3 === 0;
        case exports.Patterns.PATTERN110:
          return (i * j % 2 + i * j % 3) % 2 === 0;
        case exports.Patterns.PATTERN111:
          return (i * j % 3 + (i + j) % 2) % 2 === 0;
        default:
          throw new Error("bad maskPattern:" + maskPattern);
      }
    }
    exports.applyMask = function applyMask(pattern, data) {
      const size = data.size;
      for (let col = 0; col < size; col++) {
        for (let row = 0; row < size; row++) {
          if (data.isReserved(row, col)) continue;
          data.xor(row, col, getMaskAt(pattern, row, col));
        }
      }
    };
    exports.getBestMask = function getBestMask(data, setupFormatFunc) {
      const numPatterns = Object.keys(exports.Patterns).length;
      let bestPattern = 0;
      let lowerPenalty = Infinity;
      for (let p = 0; p < numPatterns; p++) {
        setupFormatFunc(p);
        exports.applyMask(p, data);
        const penalty = exports.getPenaltyN1(data) + exports.getPenaltyN2(data) + exports.getPenaltyN3(data) + exports.getPenaltyN4(data);
        exports.applyMask(p, data);
        if (penalty < lowerPenalty) {
          lowerPenalty = penalty;
          bestPattern = p;
        }
      }
      return bestPattern;
    };
  }
});

// node_modules/qrcode/lib/core/error-correction-code.js
var require_error_correction_code = __commonJS({
  "node_modules/qrcode/lib/core/error-correction-code.js"(exports) {
    var ECLevel = require_error_correction_level();
    var EC_BLOCKS_TABLE = [
      // L  M  Q  H
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      2,
      2,
      1,
      2,
      2,
      4,
      1,
      2,
      4,
      4,
      2,
      4,
      4,
      4,
      2,
      4,
      6,
      5,
      2,
      4,
      6,
      6,
      2,
      5,
      8,
      8,
      4,
      5,
      8,
      8,
      4,
      5,
      8,
      11,
      4,
      8,
      10,
      11,
      4,
      9,
      12,
      16,
      4,
      9,
      16,
      16,
      6,
      10,
      12,
      18,
      6,
      10,
      17,
      16,
      6,
      11,
      16,
      19,
      6,
      13,
      18,
      21,
      7,
      14,
      21,
      25,
      8,
      16,
      20,
      25,
      8,
      17,
      23,
      25,
      9,
      17,
      23,
      34,
      9,
      18,
      25,
      30,
      10,
      20,
      27,
      32,
      12,
      21,
      29,
      35,
      12,
      23,
      34,
      37,
      12,
      25,
      34,
      40,
      13,
      26,
      35,
      42,
      14,
      28,
      38,
      45,
      15,
      29,
      40,
      48,
      16,
      31,
      43,
      51,
      17,
      33,
      45,
      54,
      18,
      35,
      48,
      57,
      19,
      37,
      51,
      60,
      19,
      38,
      53,
      63,
      20,
      40,
      56,
      66,
      21,
      43,
      59,
      70,
      22,
      45,
      62,
      74,
      24,
      47,
      65,
      77,
      25,
      49,
      68,
      81
    ];
    var EC_CODEWORDS_TABLE = [
      // L  M  Q  H
      7,
      10,
      13,
      17,
      10,
      16,
      22,
      28,
      15,
      26,
      36,
      44,
      20,
      36,
      52,
      64,
      26,
      48,
      72,
      88,
      36,
      64,
      96,
      112,
      40,
      72,
      108,
      130,
      48,
      88,
      132,
      156,
      60,
      110,
      160,
      192,
      72,
      130,
      192,
      224,
      80,
      150,
      224,
      264,
      96,
      176,
      260,
      308,
      104,
      198,
      288,
      352,
      120,
      216,
      320,
      384,
      132,
      240,
      360,
      432,
      144,
      280,
      408,
      480,
      168,
      308,
      448,
      532,
      180,
      338,
      504,
      588,
      196,
      364,
      546,
      650,
      224,
      416,
      600,
      700,
      224,
      442,
      644,
      750,
      252,
      476,
      690,
      816,
      270,
      504,
      750,
      900,
      300,
      560,
      810,
      960,
      312,
      588,
      870,
      1050,
      336,
      644,
      952,
      1110,
      360,
      700,
      1020,
      1200,
      390,
      728,
      1050,
      1260,
      420,
      784,
      1140,
      1350,
      450,
      812,
      1200,
      1440,
      480,
      868,
      1290,
      1530,
      510,
      924,
      1350,
      1620,
      540,
      980,
      1440,
      1710,
      570,
      1036,
      1530,
      1800,
      570,
      1064,
      1590,
      1890,
      600,
      1120,
      1680,
      1980,
      630,
      1204,
      1770,
      2100,
      660,
      1260,
      1860,
      2220,
      720,
      1316,
      1950,
      2310,
      750,
      1372,
      2040,
      2430
    ];
    exports.getBlocksCount = function getBlocksCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_BLOCKS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    };
    exports.getTotalCodewordsCount = function getTotalCodewordsCount(version, errorCorrectionLevel) {
      switch (errorCorrectionLevel) {
        case ECLevel.L:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 0];
        case ECLevel.M:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 1];
        case ECLevel.Q:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 2];
        case ECLevel.H:
          return EC_CODEWORDS_TABLE[(version - 1) * 4 + 3];
        default:
          return void 0;
      }
    };
  }
});

// node_modules/qrcode/lib/core/galois-field.js
var require_galois_field = __commonJS({
  "node_modules/qrcode/lib/core/galois-field.js"(exports) {
    var EXP_TABLE = new Uint8Array(512);
    var LOG_TABLE = new Uint8Array(256);
    (function initTables() {
      let x = 1;
      for (let i = 0; i < 255; i++) {
        EXP_TABLE[i] = x;
        LOG_TABLE[x] = i;
        x <<= 1;
        if (x & 256) {
          x ^= 285;
        }
      }
      for (let i = 255; i < 512; i++) {
        EXP_TABLE[i] = EXP_TABLE[i - 255];
      }
    })();
    exports.log = function log(n) {
      if (n < 1) throw new Error("log(" + n + ")");
      return LOG_TABLE[n];
    };
    exports.exp = function exp(n) {
      return EXP_TABLE[n];
    };
    exports.mul = function mul(x, y) {
      if (x === 0 || y === 0) return 0;
      return EXP_TABLE[LOG_TABLE[x] + LOG_TABLE[y]];
    };
  }
});

// node_modules/qrcode/lib/core/polynomial.js
var require_polynomial = __commonJS({
  "node_modules/qrcode/lib/core/polynomial.js"(exports) {
    var GF = require_galois_field();
    exports.mul = function mul(p1, p2) {
      const coeff = new Uint8Array(p1.length + p2.length - 1);
      for (let i = 0; i < p1.length; i++) {
        for (let j = 0; j < p2.length; j++) {
          coeff[i + j] ^= GF.mul(p1[i], p2[j]);
        }
      }
      return coeff;
    };
    exports.mod = function mod(divident, divisor) {
      let result = new Uint8Array(divident);
      while (result.length - divisor.length >= 0) {
        const coeff = result[0];
        for (let i = 0; i < divisor.length; i++) {
          result[i] ^= GF.mul(divisor[i], coeff);
        }
        let offset = 0;
        while (offset < result.length && result[offset] === 0) offset++;
        result = result.slice(offset);
      }
      return result;
    };
    exports.generateECPolynomial = function generateECPolynomial(degree) {
      let poly = new Uint8Array([1]);
      for (let i = 0; i < degree; i++) {
        poly = exports.mul(poly, new Uint8Array([1, GF.exp(i)]));
      }
      return poly;
    };
  }
});

// node_modules/qrcode/lib/core/reed-solomon-encoder.js
var require_reed_solomon_encoder = __commonJS({
  "node_modules/qrcode/lib/core/reed-solomon-encoder.js"(exports, module) {
    var Polynomial = require_polynomial();
    function ReedSolomonEncoder(degree) {
      this.genPoly = void 0;
      this.degree = degree;
      if (this.degree) this.initialize(this.degree);
    }
    ReedSolomonEncoder.prototype.initialize = function initialize(degree) {
      this.degree = degree;
      this.genPoly = Polynomial.generateECPolynomial(this.degree);
    };
    ReedSolomonEncoder.prototype.encode = function encode(data) {
      if (!this.genPoly) {
        throw new Error("Encoder not initialized");
      }
      const paddedData = new Uint8Array(data.length + this.degree);
      paddedData.set(data);
      const remainder = Polynomial.mod(paddedData, this.genPoly);
      const start = this.degree - remainder.length;
      if (start > 0) {
        const buff = new Uint8Array(this.degree);
        buff.set(remainder, start);
        return buff;
      }
      return remainder;
    };
    module.exports = ReedSolomonEncoder;
  }
});

// node_modules/qrcode/lib/core/version-check.js
var require_version_check = __commonJS({
  "node_modules/qrcode/lib/core/version-check.js"(exports) {
    exports.isValid = function isValid(version) {
      return !isNaN(version) && version >= 1 && version <= 40;
    };
  }
});

// node_modules/qrcode/lib/core/regex.js
var require_regex = __commonJS({
  "node_modules/qrcode/lib/core/regex.js"(exports) {
    var numeric = "[0-9]+";
    var alphanumeric = "[A-Z $%*+\\-./:]+";
    var kanji = "(?:[u3000-u303F]|[u3040-u309F]|[u30A0-u30FF]|[uFF00-uFFEF]|[u4E00-u9FAF]|[u2605-u2606]|[u2190-u2195]|u203B|[u2010u2015u2018u2019u2025u2026u201Cu201Du2225u2260]|[u0391-u0451]|[u00A7u00A8u00B1u00B4u00D7u00F7])+";
    kanji = kanji.replace(/u/g, "\\u");
    var byte = "(?:(?![A-Z0-9 $%*+\\-./:]|" + kanji + ")(?:.|[\r\n]))+";
    exports.KANJI = new RegExp(kanji, "g");
    exports.BYTE_KANJI = new RegExp("[^A-Z0-9 $%*+\\-./:]+", "g");
    exports.BYTE = new RegExp(byte, "g");
    exports.NUMERIC = new RegExp(numeric, "g");
    exports.ALPHANUMERIC = new RegExp(alphanumeric, "g");
    var TEST_KANJI = new RegExp("^" + kanji + "$");
    var TEST_NUMERIC = new RegExp("^" + numeric + "$");
    var TEST_ALPHANUMERIC = new RegExp("^[A-Z0-9 $%*+\\-./:]+$");
    exports.testKanji = function testKanji(str) {
      return TEST_KANJI.test(str);
    };
    exports.testNumeric = function testNumeric(str) {
      return TEST_NUMERIC.test(str);
    };
    exports.testAlphanumeric = function testAlphanumeric(str) {
      return TEST_ALPHANUMERIC.test(str);
    };
  }
});

// node_modules/qrcode/lib/core/mode.js
var require_mode = __commonJS({
  "node_modules/qrcode/lib/core/mode.js"(exports) {
    var VersionCheck = require_version_check();
    var Regex = require_regex();
    exports.NUMERIC = {
      id: "Numeric",
      bit: 1 << 0,
      ccBits: [10, 12, 14]
    };
    exports.ALPHANUMERIC = {
      id: "Alphanumeric",
      bit: 1 << 1,
      ccBits: [9, 11, 13]
    };
    exports.BYTE = {
      id: "Byte",
      bit: 1 << 2,
      ccBits: [8, 16, 16]
    };
    exports.KANJI = {
      id: "Kanji",
      bit: 1 << 3,
      ccBits: [8, 10, 12]
    };
    exports.MIXED = {
      bit: -1
    };
    exports.getCharCountIndicator = function getCharCountIndicator(mode, version) {
      if (!mode.ccBits) throw new Error("Invalid mode: " + mode);
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid version: " + version);
      }
      if (version >= 1 && version < 10) return mode.ccBits[0];
      else if (version < 27) return mode.ccBits[1];
      return mode.ccBits[2];
    };
    exports.getBestModeForData = function getBestModeForData(dataStr) {
      if (Regex.testNumeric(dataStr)) return exports.NUMERIC;
      else if (Regex.testAlphanumeric(dataStr)) return exports.ALPHANUMERIC;
      else if (Regex.testKanji(dataStr)) return exports.KANJI;
      else return exports.BYTE;
    };
    exports.toString = function toString(mode) {
      if (mode && mode.id) return mode.id;
      throw new Error("Invalid mode");
    };
    exports.isValid = function isValid(mode) {
      return mode && mode.bit && mode.ccBits;
    };
    function fromString(string) {
      if (typeof string !== "string") {
        throw new Error("Param is not a string");
      }
      const lcStr = string.toLowerCase();
      switch (lcStr) {
        case "numeric":
          return exports.NUMERIC;
        case "alphanumeric":
          return exports.ALPHANUMERIC;
        case "kanji":
          return exports.KANJI;
        case "byte":
          return exports.BYTE;
        default:
          throw new Error("Unknown mode: " + string);
      }
    }
    exports.from = function from(value, defaultValue) {
      if (exports.isValid(value)) {
        return value;
      }
      try {
        return fromString(value);
      } catch (e) {
        return defaultValue;
      }
    };
  }
});

// node_modules/qrcode/lib/core/version.js
var require_version = __commonJS({
  "node_modules/qrcode/lib/core/version.js"(exports) {
    var Utils = require_utils();
    var ECCode = require_error_correction_code();
    var ECLevel = require_error_correction_level();
    var Mode = require_mode();
    var VersionCheck = require_version_check();
    var G18 = 1 << 12 | 1 << 11 | 1 << 10 | 1 << 9 | 1 << 8 | 1 << 5 | 1 << 2 | 1 << 0;
    var G18_BCH = Utils.getBCHDigit(G18);
    function getBestVersionForDataLength(mode, length, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, mode)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    function getReservedBitsCount(mode, version) {
      return Mode.getCharCountIndicator(mode, version) + 4;
    }
    function getTotalBitsFromDataArray(segments, version) {
      let totalBits = 0;
      segments.forEach(function(data) {
        const reservedBits = getReservedBitsCount(data.mode, version);
        totalBits += reservedBits + data.getBitsLength();
      });
      return totalBits;
    }
    function getBestVersionForMixedData(segments, errorCorrectionLevel) {
      for (let currentVersion = 1; currentVersion <= 40; currentVersion++) {
        const length = getTotalBitsFromDataArray(segments, currentVersion);
        if (length <= exports.getCapacity(currentVersion, errorCorrectionLevel, Mode.MIXED)) {
          return currentVersion;
        }
      }
      return void 0;
    }
    exports.from = function from(value, defaultValue) {
      if (VersionCheck.isValid(value)) {
        return parseInt(value, 10);
      }
      return defaultValue;
    };
    exports.getCapacity = function getCapacity(version, errorCorrectionLevel, mode) {
      if (!VersionCheck.isValid(version)) {
        throw new Error("Invalid QR Code version");
      }
      if (typeof mode === "undefined") mode = Mode.BYTE;
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (mode === Mode.MIXED) return dataTotalCodewordsBits;
      const usableBits = dataTotalCodewordsBits - getReservedBitsCount(mode, version);
      switch (mode) {
        case Mode.NUMERIC:
          return Math.floor(usableBits / 10 * 3);
        case Mode.ALPHANUMERIC:
          return Math.floor(usableBits / 11 * 2);
        case Mode.KANJI:
          return Math.floor(usableBits / 13);
        case Mode.BYTE:
        default:
          return Math.floor(usableBits / 8);
      }
    };
    exports.getBestVersionForData = function getBestVersionForData(data, errorCorrectionLevel) {
      let seg;
      const ecl = ECLevel.from(errorCorrectionLevel, ECLevel.M);
      if (Array.isArray(data)) {
        if (data.length > 1) {
          return getBestVersionForMixedData(data, ecl);
        }
        if (data.length === 0) {
          return 1;
        }
        seg = data[0];
      } else {
        seg = data;
      }
      return getBestVersionForDataLength(seg.mode, seg.getLength(), ecl);
    };
    exports.getEncodedBits = function getEncodedBits(version) {
      if (!VersionCheck.isValid(version) || version < 7) {
        throw new Error("Invalid QR Code version");
      }
      let d = version << 12;
      while (Utils.getBCHDigit(d) - G18_BCH >= 0) {
        d ^= G18 << Utils.getBCHDigit(d) - G18_BCH;
      }
      return version << 12 | d;
    };
  }
});

// node_modules/qrcode/lib/core/format-info.js
var require_format_info = __commonJS({
  "node_modules/qrcode/lib/core/format-info.js"(exports) {
    var Utils = require_utils();
    var G15 = 1 << 10 | 1 << 8 | 1 << 5 | 1 << 4 | 1 << 2 | 1 << 1 | 1 << 0;
    var G15_MASK = 1 << 14 | 1 << 12 | 1 << 10 | 1 << 4 | 1 << 1;
    var G15_BCH = Utils.getBCHDigit(G15);
    exports.getEncodedBits = function getEncodedBits(errorCorrectionLevel, mask) {
      const data = errorCorrectionLevel.bit << 3 | mask;
      let d = data << 10;
      while (Utils.getBCHDigit(d) - G15_BCH >= 0) {
        d ^= G15 << Utils.getBCHDigit(d) - G15_BCH;
      }
      return (data << 10 | d) ^ G15_MASK;
    };
  }
});

// node_modules/qrcode/lib/core/numeric-data.js
var require_numeric_data = __commonJS({
  "node_modules/qrcode/lib/core/numeric-data.js"(exports, module) {
    var Mode = require_mode();
    function NumericData(data) {
      this.mode = Mode.NUMERIC;
      this.data = data.toString();
    }
    NumericData.getBitsLength = function getBitsLength(length) {
      return 10 * Math.floor(length / 3) + (length % 3 ? length % 3 * 3 + 1 : 0);
    };
    NumericData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    NumericData.prototype.getBitsLength = function getBitsLength() {
      return NumericData.getBitsLength(this.data.length);
    };
    NumericData.prototype.write = function write(bitBuffer) {
      let i, group, value;
      for (i = 0; i + 3 <= this.data.length; i += 3) {
        group = this.data.substr(i, 3);
        value = parseInt(group, 10);
        bitBuffer.put(value, 10);
      }
      const remainingNum = this.data.length - i;
      if (remainingNum > 0) {
        group = this.data.substr(i);
        value = parseInt(group, 10);
        bitBuffer.put(value, remainingNum * 3 + 1);
      }
    };
    module.exports = NumericData;
  }
});

// node_modules/qrcode/lib/core/alphanumeric-data.js
var require_alphanumeric_data = __commonJS({
  "node_modules/qrcode/lib/core/alphanumeric-data.js"(exports, module) {
    var Mode = require_mode();
    var ALPHA_NUM_CHARS = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z",
      " ",
      "$",
      "%",
      "*",
      "+",
      "-",
      ".",
      "/",
      ":"
    ];
    function AlphanumericData(data) {
      this.mode = Mode.ALPHANUMERIC;
      this.data = data;
    }
    AlphanumericData.getBitsLength = function getBitsLength(length) {
      return 11 * Math.floor(length / 2) + 6 * (length % 2);
    };
    AlphanumericData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    AlphanumericData.prototype.getBitsLength = function getBitsLength() {
      return AlphanumericData.getBitsLength(this.data.length);
    };
    AlphanumericData.prototype.write = function write(bitBuffer) {
      let i;
      for (i = 0; i + 2 <= this.data.length; i += 2) {
        let value = ALPHA_NUM_CHARS.indexOf(this.data[i]) * 45;
        value += ALPHA_NUM_CHARS.indexOf(this.data[i + 1]);
        bitBuffer.put(value, 11);
      }
      if (this.data.length % 2) {
        bitBuffer.put(ALPHA_NUM_CHARS.indexOf(this.data[i]), 6);
      }
    };
    module.exports = AlphanumericData;
  }
});

// node_modules/qrcode/lib/core/byte-data.js
var require_byte_data = __commonJS({
  "node_modules/qrcode/lib/core/byte-data.js"(exports, module) {
    var Mode = require_mode();
    function ByteData(data) {
      this.mode = Mode.BYTE;
      if (typeof data === "string") {
        this.data = new TextEncoder().encode(data);
      } else {
        this.data = new Uint8Array(data);
      }
    }
    ByteData.getBitsLength = function getBitsLength(length) {
      return length * 8;
    };
    ByteData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    ByteData.prototype.getBitsLength = function getBitsLength() {
      return ByteData.getBitsLength(this.data.length);
    };
    ByteData.prototype.write = function(bitBuffer) {
      for (let i = 0, l = this.data.length; i < l; i++) {
        bitBuffer.put(this.data[i], 8);
      }
    };
    module.exports = ByteData;
  }
});

// node_modules/qrcode/lib/core/kanji-data.js
var require_kanji_data = __commonJS({
  "node_modules/qrcode/lib/core/kanji-data.js"(exports, module) {
    var Mode = require_mode();
    var Utils = require_utils();
    function KanjiData(data) {
      this.mode = Mode.KANJI;
      this.data = data;
    }
    KanjiData.getBitsLength = function getBitsLength(length) {
      return length * 13;
    };
    KanjiData.prototype.getLength = function getLength() {
      return this.data.length;
    };
    KanjiData.prototype.getBitsLength = function getBitsLength() {
      return KanjiData.getBitsLength(this.data.length);
    };
    KanjiData.prototype.write = function(bitBuffer) {
      let i;
      for (i = 0; i < this.data.length; i++) {
        let value = Utils.toSJIS(this.data[i]);
        if (value >= 33088 && value <= 40956) {
          value -= 33088;
        } else if (value >= 57408 && value <= 60351) {
          value -= 49472;
        } else {
          throw new Error(
            "Invalid SJIS character: " + this.data[i] + "\nMake sure your charset is UTF-8"
          );
        }
        value = (value >>> 8 & 255) * 192 + (value & 255);
        bitBuffer.put(value, 13);
      }
    };
    module.exports = KanjiData;
  }
});

// node_modules/dijkstrajs/dijkstra.js
var require_dijkstra = __commonJS({
  "node_modules/dijkstrajs/dijkstra.js"(exports, module) {
    "use strict";
    var dijkstra = {
      single_source_shortest_paths: function(graph, s, d) {
        var predecessors = {};
        var costs = {};
        costs[s] = 0;
        var open2 = dijkstra.PriorityQueue.make();
        open2.push(s, 0);
        var closest, u, v, cost_of_s_to_u, adjacent_nodes, cost_of_e, cost_of_s_to_u_plus_cost_of_e, cost_of_s_to_v, first_visit;
        while (!open2.empty()) {
          closest = open2.pop();
          u = closest.value;
          cost_of_s_to_u = closest.cost;
          adjacent_nodes = graph[u] || {};
          for (v in adjacent_nodes) {
            if (adjacent_nodes.hasOwnProperty(v)) {
              cost_of_e = adjacent_nodes[v];
              cost_of_s_to_u_plus_cost_of_e = cost_of_s_to_u + cost_of_e;
              cost_of_s_to_v = costs[v];
              first_visit = typeof costs[v] === "undefined";
              if (first_visit || cost_of_s_to_v > cost_of_s_to_u_plus_cost_of_e) {
                costs[v] = cost_of_s_to_u_plus_cost_of_e;
                open2.push(v, cost_of_s_to_u_plus_cost_of_e);
                predecessors[v] = u;
              }
            }
          }
        }
        if (typeof d !== "undefined" && typeof costs[d] === "undefined") {
          var msg = ["Could not find a path from ", s, " to ", d, "."].join("");
          throw new Error(msg);
        }
        return predecessors;
      },
      extract_shortest_path_from_predecessor_list: function(predecessors, d) {
        var nodes = [];
        var u = d;
        var predecessor;
        while (u) {
          nodes.push(u);
          predecessor = predecessors[u];
          u = predecessors[u];
        }
        nodes.reverse();
        return nodes;
      },
      find_path: function(graph, s, d) {
        var predecessors = dijkstra.single_source_shortest_paths(graph, s, d);
        return dijkstra.extract_shortest_path_from_predecessor_list(
          predecessors,
          d
        );
      },
      /**
       * A very naive priority queue implementation.
       */
      PriorityQueue: {
        make: function(opts) {
          var T = dijkstra.PriorityQueue, t = {}, key;
          opts = opts || {};
          for (key in T) {
            if (T.hasOwnProperty(key)) {
              t[key] = T[key];
            }
          }
          t.queue = [];
          t.sorter = opts.sorter || T.default_sorter;
          return t;
        },
        default_sorter: function(a, b) {
          return a.cost - b.cost;
        },
        /**
         * Add a new item to the queue and ensure the highest priority element
         * is at the front of the queue.
         */
        push: function(value, cost) {
          var item = { value, cost };
          this.queue.push(item);
          this.queue.sort(this.sorter);
        },
        /**
         * Return the highest priority element in the queue.
         */
        pop: function() {
          return this.queue.shift();
        },
        empty: function() {
          return this.queue.length === 0;
        }
      }
    };
    if (typeof module !== "undefined") {
      module.exports = dijkstra;
    }
  }
});

// node_modules/qrcode/lib/core/segments.js
var require_segments = __commonJS({
  "node_modules/qrcode/lib/core/segments.js"(exports) {
    var Mode = require_mode();
    var NumericData = require_numeric_data();
    var AlphanumericData = require_alphanumeric_data();
    var ByteData = require_byte_data();
    var KanjiData = require_kanji_data();
    var Regex = require_regex();
    var Utils = require_utils();
    var dijkstra = require_dijkstra();
    function getStringByteLength(str) {
      return unescape(encodeURIComponent(str)).length;
    }
    function getSegments(regex, mode, str) {
      const segments = [];
      let result;
      while ((result = regex.exec(str)) !== null) {
        segments.push({
          data: result[0],
          index: result.index,
          mode,
          length: result[0].length
        });
      }
      return segments;
    }
    function getSegmentsFromString(dataStr) {
      const numSegs = getSegments(Regex.NUMERIC, Mode.NUMERIC, dataStr);
      const alphaNumSegs = getSegments(Regex.ALPHANUMERIC, Mode.ALPHANUMERIC, dataStr);
      let byteSegs;
      let kanjiSegs;
      if (Utils.isKanjiModeEnabled()) {
        byteSegs = getSegments(Regex.BYTE, Mode.BYTE, dataStr);
        kanjiSegs = getSegments(Regex.KANJI, Mode.KANJI, dataStr);
      } else {
        byteSegs = getSegments(Regex.BYTE_KANJI, Mode.BYTE, dataStr);
        kanjiSegs = [];
      }
      const segs = numSegs.concat(alphaNumSegs, byteSegs, kanjiSegs);
      return segs.sort(function(s1, s2) {
        return s1.index - s2.index;
      }).map(function(obj) {
        return {
          data: obj.data,
          mode: obj.mode,
          length: obj.length
        };
      });
    }
    function getSegmentBitsLength(length, mode) {
      switch (mode) {
        case Mode.NUMERIC:
          return NumericData.getBitsLength(length);
        case Mode.ALPHANUMERIC:
          return AlphanumericData.getBitsLength(length);
        case Mode.KANJI:
          return KanjiData.getBitsLength(length);
        case Mode.BYTE:
          return ByteData.getBitsLength(length);
      }
    }
    function mergeSegments(segs) {
      return segs.reduce(function(acc, curr) {
        const prevSeg = acc.length - 1 >= 0 ? acc[acc.length - 1] : null;
        if (prevSeg && prevSeg.mode === curr.mode) {
          acc[acc.length - 1].data += curr.data;
          return acc;
        }
        acc.push(curr);
        return acc;
      }, []);
    }
    function buildNodes(segs) {
      const nodes = [];
      for (let i = 0; i < segs.length; i++) {
        const seg = segs[i];
        switch (seg.mode) {
          case Mode.NUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.ALPHANUMERIC, length: seg.length },
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.ALPHANUMERIC:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: seg.length }
            ]);
            break;
          case Mode.KANJI:
            nodes.push([
              seg,
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
            break;
          case Mode.BYTE:
            nodes.push([
              { data: seg.data, mode: Mode.BYTE, length: getStringByteLength(seg.data) }
            ]);
        }
      }
      return nodes;
    }
    function buildGraph(nodes, version) {
      const table = {};
      const graph = { start: {} };
      let prevNodeIds = ["start"];
      for (let i = 0; i < nodes.length; i++) {
        const nodeGroup = nodes[i];
        const currentNodeIds = [];
        for (let j = 0; j < nodeGroup.length; j++) {
          const node = nodeGroup[j];
          const key = "" + i + j;
          currentNodeIds.push(key);
          table[key] = { node, lastCount: 0 };
          graph[key] = {};
          for (let n = 0; n < prevNodeIds.length; n++) {
            const prevNodeId = prevNodeIds[n];
            if (table[prevNodeId] && table[prevNodeId].node.mode === node.mode) {
              graph[prevNodeId][key] = getSegmentBitsLength(table[prevNodeId].lastCount + node.length, node.mode) - getSegmentBitsLength(table[prevNodeId].lastCount, node.mode);
              table[prevNodeId].lastCount += node.length;
            } else {
              if (table[prevNodeId]) table[prevNodeId].lastCount = node.length;
              graph[prevNodeId][key] = getSegmentBitsLength(node.length, node.mode) + 4 + Mode.getCharCountIndicator(node.mode, version);
            }
          }
        }
        prevNodeIds = currentNodeIds;
      }
      for (let n = 0; n < prevNodeIds.length; n++) {
        graph[prevNodeIds[n]].end = 0;
      }
      return { map: graph, table };
    }
    function buildSingleSegment(data, modesHint) {
      let mode;
      const bestMode = Mode.getBestModeForData(data);
      mode = Mode.from(modesHint, bestMode);
      if (mode !== Mode.BYTE && mode.bit < bestMode.bit) {
        throw new Error('"' + data + '" cannot be encoded with mode ' + Mode.toString(mode) + ".\n Suggested mode is: " + Mode.toString(bestMode));
      }
      if (mode === Mode.KANJI && !Utils.isKanjiModeEnabled()) {
        mode = Mode.BYTE;
      }
      switch (mode) {
        case Mode.NUMERIC:
          return new NumericData(data);
        case Mode.ALPHANUMERIC:
          return new AlphanumericData(data);
        case Mode.KANJI:
          return new KanjiData(data);
        case Mode.BYTE:
          return new ByteData(data);
      }
    }
    exports.fromArray = function fromArray(array) {
      return array.reduce(function(acc, seg) {
        if (typeof seg === "string") {
          acc.push(buildSingleSegment(seg, null));
        } else if (seg.data) {
          acc.push(buildSingleSegment(seg.data, seg.mode));
        }
        return acc;
      }, []);
    };
    exports.fromString = function fromString(data, version) {
      const segs = getSegmentsFromString(data, Utils.isKanjiModeEnabled());
      const nodes = buildNodes(segs);
      const graph = buildGraph(nodes, version);
      const path = dijkstra.find_path(graph.map, "start", "end");
      const optimizedSegs = [];
      for (let i = 1; i < path.length - 1; i++) {
        optimizedSegs.push(graph.table[path[i]].node);
      }
      return exports.fromArray(mergeSegments(optimizedSegs));
    };
    exports.rawSplit = function rawSplit(data) {
      return exports.fromArray(
        getSegmentsFromString(data, Utils.isKanjiModeEnabled())
      );
    };
  }
});

// node_modules/qrcode/lib/core/qrcode.js
var require_qrcode = __commonJS({
  "node_modules/qrcode/lib/core/qrcode.js"(exports) {
    var Utils = require_utils();
    var ECLevel = require_error_correction_level();
    var BitBuffer = require_bit_buffer();
    var BitMatrix = require_bit_matrix();
    var AlignmentPattern = require_alignment_pattern();
    var FinderPattern = require_finder_pattern();
    var MaskPattern = require_mask_pattern();
    var ECCode = require_error_correction_code();
    var ReedSolomonEncoder = require_reed_solomon_encoder();
    var Version = require_version();
    var FormatInfo = require_format_info();
    var Mode = require_mode();
    var Segments = require_segments();
    function setupFinderPattern(matrix, version) {
      const size = matrix.size;
      const pos = FinderPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -1; r <= 7; r++) {
          if (row + r <= -1 || size <= row + r) continue;
          for (let c = -1; c <= 7; c++) {
            if (col + c <= -1 || size <= col + c) continue;
            if (r >= 0 && r <= 6 && (c === 0 || c === 6) || c >= 0 && c <= 6 && (r === 0 || r === 6) || r >= 2 && r <= 4 && c >= 2 && c <= 4) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    function setupTimingPattern(matrix) {
      const size = matrix.size;
      for (let r = 8; r < size - 8; r++) {
        const value = r % 2 === 0;
        matrix.set(r, 6, value, true);
        matrix.set(6, r, value, true);
      }
    }
    function setupAlignmentPattern(matrix, version) {
      const pos = AlignmentPattern.getPositions(version);
      for (let i = 0; i < pos.length; i++) {
        const row = pos[i][0];
        const col = pos[i][1];
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 2; c++) {
            if (r === -2 || r === 2 || c === -2 || c === 2 || r === 0 && c === 0) {
              matrix.set(row + r, col + c, true, true);
            } else {
              matrix.set(row + r, col + c, false, true);
            }
          }
        }
      }
    }
    function setupVersionInfo(matrix, version) {
      const size = matrix.size;
      const bits = Version.getEncodedBits(version);
      let row, col, mod;
      for (let i = 0; i < 18; i++) {
        row = Math.floor(i / 3);
        col = i % 3 + size - 8 - 3;
        mod = (bits >> i & 1) === 1;
        matrix.set(row, col, mod, true);
        matrix.set(col, row, mod, true);
      }
    }
    function setupFormatInfo(matrix, errorCorrectionLevel, maskPattern) {
      const size = matrix.size;
      const bits = FormatInfo.getEncodedBits(errorCorrectionLevel, maskPattern);
      let i, mod;
      for (i = 0; i < 15; i++) {
        mod = (bits >> i & 1) === 1;
        if (i < 6) {
          matrix.set(i, 8, mod, true);
        } else if (i < 8) {
          matrix.set(i + 1, 8, mod, true);
        } else {
          matrix.set(size - 15 + i, 8, mod, true);
        }
        if (i < 8) {
          matrix.set(8, size - i - 1, mod, true);
        } else if (i < 9) {
          matrix.set(8, 15 - i - 1 + 1, mod, true);
        } else {
          matrix.set(8, 15 - i - 1, mod, true);
        }
      }
      matrix.set(size - 8, 8, 1, true);
    }
    function setupData(matrix, data) {
      const size = matrix.size;
      let inc = -1;
      let row = size - 1;
      let bitIndex = 7;
      let byteIndex = 0;
      for (let col = size - 1; col > 0; col -= 2) {
        if (col === 6) col--;
        while (true) {
          for (let c = 0; c < 2; c++) {
            if (!matrix.isReserved(row, col - c)) {
              let dark = false;
              if (byteIndex < data.length) {
                dark = (data[byteIndex] >>> bitIndex & 1) === 1;
              }
              matrix.set(row, col - c, dark);
              bitIndex--;
              if (bitIndex === -1) {
                byteIndex++;
                bitIndex = 7;
              }
            }
          }
          row += inc;
          if (row < 0 || size <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    }
    function createData(version, errorCorrectionLevel, segments) {
      const buffer = new BitBuffer();
      segments.forEach(function(data) {
        buffer.put(data.mode.bit, 4);
        buffer.put(data.getLength(), Mode.getCharCountIndicator(data.mode, version));
        data.write(buffer);
      });
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewordsBits = (totalCodewords - ecTotalCodewords) * 8;
      if (buffer.getLengthInBits() + 4 <= dataTotalCodewordsBits) {
        buffer.put(0, 4);
      }
      while (buffer.getLengthInBits() % 8 !== 0) {
        buffer.putBit(0);
      }
      const remainingByte = (dataTotalCodewordsBits - buffer.getLengthInBits()) / 8;
      for (let i = 0; i < remainingByte; i++) {
        buffer.put(i % 2 ? 17 : 236, 8);
      }
      return createCodewords(buffer, version, errorCorrectionLevel);
    }
    function createCodewords(bitBuffer, version, errorCorrectionLevel) {
      const totalCodewords = Utils.getSymbolTotalCodewords(version);
      const ecTotalCodewords = ECCode.getTotalCodewordsCount(version, errorCorrectionLevel);
      const dataTotalCodewords = totalCodewords - ecTotalCodewords;
      const ecTotalBlocks = ECCode.getBlocksCount(version, errorCorrectionLevel);
      const blocksInGroup2 = totalCodewords % ecTotalBlocks;
      const blocksInGroup1 = ecTotalBlocks - blocksInGroup2;
      const totalCodewordsInGroup1 = Math.floor(totalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup1 = Math.floor(dataTotalCodewords / ecTotalBlocks);
      const dataCodewordsInGroup2 = dataCodewordsInGroup1 + 1;
      const ecCount = totalCodewordsInGroup1 - dataCodewordsInGroup1;
      const rs = new ReedSolomonEncoder(ecCount);
      let offset = 0;
      const dcData = new Array(ecTotalBlocks);
      const ecData = new Array(ecTotalBlocks);
      let maxDataSize = 0;
      const buffer = new Uint8Array(bitBuffer.buffer);
      for (let b = 0; b < ecTotalBlocks; b++) {
        const dataSize = b < blocksInGroup1 ? dataCodewordsInGroup1 : dataCodewordsInGroup2;
        dcData[b] = buffer.slice(offset, offset + dataSize);
        ecData[b] = rs.encode(dcData[b]);
        offset += dataSize;
        maxDataSize = Math.max(maxDataSize, dataSize);
      }
      const data = new Uint8Array(totalCodewords);
      let index = 0;
      let i, r;
      for (i = 0; i < maxDataSize; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          if (i < dcData[r].length) {
            data[index++] = dcData[r][i];
          }
        }
      }
      for (i = 0; i < ecCount; i++) {
        for (r = 0; r < ecTotalBlocks; r++) {
          data[index++] = ecData[r][i];
        }
      }
      return data;
    }
    function createSymbol(data, version, errorCorrectionLevel, maskPattern) {
      let segments;
      if (Array.isArray(data)) {
        segments = Segments.fromArray(data);
      } else if (typeof data === "string") {
        let estimatedVersion = version;
        if (!estimatedVersion) {
          const rawSegments = Segments.rawSplit(data);
          estimatedVersion = Version.getBestVersionForData(rawSegments, errorCorrectionLevel);
        }
        segments = Segments.fromString(data, estimatedVersion || 40);
      } else {
        throw new Error("Invalid data");
      }
      const bestVersion = Version.getBestVersionForData(segments, errorCorrectionLevel);
      if (!bestVersion) {
        throw new Error("The amount of data is too big to be stored in a QR Code");
      }
      if (!version) {
        version = bestVersion;
      } else if (version < bestVersion) {
        throw new Error(
          "\nThe chosen QR Code version cannot contain this amount of data.\nMinimum version required to store current data is: " + bestVersion + ".\n"
        );
      }
      const dataBits = createData(version, errorCorrectionLevel, segments);
      const moduleCount = Utils.getSymbolSize(version);
      const modules = new BitMatrix(moduleCount);
      setupFinderPattern(modules, version);
      setupTimingPattern(modules);
      setupAlignmentPattern(modules, version);
      setupFormatInfo(modules, errorCorrectionLevel, 0);
      if (version >= 7) {
        setupVersionInfo(modules, version);
      }
      setupData(modules, dataBits);
      if (isNaN(maskPattern)) {
        maskPattern = MaskPattern.getBestMask(
          modules,
          setupFormatInfo.bind(null, modules, errorCorrectionLevel)
        );
      }
      MaskPattern.applyMask(maskPattern, modules);
      setupFormatInfo(modules, errorCorrectionLevel, maskPattern);
      return {
        modules,
        version,
        errorCorrectionLevel,
        maskPattern,
        segments
      };
    }
    exports.create = function create(data, options) {
      if (typeof data === "undefined" || data === "") {
        throw new Error("No input text");
      }
      let errorCorrectionLevel = ECLevel.M;
      let version;
      let mask;
      if (typeof options !== "undefined") {
        errorCorrectionLevel = ECLevel.from(options.errorCorrectionLevel, ECLevel.M);
        version = Version.from(options.version);
        mask = MaskPattern.from(options.maskPattern);
        if (options.toSJISFunc) {
          Utils.setToSJISFunction(options.toSJISFunc);
        }
      }
      return createSymbol(data, version, errorCorrectionLevel, mask);
    };
  }
});

// node_modules/pngjs/lib/chunkstream.js
var require_chunkstream = __commonJS({
  "node_modules/pngjs/lib/chunkstream.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var Stream = __require("stream");
    var ChunkStream = module.exports = function() {
      Stream.call(this);
      this._buffers = [];
      this._buffered = 0;
      this._reads = [];
      this._paused = false;
      this._encoding = "utf8";
      this.writable = true;
    };
    util.inherits(ChunkStream, Stream);
    ChunkStream.prototype.read = function(length, callback) {
      this._reads.push({
        length: Math.abs(length),
        // if length < 0 then at most this length
        allowLess: length < 0,
        func: callback
      });
      process.nextTick(
        function() {
          this._process();
          if (this._paused && this._reads && this._reads.length > 0) {
            this._paused = false;
            this.emit("drain");
          }
        }.bind(this)
      );
    };
    ChunkStream.prototype.write = function(data, encoding) {
      if (!this.writable) {
        this.emit("error", new Error("Stream not writable"));
        return false;
      }
      let dataBuffer;
      if (Buffer.isBuffer(data)) {
        dataBuffer = data;
      } else {
        dataBuffer = Buffer.from(data, encoding || this._encoding);
      }
      this._buffers.push(dataBuffer);
      this._buffered += dataBuffer.length;
      this._process();
      if (this._reads && this._reads.length === 0) {
        this._paused = true;
      }
      return this.writable && !this._paused;
    };
    ChunkStream.prototype.end = function(data, encoding) {
      if (data) {
        this.write(data, encoding);
      }
      this.writable = false;
      if (!this._buffers) {
        return;
      }
      if (this._buffers.length === 0) {
        this._end();
      } else {
        this._buffers.push(null);
        this._process();
      }
    };
    ChunkStream.prototype.destroySoon = ChunkStream.prototype.end;
    ChunkStream.prototype._end = function() {
      if (this._reads.length > 0) {
        this.emit("error", new Error("Unexpected end of input"));
      }
      this.destroy();
    };
    ChunkStream.prototype.destroy = function() {
      if (!this._buffers) {
        return;
      }
      this.writable = false;
      this._reads = null;
      this._buffers = null;
      this.emit("close");
    };
    ChunkStream.prototype._processReadAllowingLess = function(read) {
      this._reads.shift();
      let smallerBuf = this._buffers[0];
      if (smallerBuf.length > read.length) {
        this._buffered -= read.length;
        this._buffers[0] = smallerBuf.slice(read.length);
        read.func.call(this, smallerBuf.slice(0, read.length));
      } else {
        this._buffered -= smallerBuf.length;
        this._buffers.shift();
        read.func.call(this, smallerBuf);
      }
    };
    ChunkStream.prototype._processRead = function(read) {
      this._reads.shift();
      let pos = 0;
      let count = 0;
      let data = Buffer.alloc(read.length);
      while (pos < read.length) {
        let buf = this._buffers[count++];
        let len = Math.min(buf.length, read.length - pos);
        buf.copy(data, pos, 0, len);
        pos += len;
        if (len !== buf.length) {
          this._buffers[--count] = buf.slice(len);
        }
      }
      if (count > 0) {
        this._buffers.splice(0, count);
      }
      this._buffered -= read.length;
      read.func.call(this, data);
    };
    ChunkStream.prototype._process = function() {
      try {
        while (this._buffered > 0 && this._reads && this._reads.length > 0) {
          let read = this._reads[0];
          if (read.allowLess) {
            this._processReadAllowingLess(read);
          } else if (this._buffered >= read.length) {
            this._processRead(read);
          } else {
            break;
          }
        }
        if (this._buffers && !this.writable) {
          this._end();
        }
      } catch (ex) {
        this.emit("error", ex);
      }
    };
  }
});

// node_modules/pngjs/lib/interlace.js
var require_interlace = __commonJS({
  "node_modules/pngjs/lib/interlace.js"(exports) {
    "use strict";
    var imagePasses = [
      {
        // pass 1 - 1px
        x: [0],
        y: [0]
      },
      {
        // pass 2 - 1px
        x: [4],
        y: [0]
      },
      {
        // pass 3 - 2px
        x: [0, 4],
        y: [4]
      },
      {
        // pass 4 - 4px
        x: [2, 6],
        y: [0, 4]
      },
      {
        // pass 5 - 8px
        x: [0, 2, 4, 6],
        y: [2, 6]
      },
      {
        // pass 6 - 16px
        x: [1, 3, 5, 7],
        y: [0, 2, 4, 6]
      },
      {
        // pass 7 - 32px
        x: [0, 1, 2, 3, 4, 5, 6, 7],
        y: [1, 3, 5, 7]
      }
    ];
    exports.getImagePasses = function(width2, height) {
      let images = [];
      let xLeftOver = width2 % 8;
      let yLeftOver = height % 8;
      let xRepeats = (width2 - xLeftOver) / 8;
      let yRepeats = (height - yLeftOver) / 8;
      for (let i = 0; i < imagePasses.length; i++) {
        let pass = imagePasses[i];
        let passWidth = xRepeats * pass.x.length;
        let passHeight = yRepeats * pass.y.length;
        for (let j = 0; j < pass.x.length; j++) {
          if (pass.x[j] < xLeftOver) {
            passWidth++;
          } else {
            break;
          }
        }
        for (let j = 0; j < pass.y.length; j++) {
          if (pass.y[j] < yLeftOver) {
            passHeight++;
          } else {
            break;
          }
        }
        if (passWidth > 0 && passHeight > 0) {
          images.push({ width: passWidth, height: passHeight, index: i });
        }
      }
      return images;
    };
    exports.getInterlaceIterator = function(width2) {
      return function(x, y, pass) {
        let outerXLeftOver = x % imagePasses[pass].x.length;
        let outerX = (x - outerXLeftOver) / imagePasses[pass].x.length * 8 + imagePasses[pass].x[outerXLeftOver];
        let outerYLeftOver = y % imagePasses[pass].y.length;
        let outerY = (y - outerYLeftOver) / imagePasses[pass].y.length * 8 + imagePasses[pass].y[outerYLeftOver];
        return outerX * 4 + outerY * width2 * 4;
      };
    };
  }
});

// node_modules/pngjs/lib/paeth-predictor.js
var require_paeth_predictor = __commonJS({
  "node_modules/pngjs/lib/paeth-predictor.js"(exports, module) {
    "use strict";
    module.exports = function paethPredictor(left, above, upLeft) {
      let paeth = left + above - upLeft;
      let pLeft = Math.abs(paeth - left);
      let pAbove = Math.abs(paeth - above);
      let pUpLeft = Math.abs(paeth - upLeft);
      if (pLeft <= pAbove && pLeft <= pUpLeft) {
        return left;
      }
      if (pAbove <= pUpLeft) {
        return above;
      }
      return upLeft;
    };
  }
});

// node_modules/pngjs/lib/filter-parse.js
var require_filter_parse = __commonJS({
  "node_modules/pngjs/lib/filter-parse.js"(exports, module) {
    "use strict";
    var interlaceUtils = require_interlace();
    var paethPredictor = require_paeth_predictor();
    function getByteWidth(width2, bpp, depth) {
      let byteWidth = width2 * bpp;
      if (depth !== 8) {
        byteWidth = Math.ceil(byteWidth / (8 / depth));
      }
      return byteWidth;
    }
    var Filter = module.exports = function(bitmapInfo, dependencies) {
      let width2 = bitmapInfo.width;
      let height = bitmapInfo.height;
      let interlace = bitmapInfo.interlace;
      let bpp = bitmapInfo.bpp;
      let depth = bitmapInfo.depth;
      this.read = dependencies.read;
      this.write = dependencies.write;
      this.complete = dependencies.complete;
      this._imageIndex = 0;
      this._images = [];
      if (interlace) {
        let passes = interlaceUtils.getImagePasses(width2, height);
        for (let i = 0; i < passes.length; i++) {
          this._images.push({
            byteWidth: getByteWidth(passes[i].width, bpp, depth),
            height: passes[i].height,
            lineIndex: 0
          });
        }
      } else {
        this._images.push({
          byteWidth: getByteWidth(width2, bpp, depth),
          height,
          lineIndex: 0
        });
      }
      if (depth === 8) {
        this._xComparison = bpp;
      } else if (depth === 16) {
        this._xComparison = bpp * 2;
      } else {
        this._xComparison = 1;
      }
    };
    Filter.prototype.start = function() {
      this.read(
        this._images[this._imageIndex].byteWidth + 1,
        this._reverseFilterLine.bind(this)
      );
    };
    Filter.prototype._unFilterType1 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f1Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        unfilteredLine[x] = rawByte + f1Left;
      }
    };
    Filter.prototype._unFilterType2 = function(rawData, unfilteredLine, byteWidth) {
      let lastLine = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f2Up = lastLine ? lastLine[x] : 0;
        unfilteredLine[x] = rawByte + f2Up;
      }
    };
    Filter.prototype._unFilterType3 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      let lastLine = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f3Up = lastLine ? lastLine[x] : 0;
        let f3Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        let f3Add = Math.floor((f3Left + f3Up) / 2);
        unfilteredLine[x] = rawByte + f3Add;
      }
    };
    Filter.prototype._unFilterType4 = function(rawData, unfilteredLine, byteWidth) {
      let xComparison = this._xComparison;
      let xBiggerThan = xComparison - 1;
      let lastLine = this._lastLine;
      for (let x = 0; x < byteWidth; x++) {
        let rawByte = rawData[1 + x];
        let f4Up = lastLine ? lastLine[x] : 0;
        let f4Left = x > xBiggerThan ? unfilteredLine[x - xComparison] : 0;
        let f4UpLeft = x > xBiggerThan && lastLine ? lastLine[x - xComparison] : 0;
        let f4Add = paethPredictor(f4Left, f4Up, f4UpLeft);
        unfilteredLine[x] = rawByte + f4Add;
      }
    };
    Filter.prototype._reverseFilterLine = function(rawData) {
      let filter = rawData[0];
      let unfilteredLine;
      let currentImage = this._images[this._imageIndex];
      let byteWidth = currentImage.byteWidth;
      if (filter === 0) {
        unfilteredLine = rawData.slice(1, byteWidth + 1);
      } else {
        unfilteredLine = Buffer.alloc(byteWidth);
        switch (filter) {
          case 1:
            this._unFilterType1(rawData, unfilteredLine, byteWidth);
            break;
          case 2:
            this._unFilterType2(rawData, unfilteredLine, byteWidth);
            break;
          case 3:
            this._unFilterType3(rawData, unfilteredLine, byteWidth);
            break;
          case 4:
            this._unFilterType4(rawData, unfilteredLine, byteWidth);
            break;
          default:
            throw new Error("Unrecognised filter type - " + filter);
        }
      }
      this.write(unfilteredLine);
      currentImage.lineIndex++;
      if (currentImage.lineIndex >= currentImage.height) {
        this._lastLine = null;
        this._imageIndex++;
        currentImage = this._images[this._imageIndex];
      } else {
        this._lastLine = unfilteredLine;
      }
      if (currentImage) {
        this.read(currentImage.byteWidth + 1, this._reverseFilterLine.bind(this));
      } else {
        this._lastLine = null;
        this.complete();
      }
    };
  }
});

// node_modules/pngjs/lib/filter-parse-async.js
var require_filter_parse_async = __commonJS({
  "node_modules/pngjs/lib/filter-parse-async.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var ChunkStream = require_chunkstream();
    var Filter = require_filter_parse();
    var FilterAsync = module.exports = function(bitmapInfo) {
      ChunkStream.call(this);
      let buffers = [];
      let that = this;
      this._filter = new Filter(bitmapInfo, {
        read: this.read.bind(this),
        write: function(buffer) {
          buffers.push(buffer);
        },
        complete: function() {
          that.emit("complete", Buffer.concat(buffers));
        }
      });
      this._filter.start();
    };
    util.inherits(FilterAsync, ChunkStream);
  }
});

// node_modules/pngjs/lib/constants.js
var require_constants = __commonJS({
  "node_modules/pngjs/lib/constants.js"(exports, module) {
    "use strict";
    module.exports = {
      PNG_SIGNATURE: [137, 80, 78, 71, 13, 10, 26, 10],
      TYPE_IHDR: 1229472850,
      TYPE_IEND: 1229278788,
      TYPE_IDAT: 1229209940,
      TYPE_PLTE: 1347179589,
      TYPE_tRNS: 1951551059,
      // eslint-disable-line camelcase
      TYPE_gAMA: 1732332865,
      // eslint-disable-line camelcase
      // color-type bits
      COLORTYPE_GRAYSCALE: 0,
      COLORTYPE_PALETTE: 1,
      COLORTYPE_COLOR: 2,
      COLORTYPE_ALPHA: 4,
      // e.g. grayscale and alpha
      // color-type combinations
      COLORTYPE_PALETTE_COLOR: 3,
      COLORTYPE_COLOR_ALPHA: 6,
      COLORTYPE_TO_BPP_MAP: {
        0: 1,
        2: 3,
        3: 1,
        4: 2,
        6: 4
      },
      GAMMA_DIVISION: 1e5
    };
  }
});

// node_modules/pngjs/lib/crc.js
var require_crc = __commonJS({
  "node_modules/pngjs/lib/crc.js"(exports, module) {
    "use strict";
    var crcTable = [];
    (function() {
      for (let i = 0; i < 256; i++) {
        let currentCrc = i;
        for (let j = 0; j < 8; j++) {
          if (currentCrc & 1) {
            currentCrc = 3988292384 ^ currentCrc >>> 1;
          } else {
            currentCrc = currentCrc >>> 1;
          }
        }
        crcTable[i] = currentCrc;
      }
    })();
    var CrcCalculator = module.exports = function() {
      this._crc = -1;
    };
    CrcCalculator.prototype.write = function(data) {
      for (let i = 0; i < data.length; i++) {
        this._crc = crcTable[(this._crc ^ data[i]) & 255] ^ this._crc >>> 8;
      }
      return true;
    };
    CrcCalculator.prototype.crc32 = function() {
      return this._crc ^ -1;
    };
    CrcCalculator.crc32 = function(buf) {
      let crc = -1;
      for (let i = 0; i < buf.length; i++) {
        crc = crcTable[(crc ^ buf[i]) & 255] ^ crc >>> 8;
      }
      return crc ^ -1;
    };
  }
});

// node_modules/pngjs/lib/parser.js
var require_parser = __commonJS({
  "node_modules/pngjs/lib/parser.js"(exports, module) {
    "use strict";
    var constants = require_constants();
    var CrcCalculator = require_crc();
    var Parser = module.exports = function(options, dependencies) {
      this._options = options;
      options.checkCRC = options.checkCRC !== false;
      this._hasIHDR = false;
      this._hasIEND = false;
      this._emittedHeadersFinished = false;
      this._palette = [];
      this._colorType = 0;
      this._chunks = {};
      this._chunks[constants.TYPE_IHDR] = this._handleIHDR.bind(this);
      this._chunks[constants.TYPE_IEND] = this._handleIEND.bind(this);
      this._chunks[constants.TYPE_IDAT] = this._handleIDAT.bind(this);
      this._chunks[constants.TYPE_PLTE] = this._handlePLTE.bind(this);
      this._chunks[constants.TYPE_tRNS] = this._handleTRNS.bind(this);
      this._chunks[constants.TYPE_gAMA] = this._handleGAMA.bind(this);
      this.read = dependencies.read;
      this.error = dependencies.error;
      this.metadata = dependencies.metadata;
      this.gamma = dependencies.gamma;
      this.transColor = dependencies.transColor;
      this.palette = dependencies.palette;
      this.parsed = dependencies.parsed;
      this.inflateData = dependencies.inflateData;
      this.finished = dependencies.finished;
      this.simpleTransparency = dependencies.simpleTransparency;
      this.headersFinished = dependencies.headersFinished || function() {
      };
    };
    Parser.prototype.start = function() {
      this.read(constants.PNG_SIGNATURE.length, this._parseSignature.bind(this));
    };
    Parser.prototype._parseSignature = function(data) {
      let signature = constants.PNG_SIGNATURE;
      for (let i = 0; i < signature.length; i++) {
        if (data[i] !== signature[i]) {
          this.error(new Error("Invalid file signature"));
          return;
        }
      }
      this.read(8, this._parseChunkBegin.bind(this));
    };
    Parser.prototype._parseChunkBegin = function(data) {
      let length = data.readUInt32BE(0);
      let type = data.readUInt32BE(4);
      let name = "";
      for (let i = 4; i < 8; i++) {
        name += String.fromCharCode(data[i]);
      }
      let ancillary = Boolean(data[4] & 32);
      if (!this._hasIHDR && type !== constants.TYPE_IHDR) {
        this.error(new Error("Expected IHDR on beggining"));
        return;
      }
      this._crc = new CrcCalculator();
      this._crc.write(Buffer.from(name));
      if (this._chunks[type]) {
        return this._chunks[type](length);
      }
      if (!ancillary) {
        this.error(new Error("Unsupported critical chunk type " + name));
        return;
      }
      this.read(length + 4, this._skipChunk.bind(this));
    };
    Parser.prototype._skipChunk = function() {
      this.read(8, this._parseChunkBegin.bind(this));
    };
    Parser.prototype._handleChunkEnd = function() {
      this.read(4, this._parseChunkEnd.bind(this));
    };
    Parser.prototype._parseChunkEnd = function(data) {
      let fileCrc = data.readInt32BE(0);
      let calcCrc = this._crc.crc32();
      if (this._options.checkCRC && calcCrc !== fileCrc) {
        this.error(new Error("Crc error - " + fileCrc + " - " + calcCrc));
        return;
      }
      if (!this._hasIEND) {
        this.read(8, this._parseChunkBegin.bind(this));
      }
    };
    Parser.prototype._handleIHDR = function(length) {
      this.read(length, this._parseIHDR.bind(this));
    };
    Parser.prototype._parseIHDR = function(data) {
      this._crc.write(data);
      let width2 = data.readUInt32BE(0);
      let height = data.readUInt32BE(4);
      let depth = data[8];
      let colorType = data[9];
      let compr = data[10];
      let filter = data[11];
      let interlace = data[12];
      if (depth !== 8 && depth !== 4 && depth !== 2 && depth !== 1 && depth !== 16) {
        this.error(new Error("Unsupported bit depth " + depth));
        return;
      }
      if (!(colorType in constants.COLORTYPE_TO_BPP_MAP)) {
        this.error(new Error("Unsupported color type"));
        return;
      }
      if (compr !== 0) {
        this.error(new Error("Unsupported compression method"));
        return;
      }
      if (filter !== 0) {
        this.error(new Error("Unsupported filter method"));
        return;
      }
      if (interlace !== 0 && interlace !== 1) {
        this.error(new Error("Unsupported interlace method"));
        return;
      }
      this._colorType = colorType;
      let bpp = constants.COLORTYPE_TO_BPP_MAP[this._colorType];
      this._hasIHDR = true;
      this.metadata({
        width: width2,
        height,
        depth,
        interlace: Boolean(interlace),
        palette: Boolean(colorType & constants.COLORTYPE_PALETTE),
        color: Boolean(colorType & constants.COLORTYPE_COLOR),
        alpha: Boolean(colorType & constants.COLORTYPE_ALPHA),
        bpp,
        colorType
      });
      this._handleChunkEnd();
    };
    Parser.prototype._handlePLTE = function(length) {
      this.read(length, this._parsePLTE.bind(this));
    };
    Parser.prototype._parsePLTE = function(data) {
      this._crc.write(data);
      let entries = Math.floor(data.length / 3);
      for (let i = 0; i < entries; i++) {
        this._palette.push([data[i * 3], data[i * 3 + 1], data[i * 3 + 2], 255]);
      }
      this.palette(this._palette);
      this._handleChunkEnd();
    };
    Parser.prototype._handleTRNS = function(length) {
      this.simpleTransparency();
      this.read(length, this._parseTRNS.bind(this));
    };
    Parser.prototype._parseTRNS = function(data) {
      this._crc.write(data);
      if (this._colorType === constants.COLORTYPE_PALETTE_COLOR) {
        if (this._palette.length === 0) {
          this.error(new Error("Transparency chunk must be after palette"));
          return;
        }
        if (data.length > this._palette.length) {
          this.error(new Error("More transparent colors than palette size"));
          return;
        }
        for (let i = 0; i < data.length; i++) {
          this._palette[i][3] = data[i];
        }
        this.palette(this._palette);
      }
      if (this._colorType === constants.COLORTYPE_GRAYSCALE) {
        this.transColor([data.readUInt16BE(0)]);
      }
      if (this._colorType === constants.COLORTYPE_COLOR) {
        this.transColor([
          data.readUInt16BE(0),
          data.readUInt16BE(2),
          data.readUInt16BE(4)
        ]);
      }
      this._handleChunkEnd();
    };
    Parser.prototype._handleGAMA = function(length) {
      this.read(length, this._parseGAMA.bind(this));
    };
    Parser.prototype._parseGAMA = function(data) {
      this._crc.write(data);
      this.gamma(data.readUInt32BE(0) / constants.GAMMA_DIVISION);
      this._handleChunkEnd();
    };
    Parser.prototype._handleIDAT = function(length) {
      if (!this._emittedHeadersFinished) {
        this._emittedHeadersFinished = true;
        this.headersFinished();
      }
      this.read(-length, this._parseIDAT.bind(this, length));
    };
    Parser.prototype._parseIDAT = function(length, data) {
      this._crc.write(data);
      if (this._colorType === constants.COLORTYPE_PALETTE_COLOR && this._palette.length === 0) {
        throw new Error("Expected palette not found");
      }
      this.inflateData(data);
      let leftOverLength = length - data.length;
      if (leftOverLength > 0) {
        this._handleIDAT(leftOverLength);
      } else {
        this._handleChunkEnd();
      }
    };
    Parser.prototype._handleIEND = function(length) {
      this.read(length, this._parseIEND.bind(this));
    };
    Parser.prototype._parseIEND = function(data) {
      this._crc.write(data);
      this._hasIEND = true;
      this._handleChunkEnd();
      if (this.finished) {
        this.finished();
      }
    };
  }
});

// node_modules/pngjs/lib/bitmapper.js
var require_bitmapper = __commonJS({
  "node_modules/pngjs/lib/bitmapper.js"(exports) {
    "use strict";
    var interlaceUtils = require_interlace();
    var pixelBppMapper = [
      // 0 - dummy entry
      function() {
      },
      // 1 - L
      // 0: 0, 1: 0, 2: 0, 3: 0xff
      function(pxData, data, pxPos, rawPos) {
        if (rawPos === data.length) {
          throw new Error("Ran out of data");
        }
        let pixel = data[rawPos];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = 255;
      },
      // 2 - LA
      // 0: 0, 1: 0, 2: 0, 3: 1
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 1 >= data.length) {
          throw new Error("Ran out of data");
        }
        let pixel = data[rawPos];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = data[rawPos + 1];
      },
      // 3 - RGB
      // 0: 0, 1: 1, 2: 2, 3: 0xff
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 2 >= data.length) {
          throw new Error("Ran out of data");
        }
        pxData[pxPos] = data[rawPos];
        pxData[pxPos + 1] = data[rawPos + 1];
        pxData[pxPos + 2] = data[rawPos + 2];
        pxData[pxPos + 3] = 255;
      },
      // 4 - RGBA
      // 0: 0, 1: 1, 2: 2, 3: 3
      function(pxData, data, pxPos, rawPos) {
        if (rawPos + 3 >= data.length) {
          throw new Error("Ran out of data");
        }
        pxData[pxPos] = data[rawPos];
        pxData[pxPos + 1] = data[rawPos + 1];
        pxData[pxPos + 2] = data[rawPos + 2];
        pxData[pxPos + 3] = data[rawPos + 3];
      }
    ];
    var pixelBppCustomMapper = [
      // 0 - dummy entry
      function() {
      },
      // 1 - L
      // 0: 0, 1: 0, 2: 0, 3: 0xff
      function(pxData, pixelData, pxPos, maxBit) {
        let pixel = pixelData[0];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = maxBit;
      },
      // 2 - LA
      // 0: 0, 1: 0, 2: 0, 3: 1
      function(pxData, pixelData, pxPos) {
        let pixel = pixelData[0];
        pxData[pxPos] = pixel;
        pxData[pxPos + 1] = pixel;
        pxData[pxPos + 2] = pixel;
        pxData[pxPos + 3] = pixelData[1];
      },
      // 3 - RGB
      // 0: 0, 1: 1, 2: 2, 3: 0xff
      function(pxData, pixelData, pxPos, maxBit) {
        pxData[pxPos] = pixelData[0];
        pxData[pxPos + 1] = pixelData[1];
        pxData[pxPos + 2] = pixelData[2];
        pxData[pxPos + 3] = maxBit;
      },
      // 4 - RGBA
      // 0: 0, 1: 1, 2: 2, 3: 3
      function(pxData, pixelData, pxPos) {
        pxData[pxPos] = pixelData[0];
        pxData[pxPos + 1] = pixelData[1];
        pxData[pxPos + 2] = pixelData[2];
        pxData[pxPos + 3] = pixelData[3];
      }
    ];
    function bitRetriever(data, depth) {
      let leftOver = [];
      let i = 0;
      function split() {
        if (i === data.length) {
          throw new Error("Ran out of data");
        }
        let byte = data[i];
        i++;
        let byte8, byte7, byte6, byte5, byte4, byte3, byte2, byte1;
        switch (depth) {
          default:
            throw new Error("unrecognised depth");
          case 16:
            byte2 = data[i];
            i++;
            leftOver.push((byte << 8) + byte2);
            break;
          case 4:
            byte2 = byte & 15;
            byte1 = byte >> 4;
            leftOver.push(byte1, byte2);
            break;
          case 2:
            byte4 = byte & 3;
            byte3 = byte >> 2 & 3;
            byte2 = byte >> 4 & 3;
            byte1 = byte >> 6 & 3;
            leftOver.push(byte1, byte2, byte3, byte4);
            break;
          case 1:
            byte8 = byte & 1;
            byte7 = byte >> 1 & 1;
            byte6 = byte >> 2 & 1;
            byte5 = byte >> 3 & 1;
            byte4 = byte >> 4 & 1;
            byte3 = byte >> 5 & 1;
            byte2 = byte >> 6 & 1;
            byte1 = byte >> 7 & 1;
            leftOver.push(byte1, byte2, byte3, byte4, byte5, byte6, byte7, byte8);
            break;
        }
      }
      return {
        get: function(count) {
          while (leftOver.length < count) {
            split();
          }
          let returner = leftOver.slice(0, count);
          leftOver = leftOver.slice(count);
          return returner;
        },
        resetAfterLine: function() {
          leftOver.length = 0;
        },
        end: function() {
          if (i !== data.length) {
            throw new Error("extra data found");
          }
        }
      };
    }
    function mapImage8Bit(image, pxData, getPxPos, bpp, data, rawPos) {
      let imageWidth = image.width;
      let imageHeight = image.height;
      let imagePass = image.index;
      for (let y = 0; y < imageHeight; y++) {
        for (let x = 0; x < imageWidth; x++) {
          let pxPos = getPxPos(x, y, imagePass);
          pixelBppMapper[bpp](pxData, data, pxPos, rawPos);
          rawPos += bpp;
        }
      }
      return rawPos;
    }
    function mapImageCustomBit(image, pxData, getPxPos, bpp, bits, maxBit) {
      let imageWidth = image.width;
      let imageHeight = image.height;
      let imagePass = image.index;
      for (let y = 0; y < imageHeight; y++) {
        for (let x = 0; x < imageWidth; x++) {
          let pixelData = bits.get(bpp);
          let pxPos = getPxPos(x, y, imagePass);
          pixelBppCustomMapper[bpp](pxData, pixelData, pxPos, maxBit);
        }
        bits.resetAfterLine();
      }
    }
    exports.dataToBitMap = function(data, bitmapInfo) {
      let width2 = bitmapInfo.width;
      let height = bitmapInfo.height;
      let depth = bitmapInfo.depth;
      let bpp = bitmapInfo.bpp;
      let interlace = bitmapInfo.interlace;
      let bits;
      if (depth !== 8) {
        bits = bitRetriever(data, depth);
      }
      let pxData;
      if (depth <= 8) {
        pxData = Buffer.alloc(width2 * height * 4);
      } else {
        pxData = new Uint16Array(width2 * height * 4);
      }
      let maxBit = Math.pow(2, depth) - 1;
      let rawPos = 0;
      let images;
      let getPxPos;
      if (interlace) {
        images = interlaceUtils.getImagePasses(width2, height);
        getPxPos = interlaceUtils.getInterlaceIterator(width2, height);
      } else {
        let nonInterlacedPxPos = 0;
        getPxPos = function() {
          let returner = nonInterlacedPxPos;
          nonInterlacedPxPos += 4;
          return returner;
        };
        images = [{ width: width2, height }];
      }
      for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
        if (depth === 8) {
          rawPos = mapImage8Bit(
            images[imageIndex],
            pxData,
            getPxPos,
            bpp,
            data,
            rawPos
          );
        } else {
          mapImageCustomBit(
            images[imageIndex],
            pxData,
            getPxPos,
            bpp,
            bits,
            maxBit
          );
        }
      }
      if (depth === 8) {
        if (rawPos !== data.length) {
          throw new Error("extra data found");
        }
      } else {
        bits.end();
      }
      return pxData;
    };
  }
});

// node_modules/pngjs/lib/format-normaliser.js
var require_format_normaliser = __commonJS({
  "node_modules/pngjs/lib/format-normaliser.js"(exports, module) {
    "use strict";
    function dePalette(indata, outdata, width2, height, palette) {
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width2; x++) {
          let color = palette[indata[pxPos]];
          if (!color) {
            throw new Error("index " + indata[pxPos] + " not in palette");
          }
          for (let i = 0; i < 4; i++) {
            outdata[pxPos + i] = color[i];
          }
          pxPos += 4;
        }
      }
    }
    function replaceTransparentColor(indata, outdata, width2, height, transColor) {
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width2; x++) {
          let makeTrans = false;
          if (transColor.length === 1) {
            if (transColor[0] === indata[pxPos]) {
              makeTrans = true;
            }
          } else if (transColor[0] === indata[pxPos] && transColor[1] === indata[pxPos + 1] && transColor[2] === indata[pxPos + 2]) {
            makeTrans = true;
          }
          if (makeTrans) {
            for (let i = 0; i < 4; i++) {
              outdata[pxPos + i] = 0;
            }
          }
          pxPos += 4;
        }
      }
    }
    function scaleDepth(indata, outdata, width2, height, depth) {
      let maxOutSample = 255;
      let maxInSample = Math.pow(2, depth) - 1;
      let pxPos = 0;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width2; x++) {
          for (let i = 0; i < 4; i++) {
            outdata[pxPos + i] = Math.floor(
              indata[pxPos + i] * maxOutSample / maxInSample + 0.5
            );
          }
          pxPos += 4;
        }
      }
    }
    module.exports = function(indata, imageData) {
      let depth = imageData.depth;
      let width2 = imageData.width;
      let height = imageData.height;
      let colorType = imageData.colorType;
      let transColor = imageData.transColor;
      let palette = imageData.palette;
      let outdata = indata;
      if (colorType === 3) {
        dePalette(indata, outdata, width2, height, palette);
      } else {
        if (transColor) {
          replaceTransparentColor(indata, outdata, width2, height, transColor);
        }
        if (depth !== 8) {
          if (depth === 16) {
            outdata = Buffer.alloc(width2 * height * 4);
          }
          scaleDepth(indata, outdata, width2, height, depth);
        }
      }
      return outdata;
    };
  }
});

// node_modules/pngjs/lib/parser-async.js
var require_parser_async = __commonJS({
  "node_modules/pngjs/lib/parser-async.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var zlib = __require("zlib");
    var ChunkStream = require_chunkstream();
    var FilterAsync = require_filter_parse_async();
    var Parser = require_parser();
    var bitmapper = require_bitmapper();
    var formatNormaliser = require_format_normaliser();
    var ParserAsync = module.exports = function(options) {
      ChunkStream.call(this);
      this._parser = new Parser(options, {
        read: this.read.bind(this),
        error: this._handleError.bind(this),
        metadata: this._handleMetaData.bind(this),
        gamma: this.emit.bind(this, "gamma"),
        palette: this._handlePalette.bind(this),
        transColor: this._handleTransColor.bind(this),
        finished: this._finished.bind(this),
        inflateData: this._inflateData.bind(this),
        simpleTransparency: this._simpleTransparency.bind(this),
        headersFinished: this._headersFinished.bind(this)
      });
      this._options = options;
      this.writable = true;
      this._parser.start();
    };
    util.inherits(ParserAsync, ChunkStream);
    ParserAsync.prototype._handleError = function(err) {
      this.emit("error", err);
      this.writable = false;
      this.destroy();
      if (this._inflate && this._inflate.destroy) {
        this._inflate.destroy();
      }
      if (this._filter) {
        this._filter.destroy();
        this._filter.on("error", function() {
        });
      }
      this.errord = true;
    };
    ParserAsync.prototype._inflateData = function(data) {
      if (!this._inflate) {
        if (this._bitmapInfo.interlace) {
          this._inflate = zlib.createInflate();
          this._inflate.on("error", this.emit.bind(this, "error"));
          this._filter.on("complete", this._complete.bind(this));
          this._inflate.pipe(this._filter);
        } else {
          let rowSize = (this._bitmapInfo.width * this._bitmapInfo.bpp * this._bitmapInfo.depth + 7 >> 3) + 1;
          let imageSize = rowSize * this._bitmapInfo.height;
          let chunkSize = Math.max(imageSize, zlib.Z_MIN_CHUNK);
          this._inflate = zlib.createInflate({ chunkSize });
          let leftToInflate = imageSize;
          let emitError = this.emit.bind(this, "error");
          this._inflate.on("error", function(err) {
            if (!leftToInflate) {
              return;
            }
            emitError(err);
          });
          this._filter.on("complete", this._complete.bind(this));
          let filterWrite = this._filter.write.bind(this._filter);
          this._inflate.on("data", function(chunk2) {
            if (!leftToInflate) {
              return;
            }
            if (chunk2.length > leftToInflate) {
              chunk2 = chunk2.slice(0, leftToInflate);
            }
            leftToInflate -= chunk2.length;
            filterWrite(chunk2);
          });
          this._inflate.on("end", this._filter.end.bind(this._filter));
        }
      }
      this._inflate.write(data);
    };
    ParserAsync.prototype._handleMetaData = function(metaData) {
      this._metaData = metaData;
      this._bitmapInfo = Object.create(metaData);
      this._filter = new FilterAsync(this._bitmapInfo);
    };
    ParserAsync.prototype._handleTransColor = function(transColor) {
      this._bitmapInfo.transColor = transColor;
    };
    ParserAsync.prototype._handlePalette = function(palette) {
      this._bitmapInfo.palette = palette;
    };
    ParserAsync.prototype._simpleTransparency = function() {
      this._metaData.alpha = true;
    };
    ParserAsync.prototype._headersFinished = function() {
      this.emit("metadata", this._metaData);
    };
    ParserAsync.prototype._finished = function() {
      if (this.errord) {
        return;
      }
      if (!this._inflate) {
        this.emit("error", "No Inflate block");
      } else {
        this._inflate.end();
      }
    };
    ParserAsync.prototype._complete = function(filteredData) {
      if (this.errord) {
        return;
      }
      let normalisedBitmapData;
      try {
        let bitmapData = bitmapper.dataToBitMap(filteredData, this._bitmapInfo);
        normalisedBitmapData = formatNormaliser(bitmapData, this._bitmapInfo);
        bitmapData = null;
      } catch (ex) {
        this._handleError(ex);
        return;
      }
      this.emit("parsed", normalisedBitmapData);
    };
  }
});

// node_modules/pngjs/lib/bitpacker.js
var require_bitpacker = __commonJS({
  "node_modules/pngjs/lib/bitpacker.js"(exports, module) {
    "use strict";
    var constants = require_constants();
    module.exports = function(dataIn, width2, height, options) {
      let outHasAlpha = [constants.COLORTYPE_COLOR_ALPHA, constants.COLORTYPE_ALPHA].indexOf(
        options.colorType
      ) !== -1;
      if (options.colorType === options.inputColorType) {
        let bigEndian = function() {
          let buffer = new ArrayBuffer(2);
          new DataView(buffer).setInt16(
            0,
            256,
            true
            /* littleEndian */
          );
          return new Int16Array(buffer)[0] !== 256;
        }();
        if (options.bitDepth === 8 || options.bitDepth === 16 && bigEndian) {
          return dataIn;
        }
      }
      let data = options.bitDepth !== 16 ? dataIn : new Uint16Array(dataIn.buffer);
      let maxValue = 255;
      let inBpp = constants.COLORTYPE_TO_BPP_MAP[options.inputColorType];
      if (inBpp === 4 && !options.inputHasAlpha) {
        inBpp = 3;
      }
      let outBpp = constants.COLORTYPE_TO_BPP_MAP[options.colorType];
      if (options.bitDepth === 16) {
        maxValue = 65535;
        outBpp *= 2;
      }
      let outData = Buffer.alloc(width2 * height * outBpp);
      let inIndex = 0;
      let outIndex = 0;
      let bgColor = options.bgColor || {};
      if (bgColor.red === void 0) {
        bgColor.red = maxValue;
      }
      if (bgColor.green === void 0) {
        bgColor.green = maxValue;
      }
      if (bgColor.blue === void 0) {
        bgColor.blue = maxValue;
      }
      function getRGBA() {
        let red2;
        let green2;
        let blue;
        let alpha = maxValue;
        switch (options.inputColorType) {
          case constants.COLORTYPE_COLOR_ALPHA:
            alpha = data[inIndex + 3];
            red2 = data[inIndex];
            green2 = data[inIndex + 1];
            blue = data[inIndex + 2];
            break;
          case constants.COLORTYPE_COLOR:
            red2 = data[inIndex];
            green2 = data[inIndex + 1];
            blue = data[inIndex + 2];
            break;
          case constants.COLORTYPE_ALPHA:
            alpha = data[inIndex + 1];
            red2 = data[inIndex];
            green2 = red2;
            blue = red2;
            break;
          case constants.COLORTYPE_GRAYSCALE:
            red2 = data[inIndex];
            green2 = red2;
            blue = red2;
            break;
          default:
            throw new Error(
              "input color type:" + options.inputColorType + " is not supported at present"
            );
        }
        if (options.inputHasAlpha) {
          if (!outHasAlpha) {
            alpha /= maxValue;
            red2 = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.red + alpha * red2), 0),
              maxValue
            );
            green2 = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.green + alpha * green2), 0),
              maxValue
            );
            blue = Math.min(
              Math.max(Math.round((1 - alpha) * bgColor.blue + alpha * blue), 0),
              maxValue
            );
          }
        }
        return { red: red2, green: green2, blue, alpha };
      }
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width2; x++) {
          let rgba = getRGBA(data, inIndex);
          switch (options.colorType) {
            case constants.COLORTYPE_COLOR_ALPHA:
            case constants.COLORTYPE_COLOR:
              if (options.bitDepth === 8) {
                outData[outIndex] = rgba.red;
                outData[outIndex + 1] = rgba.green;
                outData[outIndex + 2] = rgba.blue;
                if (outHasAlpha) {
                  outData[outIndex + 3] = rgba.alpha;
                }
              } else {
                outData.writeUInt16BE(rgba.red, outIndex);
                outData.writeUInt16BE(rgba.green, outIndex + 2);
                outData.writeUInt16BE(rgba.blue, outIndex + 4);
                if (outHasAlpha) {
                  outData.writeUInt16BE(rgba.alpha, outIndex + 6);
                }
              }
              break;
            case constants.COLORTYPE_ALPHA:
            case constants.COLORTYPE_GRAYSCALE: {
              let grayscale = (rgba.red + rgba.green + rgba.blue) / 3;
              if (options.bitDepth === 8) {
                outData[outIndex] = grayscale;
                if (outHasAlpha) {
                  outData[outIndex + 1] = rgba.alpha;
                }
              } else {
                outData.writeUInt16BE(grayscale, outIndex);
                if (outHasAlpha) {
                  outData.writeUInt16BE(rgba.alpha, outIndex + 2);
                }
              }
              break;
            }
            default:
              throw new Error("unrecognised color Type " + options.colorType);
          }
          inIndex += inBpp;
          outIndex += outBpp;
        }
      }
      return outData;
    };
  }
});

// node_modules/pngjs/lib/filter-pack.js
var require_filter_pack = __commonJS({
  "node_modules/pngjs/lib/filter-pack.js"(exports, module) {
    "use strict";
    var paethPredictor = require_paeth_predictor();
    function filterNone(pxData, pxPos, byteWidth, rawData, rawPos) {
      for (let x = 0; x < byteWidth; x++) {
        rawData[rawPos + x] = pxData[pxPos + x];
      }
    }
    function filterSumNone(pxData, pxPos, byteWidth) {
      let sum = 0;
      let length = pxPos + byteWidth;
      for (let i = pxPos; i < length; i++) {
        sum += Math.abs(pxData[i]);
      }
      return sum;
    }
    function filterSub(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let val = pxData[pxPos + x] - left;
        rawData[rawPos + x] = val;
      }
    }
    function filterSumSub(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let val = pxData[pxPos + x] - left;
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterUp(pxData, pxPos, byteWidth, rawData, rawPos) {
      for (let x = 0; x < byteWidth; x++) {
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - up;
        rawData[rawPos + x] = val;
      }
    }
    function filterSumUp(pxData, pxPos, byteWidth) {
      let sum = 0;
      let length = pxPos + byteWidth;
      for (let x = pxPos; x < length; x++) {
        let up = pxPos > 0 ? pxData[x - byteWidth] : 0;
        let val = pxData[x] - up;
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterAvg(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - (left + up >> 1);
        rawData[rawPos + x] = val;
      }
    }
    function filterSumAvg(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let val = pxData[pxPos + x] - (left + up >> 1);
        sum += Math.abs(val);
      }
      return sum;
    }
    function filterPaeth(pxData, pxPos, byteWidth, rawData, rawPos, bpp) {
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
        let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
        rawData[rawPos + x] = val;
      }
    }
    function filterSumPaeth(pxData, pxPos, byteWidth, bpp) {
      let sum = 0;
      for (let x = 0; x < byteWidth; x++) {
        let left = x >= bpp ? pxData[pxPos + x - bpp] : 0;
        let up = pxPos > 0 ? pxData[pxPos + x - byteWidth] : 0;
        let upleft = pxPos > 0 && x >= bpp ? pxData[pxPos + x - (byteWidth + bpp)] : 0;
        let val = pxData[pxPos + x] - paethPredictor(left, up, upleft);
        sum += Math.abs(val);
      }
      return sum;
    }
    var filters = {
      0: filterNone,
      1: filterSub,
      2: filterUp,
      3: filterAvg,
      4: filterPaeth
    };
    var filterSums = {
      0: filterSumNone,
      1: filterSumSub,
      2: filterSumUp,
      3: filterSumAvg,
      4: filterSumPaeth
    };
    module.exports = function(pxData, width2, height, options, bpp) {
      let filterTypes;
      if (!("filterType" in options) || options.filterType === -1) {
        filterTypes = [0, 1, 2, 3, 4];
      } else if (typeof options.filterType === "number") {
        filterTypes = [options.filterType];
      } else {
        throw new Error("unrecognised filter types");
      }
      if (options.bitDepth === 16) {
        bpp *= 2;
      }
      let byteWidth = width2 * bpp;
      let rawPos = 0;
      let pxPos = 0;
      let rawData = Buffer.alloc((byteWidth + 1) * height);
      let sel = filterTypes[0];
      for (let y = 0; y < height; y++) {
        if (filterTypes.length > 1) {
          let min = Infinity;
          for (let i = 0; i < filterTypes.length; i++) {
            let sum = filterSums[filterTypes[i]](pxData, pxPos, byteWidth, bpp);
            if (sum < min) {
              sel = filterTypes[i];
              min = sum;
            }
          }
        }
        rawData[rawPos] = sel;
        rawPos++;
        filters[sel](pxData, pxPos, byteWidth, rawData, rawPos, bpp);
        rawPos += byteWidth;
        pxPos += byteWidth;
      }
      return rawData;
    };
  }
});

// node_modules/pngjs/lib/packer.js
var require_packer = __commonJS({
  "node_modules/pngjs/lib/packer.js"(exports, module) {
    "use strict";
    var constants = require_constants();
    var CrcStream = require_crc();
    var bitPacker = require_bitpacker();
    var filter = require_filter_pack();
    var zlib = __require("zlib");
    var Packer = module.exports = function(options) {
      this._options = options;
      options.deflateChunkSize = options.deflateChunkSize || 32 * 1024;
      options.deflateLevel = options.deflateLevel != null ? options.deflateLevel : 9;
      options.deflateStrategy = options.deflateStrategy != null ? options.deflateStrategy : 3;
      options.inputHasAlpha = options.inputHasAlpha != null ? options.inputHasAlpha : true;
      options.deflateFactory = options.deflateFactory || zlib.createDeflate;
      options.bitDepth = options.bitDepth || 8;
      options.colorType = typeof options.colorType === "number" ? options.colorType : constants.COLORTYPE_COLOR_ALPHA;
      options.inputColorType = typeof options.inputColorType === "number" ? options.inputColorType : constants.COLORTYPE_COLOR_ALPHA;
      if ([
        constants.COLORTYPE_GRAYSCALE,
        constants.COLORTYPE_COLOR,
        constants.COLORTYPE_COLOR_ALPHA,
        constants.COLORTYPE_ALPHA
      ].indexOf(options.colorType) === -1) {
        throw new Error(
          "option color type:" + options.colorType + " is not supported at present"
        );
      }
      if ([
        constants.COLORTYPE_GRAYSCALE,
        constants.COLORTYPE_COLOR,
        constants.COLORTYPE_COLOR_ALPHA,
        constants.COLORTYPE_ALPHA
      ].indexOf(options.inputColorType) === -1) {
        throw new Error(
          "option input color type:" + options.inputColorType + " is not supported at present"
        );
      }
      if (options.bitDepth !== 8 && options.bitDepth !== 16) {
        throw new Error(
          "option bit depth:" + options.bitDepth + " is not supported at present"
        );
      }
    };
    Packer.prototype.getDeflateOptions = function() {
      return {
        chunkSize: this._options.deflateChunkSize,
        level: this._options.deflateLevel,
        strategy: this._options.deflateStrategy
      };
    };
    Packer.prototype.createDeflate = function() {
      return this._options.deflateFactory(this.getDeflateOptions());
    };
    Packer.prototype.filterData = function(data, width2, height) {
      let packedData = bitPacker(data, width2, height, this._options);
      let bpp = constants.COLORTYPE_TO_BPP_MAP[this._options.colorType];
      let filteredData = filter(packedData, width2, height, this._options, bpp);
      return filteredData;
    };
    Packer.prototype._packChunk = function(type, data) {
      let len = data ? data.length : 0;
      let buf = Buffer.alloc(len + 12);
      buf.writeUInt32BE(len, 0);
      buf.writeUInt32BE(type, 4);
      if (data) {
        data.copy(buf, 8);
      }
      buf.writeInt32BE(
        CrcStream.crc32(buf.slice(4, buf.length - 4)),
        buf.length - 4
      );
      return buf;
    };
    Packer.prototype.packGAMA = function(gamma) {
      let buf = Buffer.alloc(4);
      buf.writeUInt32BE(Math.floor(gamma * constants.GAMMA_DIVISION), 0);
      return this._packChunk(constants.TYPE_gAMA, buf);
    };
    Packer.prototype.packIHDR = function(width2, height) {
      let buf = Buffer.alloc(13);
      buf.writeUInt32BE(width2, 0);
      buf.writeUInt32BE(height, 4);
      buf[8] = this._options.bitDepth;
      buf[9] = this._options.colorType;
      buf[10] = 0;
      buf[11] = 0;
      buf[12] = 0;
      return this._packChunk(constants.TYPE_IHDR, buf);
    };
    Packer.prototype.packIDAT = function(data) {
      return this._packChunk(constants.TYPE_IDAT, data);
    };
    Packer.prototype.packIEND = function() {
      return this._packChunk(constants.TYPE_IEND, null);
    };
  }
});

// node_modules/pngjs/lib/packer-async.js
var require_packer_async = __commonJS({
  "node_modules/pngjs/lib/packer-async.js"(exports, module) {
    "use strict";
    var util = __require("util");
    var Stream = __require("stream");
    var constants = require_constants();
    var Packer = require_packer();
    var PackerAsync = module.exports = function(opt) {
      Stream.call(this);
      let options = opt || {};
      this._packer = new Packer(options);
      this._deflate = this._packer.createDeflate();
      this.readable = true;
    };
    util.inherits(PackerAsync, Stream);
    PackerAsync.prototype.pack = function(data, width2, height, gamma) {
      this.emit("data", Buffer.from(constants.PNG_SIGNATURE));
      this.emit("data", this._packer.packIHDR(width2, height));
      if (gamma) {
        this.emit("data", this._packer.packGAMA(gamma));
      }
      let filteredData = this._packer.filterData(data, width2, height);
      this._deflate.on("error", this.emit.bind(this, "error"));
      this._deflate.on(
        "data",
        function(compressedData) {
          this.emit("data", this._packer.packIDAT(compressedData));
        }.bind(this)
      );
      this._deflate.on(
        "end",
        function() {
          this.emit("data", this._packer.packIEND());
          this.emit("end");
        }.bind(this)
      );
      this._deflate.end(filteredData);
    };
  }
});

// node_modules/pngjs/lib/sync-inflate.js
var require_sync_inflate = __commonJS({
  "node_modules/pngjs/lib/sync-inflate.js"(exports, module) {
    "use strict";
    var assert = __require("assert").ok;
    var zlib = __require("zlib");
    var util = __require("util");
    var kMaxLength = __require("buffer").kMaxLength;
    function Inflate(opts) {
      if (!(this instanceof Inflate)) {
        return new Inflate(opts);
      }
      if (opts && opts.chunkSize < zlib.Z_MIN_CHUNK) {
        opts.chunkSize = zlib.Z_MIN_CHUNK;
      }
      zlib.Inflate.call(this, opts);
      this._offset = this._offset === void 0 ? this._outOffset : this._offset;
      this._buffer = this._buffer || this._outBuffer;
      if (opts && opts.maxLength != null) {
        this._maxLength = opts.maxLength;
      }
    }
    function createInflate(opts) {
      return new Inflate(opts);
    }
    function _close(engine, callback) {
      if (callback) {
        process.nextTick(callback);
      }
      if (!engine._handle) {
        return;
      }
      engine._handle.close();
      engine._handle = null;
    }
    Inflate.prototype._processChunk = function(chunk2, flushFlag, asyncCb) {
      if (typeof asyncCb === "function") {
        return zlib.Inflate._processChunk.call(this, chunk2, flushFlag, asyncCb);
      }
      let self = this;
      let availInBefore = chunk2 && chunk2.length;
      let availOutBefore = this._chunkSize - this._offset;
      let leftToInflate = this._maxLength;
      let inOff = 0;
      let buffers = [];
      let nread = 0;
      let error;
      this.on("error", function(err) {
        error = err;
      });
      function handleChunk(availInAfter, availOutAfter) {
        if (self._hadError) {
          return;
        }
        let have = availOutBefore - availOutAfter;
        assert(have >= 0, "have should not go down");
        if (have > 0) {
          let out = self._buffer.slice(self._offset, self._offset + have);
          self._offset += have;
          if (out.length > leftToInflate) {
            out = out.slice(0, leftToInflate);
          }
          buffers.push(out);
          nread += out.length;
          leftToInflate -= out.length;
          if (leftToInflate === 0) {
            return false;
          }
        }
        if (availOutAfter === 0 || self._offset >= self._chunkSize) {
          availOutBefore = self._chunkSize;
          self._offset = 0;
          self._buffer = Buffer.allocUnsafe(self._chunkSize);
        }
        if (availOutAfter === 0) {
          inOff += availInBefore - availInAfter;
          availInBefore = availInAfter;
          return true;
        }
        return false;
      }
      assert(this._handle, "zlib binding closed");
      let res;
      do {
        res = this._handle.writeSync(
          flushFlag,
          chunk2,
          // in
          inOff,
          // in_off
          availInBefore,
          // in_len
          this._buffer,
          // out
          this._offset,
          //out_off
          availOutBefore
        );
        res = res || this._writeState;
      } while (!this._hadError && handleChunk(res[0], res[1]));
      if (this._hadError) {
        throw error;
      }
      if (nread >= kMaxLength) {
        _close(this);
        throw new RangeError(
          "Cannot create final Buffer. It would be larger than 0x" + kMaxLength.toString(16) + " bytes"
        );
      }
      let buf = Buffer.concat(buffers, nread);
      _close(this);
      return buf;
    };
    util.inherits(Inflate, zlib.Inflate);
    function zlibBufferSync(engine, buffer) {
      if (typeof buffer === "string") {
        buffer = Buffer.from(buffer);
      }
      if (!(buffer instanceof Buffer)) {
        throw new TypeError("Not a string or buffer");
      }
      let flushFlag = engine._finishFlushFlag;
      if (flushFlag == null) {
        flushFlag = zlib.Z_FINISH;
      }
      return engine._processChunk(buffer, flushFlag);
    }
    function inflateSync(buffer, opts) {
      return zlibBufferSync(new Inflate(opts), buffer);
    }
    module.exports = exports = inflateSync;
    exports.Inflate = Inflate;
    exports.createInflate = createInflate;
    exports.inflateSync = inflateSync;
  }
});

// node_modules/pngjs/lib/sync-reader.js
var require_sync_reader = __commonJS({
  "node_modules/pngjs/lib/sync-reader.js"(exports, module) {
    "use strict";
    var SyncReader = module.exports = function(buffer) {
      this._buffer = buffer;
      this._reads = [];
    };
    SyncReader.prototype.read = function(length, callback) {
      this._reads.push({
        length: Math.abs(length),
        // if length < 0 then at most this length
        allowLess: length < 0,
        func: callback
      });
    };
    SyncReader.prototype.process = function() {
      while (this._reads.length > 0 && this._buffer.length) {
        let read = this._reads[0];
        if (this._buffer.length && (this._buffer.length >= read.length || read.allowLess)) {
          this._reads.shift();
          let buf = this._buffer;
          this._buffer = buf.slice(read.length);
          read.func.call(this, buf.slice(0, read.length));
        } else {
          break;
        }
      }
      if (this._reads.length > 0) {
        return new Error("There are some read requests waitng on finished stream");
      }
      if (this._buffer.length > 0) {
        return new Error("unrecognised content at end of stream");
      }
    };
  }
});

// node_modules/pngjs/lib/filter-parse-sync.js
var require_filter_parse_sync = __commonJS({
  "node_modules/pngjs/lib/filter-parse-sync.js"(exports) {
    "use strict";
    var SyncReader = require_sync_reader();
    var Filter = require_filter_parse();
    exports.process = function(inBuffer, bitmapInfo) {
      let outBuffers = [];
      let reader = new SyncReader(inBuffer);
      let filter = new Filter(bitmapInfo, {
        read: reader.read.bind(reader),
        write: function(bufferPart) {
          outBuffers.push(bufferPart);
        },
        complete: function() {
        }
      });
      filter.start();
      reader.process();
      return Buffer.concat(outBuffers);
    };
  }
});

// node_modules/pngjs/lib/parser-sync.js
var require_parser_sync = __commonJS({
  "node_modules/pngjs/lib/parser-sync.js"(exports, module) {
    "use strict";
    var hasSyncZlib = true;
    var zlib = __require("zlib");
    var inflateSync = require_sync_inflate();
    if (!zlib.deflateSync) {
      hasSyncZlib = false;
    }
    var SyncReader = require_sync_reader();
    var FilterSync = require_filter_parse_sync();
    var Parser = require_parser();
    var bitmapper = require_bitmapper();
    var formatNormaliser = require_format_normaliser();
    module.exports = function(buffer, options) {
      if (!hasSyncZlib) {
        throw new Error(
          "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
        );
      }
      let err;
      function handleError(_err_) {
        err = _err_;
      }
      let metaData;
      function handleMetaData(_metaData_) {
        metaData = _metaData_;
      }
      function handleTransColor(transColor) {
        metaData.transColor = transColor;
      }
      function handlePalette(palette) {
        metaData.palette = palette;
      }
      function handleSimpleTransparency() {
        metaData.alpha = true;
      }
      let gamma;
      function handleGamma(_gamma_) {
        gamma = _gamma_;
      }
      let inflateDataList = [];
      function handleInflateData(inflatedData2) {
        inflateDataList.push(inflatedData2);
      }
      let reader = new SyncReader(buffer);
      let parser = new Parser(options, {
        read: reader.read.bind(reader),
        error: handleError,
        metadata: handleMetaData,
        gamma: handleGamma,
        palette: handlePalette,
        transColor: handleTransColor,
        inflateData: handleInflateData,
        simpleTransparency: handleSimpleTransparency
      });
      parser.start();
      reader.process();
      if (err) {
        throw err;
      }
      let inflateData = Buffer.concat(inflateDataList);
      inflateDataList.length = 0;
      let inflatedData;
      if (metaData.interlace) {
        inflatedData = zlib.inflateSync(inflateData);
      } else {
        let rowSize = (metaData.width * metaData.bpp * metaData.depth + 7 >> 3) + 1;
        let imageSize = rowSize * metaData.height;
        inflatedData = inflateSync(inflateData, {
          chunkSize: imageSize,
          maxLength: imageSize
        });
      }
      inflateData = null;
      if (!inflatedData || !inflatedData.length) {
        throw new Error("bad png - invalid inflate data response");
      }
      let unfilteredData = FilterSync.process(inflatedData, metaData);
      inflateData = null;
      let bitmapData = bitmapper.dataToBitMap(unfilteredData, metaData);
      unfilteredData = null;
      let normalisedBitmapData = formatNormaliser(bitmapData, metaData);
      metaData.data = normalisedBitmapData;
      metaData.gamma = gamma || 0;
      return metaData;
    };
  }
});

// node_modules/pngjs/lib/packer-sync.js
var require_packer_sync = __commonJS({
  "node_modules/pngjs/lib/packer-sync.js"(exports, module) {
    "use strict";
    var hasSyncZlib = true;
    var zlib = __require("zlib");
    if (!zlib.deflateSync) {
      hasSyncZlib = false;
    }
    var constants = require_constants();
    var Packer = require_packer();
    module.exports = function(metaData, opt) {
      if (!hasSyncZlib) {
        throw new Error(
          "To use the sync capability of this library in old node versions, please pin pngjs to v2.3.0"
        );
      }
      let options = opt || {};
      let packer = new Packer(options);
      let chunks = [];
      chunks.push(Buffer.from(constants.PNG_SIGNATURE));
      chunks.push(packer.packIHDR(metaData.width, metaData.height));
      if (metaData.gamma) {
        chunks.push(packer.packGAMA(metaData.gamma));
      }
      let filteredData = packer.filterData(
        metaData.data,
        metaData.width,
        metaData.height
      );
      let compressedData = zlib.deflateSync(
        filteredData,
        packer.getDeflateOptions()
      );
      filteredData = null;
      if (!compressedData || !compressedData.length) {
        throw new Error("bad png - invalid compressed data response");
      }
      chunks.push(packer.packIDAT(compressedData));
      chunks.push(packer.packIEND());
      return Buffer.concat(chunks);
    };
  }
});

// node_modules/pngjs/lib/png-sync.js
var require_png_sync = __commonJS({
  "node_modules/pngjs/lib/png-sync.js"(exports) {
    "use strict";
    var parse = require_parser_sync();
    var pack = require_packer_sync();
    exports.read = function(buffer, options) {
      return parse(buffer, options || {});
    };
    exports.write = function(png, options) {
      return pack(png, options);
    };
  }
});

// node_modules/pngjs/lib/png.js
var require_png = __commonJS({
  "node_modules/pngjs/lib/png.js"(exports) {
    "use strict";
    var util = __require("util");
    var Stream = __require("stream");
    var Parser = require_parser_async();
    var Packer = require_packer_async();
    var PNGSync = require_png_sync();
    var PNG = exports.PNG = function(options) {
      Stream.call(this);
      options = options || {};
      this.width = options.width | 0;
      this.height = options.height | 0;
      this.data = this.width > 0 && this.height > 0 ? Buffer.alloc(4 * this.width * this.height) : null;
      if (options.fill && this.data) {
        this.data.fill(0);
      }
      this.gamma = 0;
      this.readable = this.writable = true;
      this._parser = new Parser(options);
      this._parser.on("error", this.emit.bind(this, "error"));
      this._parser.on("close", this._handleClose.bind(this));
      this._parser.on("metadata", this._metadata.bind(this));
      this._parser.on("gamma", this._gamma.bind(this));
      this._parser.on(
        "parsed",
        function(data) {
          this.data = data;
          this.emit("parsed", data);
        }.bind(this)
      );
      this._packer = new Packer(options);
      this._packer.on("data", this.emit.bind(this, "data"));
      this._packer.on("end", this.emit.bind(this, "end"));
      this._parser.on("close", this._handleClose.bind(this));
      this._packer.on("error", this.emit.bind(this, "error"));
    };
    util.inherits(PNG, Stream);
    PNG.sync = PNGSync;
    PNG.prototype.pack = function() {
      if (!this.data || !this.data.length) {
        this.emit("error", "No data provided");
        return this;
      }
      process.nextTick(
        function() {
          this._packer.pack(this.data, this.width, this.height, this.gamma);
        }.bind(this)
      );
      return this;
    };
    PNG.prototype.parse = function(data, callback) {
      if (callback) {
        let onParsed, onError;
        onParsed = function(parsedData) {
          this.removeListener("error", onError);
          this.data = parsedData;
          callback(null, this);
        }.bind(this);
        onError = function(err) {
          this.removeListener("parsed", onParsed);
          callback(err, null);
        }.bind(this);
        this.once("parsed", onParsed);
        this.once("error", onError);
      }
      this.end(data);
      return this;
    };
    PNG.prototype.write = function(data) {
      this._parser.write(data);
      return true;
    };
    PNG.prototype.end = function(data) {
      this._parser.end(data);
    };
    PNG.prototype._metadata = function(metadata) {
      this.width = metadata.width;
      this.height = metadata.height;
      this.emit("metadata", metadata);
    };
    PNG.prototype._gamma = function(gamma) {
      this.gamma = gamma;
    };
    PNG.prototype._handleClose = function() {
      if (!this._parser.writable && !this._packer.readable) {
        this.emit("close");
      }
    };
    PNG.bitblt = function(src, dst, srcX, srcY, width2, height, deltaX, deltaY) {
      srcX |= 0;
      srcY |= 0;
      width2 |= 0;
      height |= 0;
      deltaX |= 0;
      deltaY |= 0;
      if (srcX > src.width || srcY > src.height || srcX + width2 > src.width || srcY + height > src.height) {
        throw new Error("bitblt reading outside image");
      }
      if (deltaX > dst.width || deltaY > dst.height || deltaX + width2 > dst.width || deltaY + height > dst.height) {
        throw new Error("bitblt writing outside image");
      }
      for (let y = 0; y < height; y++) {
        src.data.copy(
          dst.data,
          (deltaY + y) * dst.width + deltaX << 2,
          (srcY + y) * src.width + srcX << 2,
          (srcY + y) * src.width + srcX + width2 << 2
        );
      }
    };
    PNG.prototype.bitblt = function(dst, srcX, srcY, width2, height, deltaX, deltaY) {
      PNG.bitblt(this, dst, srcX, srcY, width2, height, deltaX, deltaY);
      return this;
    };
    PNG.adjustGamma = function(src) {
      if (src.gamma) {
        for (let y = 0; y < src.height; y++) {
          for (let x = 0; x < src.width; x++) {
            let idx = src.width * y + x << 2;
            for (let i = 0; i < 3; i++) {
              let sample = src.data[idx + i] / 255;
              sample = Math.pow(sample, 1 / 2.2 / src.gamma);
              src.data[idx + i] = Math.round(sample * 255);
            }
          }
        }
        src.gamma = 0;
      }
    };
    PNG.prototype.adjustGamma = function() {
      PNG.adjustGamma(this);
    };
  }
});

// node_modules/qrcode/lib/renderer/utils.js
var require_utils2 = __commonJS({
  "node_modules/qrcode/lib/renderer/utils.js"(exports) {
    function hex2rgba(hex) {
      if (typeof hex === "number") {
        hex = hex.toString();
      }
      if (typeof hex !== "string") {
        throw new Error("Color should be defined as hex string");
      }
      let hexCode = hex.slice().replace("#", "").split("");
      if (hexCode.length < 3 || hexCode.length === 5 || hexCode.length > 8) {
        throw new Error("Invalid hex color: " + hex);
      }
      if (hexCode.length === 3 || hexCode.length === 4) {
        hexCode = Array.prototype.concat.apply([], hexCode.map(function(c) {
          return [c, c];
        }));
      }
      if (hexCode.length === 6) hexCode.push("F", "F");
      const hexValue = parseInt(hexCode.join(""), 16);
      return {
        r: hexValue >> 24 & 255,
        g: hexValue >> 16 & 255,
        b: hexValue >> 8 & 255,
        a: hexValue & 255,
        hex: "#" + hexCode.slice(0, 6).join("")
      };
    }
    exports.getOptions = function getOptions(options) {
      if (!options) options = {};
      if (!options.color) options.color = {};
      const margin = typeof options.margin === "undefined" || options.margin === null || options.margin < 0 ? 4 : options.margin;
      const width2 = options.width && options.width >= 21 ? options.width : void 0;
      const scale = options.scale || 4;
      return {
        width: width2,
        scale: width2 ? 4 : scale,
        margin,
        color: {
          dark: hex2rgba(options.color.dark || "#000000ff"),
          light: hex2rgba(options.color.light || "#ffffffff")
        },
        type: options.type,
        rendererOpts: options.rendererOpts || {}
      };
    };
    exports.getScale = function getScale(qrSize, opts) {
      return opts.width && opts.width >= qrSize + opts.margin * 2 ? opts.width / (qrSize + opts.margin * 2) : opts.scale;
    };
    exports.getImageWidth = function getImageWidth(qrSize, opts) {
      const scale = exports.getScale(qrSize, opts);
      return Math.floor((qrSize + opts.margin * 2) * scale);
    };
    exports.qrToImageData = function qrToImageData(imgData, qr, opts) {
      const size = qr.modules.size;
      const data = qr.modules.data;
      const scale = exports.getScale(size, opts);
      const symbolSize = Math.floor((size + opts.margin * 2) * scale);
      const scaledMargin = opts.margin * scale;
      const palette = [opts.color.light, opts.color.dark];
      for (let i = 0; i < symbolSize; i++) {
        for (let j = 0; j < symbolSize; j++) {
          let posDst = (i * symbolSize + j) * 4;
          let pxColor = opts.color.light;
          if (i >= scaledMargin && j >= scaledMargin && i < symbolSize - scaledMargin && j < symbolSize - scaledMargin) {
            const iSrc = Math.floor((i - scaledMargin) / scale);
            const jSrc = Math.floor((j - scaledMargin) / scale);
            pxColor = palette[data[iSrc * size + jSrc] ? 1 : 0];
          }
          imgData[posDst++] = pxColor.r;
          imgData[posDst++] = pxColor.g;
          imgData[posDst++] = pxColor.b;
          imgData[posDst] = pxColor.a;
        }
      }
    };
  }
});

// node_modules/qrcode/lib/renderer/png.js
var require_png2 = __commonJS({
  "node_modules/qrcode/lib/renderer/png.js"(exports) {
    var fs = __require("fs");
    var PNG = require_png().PNG;
    var Utils = require_utils2();
    exports.render = function render(qrData, options) {
      const opts = Utils.getOptions(options);
      const pngOpts = opts.rendererOpts;
      const size = Utils.getImageWidth(qrData.modules.size, opts);
      pngOpts.width = size;
      pngOpts.height = size;
      const pngImage = new PNG(pngOpts);
      Utils.qrToImageData(pngImage.data, qrData, opts);
      return pngImage;
    };
    exports.renderToDataURL = function renderToDataURL(qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      exports.renderToBuffer(qrData, options, function(err, output) {
        if (err) cb(err);
        let url = "data:image/png;base64,";
        url += output.toString("base64");
        cb(null, url);
      });
    };
    exports.renderToBuffer = function renderToBuffer(qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      const png = exports.render(qrData, options);
      const buffer = [];
      png.on("error", cb);
      png.on("data", function(data) {
        buffer.push(data);
      });
      png.on("end", function() {
        cb(null, Buffer.concat(buffer));
      });
      png.pack();
    };
    exports.renderToFile = function renderToFile(path, qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      let called = false;
      const done = (...args) => {
        if (called) return;
        called = true;
        cb.apply(null, args);
      };
      const stream = fs.createWriteStream(path);
      stream.on("error", done);
      stream.on("close", done);
      exports.renderToFileStream(stream, qrData, options);
    };
    exports.renderToFileStream = function renderToFileStream(stream, qrData, options) {
      const png = exports.render(qrData, options);
      png.pack().pipe(stream);
    };
  }
});

// node_modules/qrcode/lib/renderer/utf8.js
var require_utf8 = __commonJS({
  "node_modules/qrcode/lib/renderer/utf8.js"(exports) {
    var Utils = require_utils2();
    var BLOCK_CHAR = {
      WW: " ",
      WB: "\u2584",
      BB: "\u2588",
      BW: "\u2580"
    };
    var INVERTED_BLOCK_CHAR = {
      BB: " ",
      BW: "\u2584",
      WW: "\u2588",
      WB: "\u2580"
    };
    function getBlockChar(top, bottom, blocks) {
      if (top && bottom) return blocks.BB;
      if (top && !bottom) return blocks.BW;
      if (!top && bottom) return blocks.WB;
      return blocks.WW;
    }
    exports.render = function(qrData, options, cb) {
      const opts = Utils.getOptions(options);
      let blocks = BLOCK_CHAR;
      if (opts.color.dark.hex === "#ffffff" || opts.color.light.hex === "#000000") {
        blocks = INVERTED_BLOCK_CHAR;
      }
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      let output = "";
      let hMargin = Array(size + opts.margin * 2 + 1).join(blocks.WW);
      hMargin = Array(opts.margin / 2 + 1).join(hMargin + "\n");
      const vMargin = Array(opts.margin + 1).join(blocks.WW);
      output += hMargin;
      for (let i = 0; i < size; i += 2) {
        output += vMargin;
        for (let j = 0; j < size; j++) {
          const topModule = data[i * size + j];
          const bottomModule = data[(i + 1) * size + j];
          output += getBlockChar(topModule, bottomModule, blocks);
        }
        output += vMargin + "\n";
      }
      output += hMargin.slice(0, -1);
      if (typeof cb === "function") {
        cb(null, output);
      }
      return output;
    };
    exports.renderToFile = function renderToFile(path, qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      const fs = __require("fs");
      const utf8 = exports.render(qrData, options);
      fs.writeFile(path, utf8, cb);
    };
  }
});

// node_modules/qrcode/lib/renderer/terminal/terminal.js
var require_terminal = __commonJS({
  "node_modules/qrcode/lib/renderer/terminal/terminal.js"(exports) {
    exports.render = function(qrData, options, cb) {
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const black = "\x1B[40m  \x1B[0m";
      const white = "\x1B[47m  \x1B[0m";
      let output = "";
      const hMargin = Array(size + 3).join(white);
      const vMargin = Array(2).join(white);
      output += hMargin + "\n";
      for (let i = 0; i < size; ++i) {
        output += white;
        for (let j = 0; j < size; j++) {
          output += data[i * size + j] ? black : white;
        }
        output += vMargin + "\n";
      }
      output += hMargin + "\n";
      if (typeof cb === "function") {
        cb(null, output);
      }
      return output;
    };
  }
});

// node_modules/qrcode/lib/renderer/terminal/terminal-small.js
var require_terminal_small = __commonJS({
  "node_modules/qrcode/lib/renderer/terminal/terminal-small.js"(exports) {
    var backgroundWhite = "\x1B[47m";
    var backgroundBlack = "\x1B[40m";
    var foregroundWhite = "\x1B[37m";
    var foregroundBlack = "\x1B[30m";
    var reset = "\x1B[0m";
    var lineSetupNormal = backgroundWhite + foregroundBlack;
    var lineSetupInverse = backgroundBlack + foregroundWhite;
    var createPalette = function(lineSetup, foregroundWhite2, foregroundBlack2) {
      return {
        // 1 ... white, 2 ... black, 0 ... transparent (default)
        "00": reset + " " + lineSetup,
        "01": reset + foregroundWhite2 + "\u2584" + lineSetup,
        "02": reset + foregroundBlack2 + "\u2584" + lineSetup,
        10: reset + foregroundWhite2 + "\u2580" + lineSetup,
        11: " ",
        12: "\u2584",
        20: reset + foregroundBlack2 + "\u2580" + lineSetup,
        21: "\u2580",
        22: "\u2588"
      };
    };
    var mkCodePixel = function(modules, size, x, y) {
      const sizePlus = size + 1;
      if (x >= sizePlus || y >= sizePlus || y < -1 || x < -1) return "0";
      if (x >= size || y >= size || y < 0 || x < 0) return "1";
      const idx = y * size + x;
      return modules[idx] ? "2" : "1";
    };
    var mkCode = function(modules, size, x, y) {
      return mkCodePixel(modules, size, x, y) + mkCodePixel(modules, size, x, y + 1);
    };
    exports.render = function(qrData, options, cb) {
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const inverse = !!(options && options.inverse);
      const lineSetup = options && options.inverse ? lineSetupInverse : lineSetupNormal;
      const white = inverse ? foregroundBlack : foregroundWhite;
      const black = inverse ? foregroundWhite : foregroundBlack;
      const palette = createPalette(lineSetup, white, black);
      const newLine = reset + "\n" + lineSetup;
      let output = lineSetup;
      for (let y = -1; y < size + 1; y += 2) {
        for (let x = -1; x < size; x++) {
          output += palette[mkCode(data, size, x, y)];
        }
        output += palette[mkCode(data, size, size, y)] + newLine;
      }
      output += reset;
      if (typeof cb === "function") {
        cb(null, output);
      }
      return output;
    };
  }
});

// node_modules/qrcode/lib/renderer/terminal.js
var require_terminal2 = __commonJS({
  "node_modules/qrcode/lib/renderer/terminal.js"(exports) {
    var big = require_terminal();
    var small = require_terminal_small();
    exports.render = function(qrData, options, cb) {
      if (options && options.small) {
        return small.render(qrData, options, cb);
      }
      return big.render(qrData, options, cb);
    };
  }
});

// node_modules/qrcode/lib/renderer/svg-tag.js
var require_svg_tag = __commonJS({
  "node_modules/qrcode/lib/renderer/svg-tag.js"(exports) {
    var Utils = require_utils2();
    function getColorAttrib(color, attrib) {
      const alpha = color.a / 255;
      const str = attrib + '="' + color.hex + '"';
      return alpha < 1 ? str + " " + attrib + '-opacity="' + alpha.toFixed(2).slice(1) + '"' : str;
    }
    function svgCmd(cmd, x, y) {
      let str = cmd + x;
      if (typeof y !== "undefined") str += " " + y;
      return str;
    }
    function qrToPath(data, size, margin) {
      let path = "";
      let moveBy = 0;
      let newRow = false;
      let lineLength = 0;
      for (let i = 0; i < data.length; i++) {
        const col = Math.floor(i % size);
        const row = Math.floor(i / size);
        if (!col && !newRow) newRow = true;
        if (data[i]) {
          lineLength++;
          if (!(i > 0 && col > 0 && data[i - 1])) {
            path += newRow ? svgCmd("M", col + margin, 0.5 + row + margin) : svgCmd("m", moveBy, 0);
            moveBy = 0;
            newRow = false;
          }
          if (!(col + 1 < size && data[i + 1])) {
            path += svgCmd("h", lineLength);
            lineLength = 0;
          }
        } else {
          moveBy++;
        }
      }
      return path;
    }
    exports.render = function render(qrData, options, cb) {
      const opts = Utils.getOptions(options);
      const size = qrData.modules.size;
      const data = qrData.modules.data;
      const qrcodesize = size + opts.margin * 2;
      const bg = !opts.color.light.a ? "" : "<path " + getColorAttrib(opts.color.light, "fill") + ' d="M0 0h' + qrcodesize + "v" + qrcodesize + 'H0z"/>';
      const path = "<path " + getColorAttrib(opts.color.dark, "stroke") + ' d="' + qrToPath(data, size, opts.margin) + '"/>';
      const viewBox = 'viewBox="0 0 ' + qrcodesize + " " + qrcodesize + '"';
      const width2 = !opts.width ? "" : 'width="' + opts.width + '" height="' + opts.width + '" ';
      const svgTag = '<svg xmlns="http://www.w3.org/2000/svg" ' + width2 + viewBox + ' shape-rendering="crispEdges">' + bg + path + "</svg>\n";
      if (typeof cb === "function") {
        cb(null, svgTag);
      }
      return svgTag;
    };
  }
});

// node_modules/qrcode/lib/renderer/svg.js
var require_svg = __commonJS({
  "node_modules/qrcode/lib/renderer/svg.js"(exports) {
    var svgTagRenderer = require_svg_tag();
    exports.render = svgTagRenderer.render;
    exports.renderToFile = function renderToFile(path, qrData, options, cb) {
      if (typeof cb === "undefined") {
        cb = options;
        options = void 0;
      }
      const fs = __require("fs");
      const svgTag = exports.render(qrData, options);
      const xmlStr = '<?xml version="1.0" encoding="utf-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">' + svgTag;
      fs.writeFile(path, xmlStr, cb);
    };
  }
});

// node_modules/qrcode/lib/renderer/canvas.js
var require_canvas = __commonJS({
  "node_modules/qrcode/lib/renderer/canvas.js"(exports) {
    var Utils = require_utils2();
    function clearCanvas(ctx, canvas, size) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!canvas.style) canvas.style = {};
      canvas.height = size;
      canvas.width = size;
      canvas.style.height = size + "px";
      canvas.style.width = size + "px";
    }
    function getCanvasElement() {
      try {
        return document.createElement("canvas");
      } catch (e) {
        throw new Error("You need to specify a canvas element");
      }
    }
    exports.render = function render(qrData, canvas, options) {
      let opts = options;
      let canvasEl = canvas;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!canvas) {
        canvasEl = getCanvasElement();
      }
      opts = Utils.getOptions(opts);
      const size = Utils.getImageWidth(qrData.modules.size, opts);
      const ctx = canvasEl.getContext("2d");
      const image = ctx.createImageData(size, size);
      Utils.qrToImageData(image.data, qrData, opts);
      clearCanvas(ctx, canvasEl, size);
      ctx.putImageData(image, 0, 0);
      return canvasEl;
    };
    exports.renderToDataURL = function renderToDataURL(qrData, canvas, options) {
      let opts = options;
      if (typeof opts === "undefined" && (!canvas || !canvas.getContext)) {
        opts = canvas;
        canvas = void 0;
      }
      if (!opts) opts = {};
      const canvasEl = exports.render(qrData, canvas, opts);
      const type = opts.type || "image/png";
      const rendererOpts = opts.rendererOpts || {};
      return canvasEl.toDataURL(type, rendererOpts.quality);
    };
  }
});

// node_modules/qrcode/lib/browser.js
var require_browser = __commonJS({
  "node_modules/qrcode/lib/browser.js"(exports) {
    var canPromise = require_can_promise();
    var QRCode2 = require_qrcode();
    var CanvasRenderer = require_canvas();
    var SvgRenderer = require_svg_tag();
    function renderCanvas(renderFunc, canvas, text, opts, cb) {
      const args = [].slice.call(arguments, 1);
      const argsNum = args.length;
      const isLastArgCb = typeof args[argsNum - 1] === "function";
      if (!isLastArgCb && !canPromise()) {
        throw new Error("Callback required as last argument");
      }
      if (isLastArgCb) {
        if (argsNum < 2) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 2) {
          cb = text;
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 3) {
          if (canvas.getContext && typeof cb === "undefined") {
            cb = opts;
            opts = void 0;
          } else {
            cb = opts;
            opts = text;
            text = canvas;
            canvas = void 0;
          }
        }
      } else {
        if (argsNum < 1) {
          throw new Error("Too few arguments provided");
        }
        if (argsNum === 1) {
          text = canvas;
          canvas = opts = void 0;
        } else if (argsNum === 2 && !canvas.getContext) {
          opts = text;
          text = canvas;
          canvas = void 0;
        }
        return new Promise(function(resolve, reject) {
          try {
            const data = QRCode2.create(text, opts);
            resolve(renderFunc(data, canvas, opts));
          } catch (e) {
            reject(e);
          }
        });
      }
      try {
        const data = QRCode2.create(text, opts);
        cb(null, renderFunc(data, canvas, opts));
      } catch (e) {
        cb(e);
      }
    }
    exports.create = QRCode2.create;
    exports.toCanvas = renderCanvas.bind(null, CanvasRenderer.render);
    exports.toDataURL = renderCanvas.bind(null, CanvasRenderer.renderToDataURL);
    exports.toString = renderCanvas.bind(null, function(data, _, opts) {
      return SvgRenderer.render(data, opts);
    });
  }
});

// node_modules/qrcode/lib/server.js
var require_server = __commonJS({
  "node_modules/qrcode/lib/server.js"(exports) {
    var canPromise = require_can_promise();
    var QRCode2 = require_qrcode();
    var PngRenderer = require_png2();
    var Utf8Renderer = require_utf8();
    var TerminalRenderer = require_terminal2();
    var SvgRenderer = require_svg();
    function checkParams(text, opts, cb) {
      if (typeof text === "undefined") {
        throw new Error("String required as first argument");
      }
      if (typeof cb === "undefined") {
        cb = opts;
        opts = {};
      }
      if (typeof cb !== "function") {
        if (!canPromise()) {
          throw new Error("Callback required as last argument");
        } else {
          opts = cb || {};
          cb = null;
        }
      }
      return {
        opts,
        cb
      };
    }
    function getTypeFromFilename(path) {
      return path.slice((path.lastIndexOf(".") - 1 >>> 0) + 2).toLowerCase();
    }
    function getRendererFromType(type) {
      switch (type) {
        case "svg":
          return SvgRenderer;
        case "txt":
        case "utf8":
          return Utf8Renderer;
        case "png":
        case "image/png":
        default:
          return PngRenderer;
      }
    }
    function getStringRendererFromType(type) {
      switch (type) {
        case "svg":
          return SvgRenderer;
        case "terminal":
          return TerminalRenderer;
        case "utf8":
        default:
          return Utf8Renderer;
      }
    }
    function render(renderFunc, text, params) {
      if (!params.cb) {
        return new Promise(function(resolve, reject) {
          try {
            const data = QRCode2.create(text, params.opts);
            return renderFunc(data, params.opts, function(err, data2) {
              return err ? reject(err) : resolve(data2);
            });
          } catch (e) {
            reject(e);
          }
        });
      }
      try {
        const data = QRCode2.create(text, params.opts);
        return renderFunc(data, params.opts, params.cb);
      } catch (e) {
        params.cb(e);
      }
    }
    exports.create = QRCode2.create;
    exports.toCanvas = require_browser().toCanvas;
    exports.toString = function toString(text, opts, cb) {
      const params = checkParams(text, opts, cb);
      const type = params.opts ? params.opts.type : void 0;
      const renderer = getStringRendererFromType(type);
      return render(renderer.render, text, params);
    };
    exports.toDataURL = function toDataURL(text, opts, cb) {
      const params = checkParams(text, opts, cb);
      const renderer = getRendererFromType(params.opts.type);
      return render(renderer.renderToDataURL, text, params);
    };
    exports.toBuffer = function toBuffer(text, opts, cb) {
      const params = checkParams(text, opts, cb);
      const renderer = getRendererFromType(params.opts.type);
      return render(renderer.renderToBuffer, text, params);
    };
    exports.toFile = function toFile(path, text, opts, cb) {
      if (typeof path !== "string" || !(typeof text === "string" || typeof text === "object")) {
        throw new Error("Invalid argument");
      }
      if (arguments.length < 3 && !canPromise()) {
        throw new Error("Too few arguments provided");
      }
      const params = checkParams(text, opts, cb);
      const type = params.opts.type || getTypeFromFilename(path);
      const renderer = getRendererFromType(type);
      const renderToFile = renderer.renderToFile.bind(null, path);
      return render(renderToFile, text, params);
    };
    exports.toFileStream = function toFileStream(stream, text, opts) {
      if (arguments.length < 2) {
        throw new Error("Too few arguments provided");
      }
      const params = checkParams(text, opts, stream.emit.bind(stream, "error"));
      const renderer = getRendererFromType("png");
      const renderToFileStream = renderer.renderToFileStream.bind(null, stream);
      render(renderToFileStream, text, params);
    };
  }
});

// node_modules/qrcode/lib/index.js
var require_lib = __commonJS({
  "node_modules/qrcode/lib/index.js"(exports, module) {
    module.exports = require_server();
  }
});

// src/config.ts
var SUPABASE_URL = process.env.SURPRISE_API_URL ?? "https://api.surprise.fm";
var ANON_KEY = process.env.SURPRISE_ANON_KEY ?? "eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJyb2xlIjogImFub24iLCAiaXNzIjogInN1cGFiYXNlIiwgImlhdCI6IDE3NzMxNzc2NjIsICJleHAiOiAxOTMwODU3NjYyfQ.KtNNkx_X33kDoDXBh1hiqDlvF660-0mil45pJlL8UvE";
var FALLBACK_STREAM = "https://radio.surprise.fm/listen/surprise/radio.mp3";
var NOWPLAYING_INTERVAL_MS = 2e4;
var HEARTBEAT_INTERVAL_MS = 15e3;
var CLIENT_NAME = "surprise-cli";
var CLIENT_VERSION = "0.1.0";
var PLATFORM_HINT = process.env.SURPRISE_PLATFORM_HINT ?? "cli";

// src/net/http.ts
var ApiError = class extends Error {
  status;
  body;
  constructor(status, body, message) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
};
var NetworkError = class extends Error {
  // Поле объявлено явно, а не parameter property: Node снимает типы «в лоб» и
  // на `constructor(..., readonly cause)` падает с ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX.
  reason;
  constructor(message, reason) {
    super(message);
    this.name = "NetworkError";
    this.reason = reason;
  }
};
function anonHeaders() {
  return {
    apikey: ANON_KEY,
    Authorization: `Bearer ${ANON_KEY}`,
    "Content-Type": "application/json",
    "x-client-info": `${CLIENT_NAME}/${CLIENT_VERSION}`
  };
}
function authHeaders(accessToken) {
  return { ...anonHeaders(), Authorization: `Bearer ${accessToken}` };
}
function messageFromBody(body, fallback) {
  if (typeof body === "string" && body.trim()) return body.trim();
  if (body && typeof body === "object") {
    const b = body;
    for (const key of ["error_description", "error", "message", "msg", "hint"]) {
      const value = b[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return fallback;
}
async function readBody(res) {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
var DEFAULT_TIMEOUT_MS = 15e3;
async function once(url, options) {
  const { method = "GET", headers: headers2 = {}, body, timeoutMs = DEFAULT_TIMEOUT_MS, signal } = options;
  const timeout = AbortSignal.timeout(timeoutMs);
  const composed = signal ? AbortSignal.any([signal, timeout]) : timeout;
  let res;
  try {
    res = await fetch(url, {
      method,
      headers: headers2,
      body: body === void 0 ? void 0 : JSON.stringify(body),
      signal: composed
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new NetworkError("\u0421\u0435\u0442\u044C \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u0438\u043B\u0438 \u0441\u0435\u0440\u0432\u0435\u0440 \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B", error);
  }
  const parsed = await readBody(res);
  if (!res.ok) throw new ApiError(res.status, parsed, messageFromBody(parsed, `HTTP ${res.status}`));
  return parsed;
}
var RETRYABLE_STATUS = /* @__PURE__ */ new Set([502, 503, 504]);
async function request(url, options = {}) {
  const retries = options.retries ?? 2;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await once(url, options);
    } catch (error) {
      lastError = error;
      const retryable = error instanceof NetworkError || error instanceof ApiError && RETRYABLE_STATUS.has(error.status);
      if (!retryable || attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
    }
  }
  throw lastError;
}
function functionUrl(name) {
  return `${SUPABASE_URL}/functions/v1/${name}`;
}
function restUrl(path) {
  return `${SUPABASE_URL}/rest/v1/${path}`;
}
function authUrl(path) {
  return `${SUPABASE_URL}/auth/v1/${path}`;
}
function callFunction(name, body = {}, init = {}) {
  return request(functionUrl(name), {
    method: "POST",
    headers: init.accessToken ? authHeaders(init.accessToken) : anonHeaders(),
    body,
    timeoutMs: init.timeoutMs,
    retries: init.retries
  });
}
function chunk(items, size = 100) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

// src/lib/showVisibility.ts
var SITE_HIDDEN_STATUSES = ["archived"];
var ARCHIVED_FILTER = `(${SITE_HIDDEN_STATUSES.join(",")})`;
function isHiddenFromSite(status) {
  return !!status && SITE_HIDDEN_STATUSES.includes(status);
}

// src/api/library.ts
function toPlaylist(row) {
  return {
    id: row.id,
    public_id: row.public_id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    is_public: row.is_public,
    is_system: row.is_system === true,
    itemCount: row.playlist_items?.[0]?.count ?? 0
  };
}
var PLAYLIST_SELECT = "id,public_id,slug,title,description,is_public,is_system,playlist_items(count)";
async function listPlaylists(accessToken, userId) {
  const params = new URLSearchParams({
    select: PLAYLIST_SELECT,
    author_id: `eq.${userId}`,
    order: "created_at.desc"
  });
  const rows = await request(restUrl(`playlists?${params}`), {
    headers: authHeaders(accessToken)
  });
  return (rows ?? []).map(toPlaylist);
}
async function listPlaylistItems(accessToken, playlistId) {
  const params = new URLSearchParams({
    select: "position,show_id,store_track_id,shows_v2(id,title,duration,status,show_artists(artists(name))),store_tracks(id,title,duration,artist_name,releases(title))",
    playlist_id: `eq.${playlistId}`,
    order: "position.asc.nullslast"
  });
  const rows = await request(restUrl(`playlist_items?${params}`), {
    headers: authHeaders(accessToken)
  });
  const entries = [];
  for (const row of rows ?? []) {
    const show = row.shows_v2;
    if (show) {
      if (isHiddenFromSite(show.status)) continue;
      const artists = (show.show_artists ?? []).map((link) => link.artists?.name).filter((name) => !!name).join(", ");
      entries.push({
        kind: "show",
        id: show.id,
        title: show.title ?? "\u0411\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F",
        subtitle: artists || null,
        durationSec: show.duration,
        position: row.position
      });
      continue;
    }
    const track = row.store_tracks;
    if (track) {
      entries.push({
        kind: "track",
        id: track.id,
        title: track.title ?? "\u0411\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F",
        subtitle: track.artist_name ?? track.releases?.title ?? null,
        durationSec: track.duration,
        position: row.position
      });
    }
  }
  return entries;
}
async function listLikedShows(accessToken, userId, limit = 50) {
  const params = new URLSearchParams({
    select: "created_at,shows_v2(id,public_id,slug,title,duration,status,show_artists(artists(name)))",
    user_id: `eq.${userId}`,
    show_id: "not.is.null",
    order: "created_at.desc",
    limit: String(limit)
  });
  const rows = await request(restUrl(`likes?${params}`), {
    headers: authHeaders(accessToken)
  });
  const shows = [];
  for (const row of rows ?? []) {
    const show = row.shows_v2;
    if (!show || isHiddenFromSite(show.status)) continue;
    shows.push({
      id: show.id,
      public_id: show.public_id,
      slug: show.slug,
      title: show.title,
      duration: show.duration,
      artists: (show.show_artists ?? []).map((link) => link.artists?.name).filter((name) => !!name)
    });
  }
  return shows;
}
async function listFinds(accessToken, userId, limit = 50) {
  const params = new URLSearchParams({
    select: "id,created_at,show_tracklist(id,artist,title,timestamp_sec,shows_v2(id,public_id,slug,title,status,hosts:host_id(tracklist_disabled)))",
    user_id: `eq.${userId}`,
    order: "created_at.desc",
    limit: String(limit)
  });
  const rows = await request(restUrl(`track_finds?${params}`), {
    headers: authHeaders(accessToken)
  });
  const finds = [];
  for (const row of rows ?? []) {
    const item = row.show_tracklist;
    const show = item?.shows_v2;
    if (!item || !show) continue;
    if (show.hosts?.tracklist_disabled === true) continue;
    if (isHiddenFromSite(show.status)) continue;
    finds.push({
      id: row.id,
      artist: item.artist,
      title: item.title,
      timestampSec: item.timestamp_sec,
      show: { id: show.id, public_id: show.public_id, slug: show.slug, title: show.title }
    });
  }
  return finds;
}
async function listSaves(accessToken, userId, limit = 60) {
  const params = new URLSearchParams({
    select: "id,entity_type,entity_id,created_at",
    user_id: `eq.${userId}`,
    order: "created_at.desc",
    limit: String(limit)
  });
  const rows = await request(restUrl(`saves?${params}`), {
    headers: authHeaders(accessToken)
  });
  return (rows ?? []).map((row) => ({ id: row.id, entityType: row.entity_type, entityId: row.entity_id }));
}
async function resolveSavedShows(accessToken, ids) {
  const out = /* @__PURE__ */ new Map();
  if (ids.length === 0) return out;
  for (const part of chunk(ids, 100)) {
    const params = new URLSearchParams({
      select: "id,title,public_id,slug,status",
      id: `in.(${part.join(",")})`
    });
    const rows = await request(restUrl(`shows_v2?${params}`), {
      headers: authHeaders(accessToken)
    });
    for (const row of rows ?? []) {
      if (isHiddenFromSite(row.status)) continue;
      out.set(row.id, { title: row.title, public_id: row.public_id, slug: row.slug });
    }
  }
  return out;
}
async function listSubscriptions(accessToken, userId) {
  const params = new URLSearchParams({
    select: "entity_type,entity_id,status,created_at",
    user_id: `eq.${userId}`,
    order: "created_at.desc"
  });
  const rows = await request(restUrl(`subscriptions?${params}`), {
    headers: authHeaders(accessToken)
  });
  return (rows ?? []).map((row) => ({
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status
  }));
}
async function resolveSubscriptionNames(accessToken, subscriptions) {
  const names = /* @__PURE__ */ new Map();
  const auth = authHeaders(accessToken);
  const groups = [
    {
      types: ["artist"],
      table: "artists",
      select: "id,name",
      label: (row) => String(row.name ?? "")
    },
    {
      types: ["host"],
      table: "hosts",
      select: "id,name",
      label: (row) => String(row.name ?? "")
    },
    {
      types: ["user"],
      table: "profiles",
      select: "id,username,display_name",
      label: (row) => String(row.display_name || (row.username ? `@${row.username}` : ""))
    }
  ];
  await Promise.all(
    groups.map(async (group) => {
      const ids = subscriptions.filter((subscription) => group.types.includes(subscription.entityType)).map((subscription) => subscription.entityId);
      if (ids.length === 0) return;
      for (const part of chunk(ids, 100)) {
        const params = new URLSearchParams({ select: group.select, id: `in.(${part.join(",")})` });
        const rows = await request(restUrl(`${group.table}?${params}`), { headers: auth }).catch(
          () => []
        );
        for (const row of rows ?? []) {
          const label = group.label(row);
          if (label) names.set(String(row.id), label);
        }
      }
    })
  );
  return names;
}

// src/lib/format.ts
function formatDuration(totalSeconds) {
  if (totalSeconds === null || totalSeconds === void 0 || !Number.isFinite(totalSeconds)) return "--:--";
  const total = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor(total % 3600 / 60);
  const seconds = total % 60;
  const mm = hours > 0 ? String(minutes).padStart(2, "0") : String(minutes);
  return hours > 0 ? `${hours}:${mm}:${String(seconds).padStart(2, "0")}` : `${mm}:${String(seconds).padStart(2, "0")}`;
}
function truncate(text, maxWidth) {
  if (maxWidth <= 0) return "";
  const chars = [...text];
  if (chars.length <= maxWidth) return text;
  if (maxWidth === 1) return "\u2026";
  return `${chars.slice(0, maxWidth - 1).join("")}\u2026`;
}
function progressBar(position, total, width2) {
  if (total === null || total <= 0 || width2 <= 2) return "";
  const ratio = Math.min(1, Math.max(0, (position ?? 0) / total));
  const filled = Math.round(ratio * width2);
  return "\u2501".repeat(filled) + "\u2500".repeat(Math.max(0, width2 - filled));
}

// src/net/jwt.ts
var EMPTY = { sub: null, exp: null, role: null, email: null };
function decodeSegment(segment) {
  const base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  const json = Buffer.from(base64, "base64").toString("utf8");
  return JSON.parse(json);
}
function parseJwt(token) {
  if (!token) return EMPTY;
  const segment = token.split(".")[1];
  if (!segment) return EMPTY;
  let payload;
  try {
    payload = decodeSegment(segment);
  } catch {
    return EMPTY;
  }
  if (!payload || typeof payload !== "object") return EMPTY;
  const p = payload;
  return {
    sub: typeof p.sub === "string" ? p.sub : null,
    exp: typeof p.exp === "number" && Number.isFinite(p.exp) ? p.exp : null,
    role: typeof p.role === "string" ? p.role : null,
    email: typeof p.email === "string" ? p.email : null
  };
}
function expiresAtFromToken(token) {
  return parseJwt(token).exp ?? Math.floor(Date.now() / 1e3) + 3600;
}
function isExpired(expiresAt, marginSec, nowSec = Math.floor(Date.now() / 1e3)) {
  return expiresAt - nowSec <= marginSec;
}

// src/net/session.ts
import { randomBytes } from "node:crypto";
import { mkdir, open, readFile, rename, rm, stat, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
function configDir() {
  const xdg = process.env.XDG_CONFIG_HOME;
  const base = xdg && xdg.trim() ? xdg : join(homedir(), ".config");
  return join(base, "surprise-fm");
}
function sessionPath() {
  return process.env.SURPRISE_SESSION_PATH ?? join(configDir(), "session.json");
}
function lockPath() {
  return `${sessionPath()}.lock`;
}
function isSession(value) {
  if (!value || typeof value !== "object") return false;
  const v = value;
  return typeof v.access_token === "string" && v.access_token.length > 0 && typeof v.refresh_token === "string" && v.refresh_token.length > 0 && typeof v.expires_at === "number" && Number.isFinite(v.expires_at) && typeof v.user_id === "string";
}
async function readSession() {
  try {
    const raw = await readFile(sessionPath(), "utf8");
    const parsed = JSON.parse(raw);
    return isSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
async function writeSession(session) {
  const target = sessionPath();
  await mkdir(dirname(target), { recursive: true, mode: 448 });
  const tmp = `${target}.${process.pid}.${randomBytes(4).toString("hex")}.tmp`;
  try {
    await writeFile(tmp, JSON.stringify(session, null, 2), { encoding: "utf8", mode: 384 });
    await rename(tmp, target);
  } catch (error) {
    await rm(tmp, { force: true }).catch(() => {
    });
    throw error;
  }
}
async function clearSession() {
  await rm(sessionPath(), { force: true });
}
var LOCK_STALE_MS = 3e4;
var LOCK_POLL_MS = 50;
async function breakStaleLock(path) {
  try {
    const info = await stat(path);
    if (Date.now() - info.mtimeMs > LOCK_STALE_MS) await unlink(path);
  } catch {
  }
}
async function withSessionLock(fn, timeoutMs = 5e3) {
  const path = lockPath();
  await mkdir(dirname(path), { recursive: true, mode: 448 });
  const deadline = Date.now() + timeoutMs;
  let held = false;
  while (Date.now() < deadline) {
    try {
      const handle = await open(path, "wx", 384);
      await handle.writeFile(String(process.pid));
      await handle.close();
      held = true;
      break;
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      await breakStaleLock(path);
      await new Promise((resolve) => setTimeout(resolve, LOCK_POLL_MS));
    }
  }
  try {
    return await fn();
  } finally {
    if (held) await rm(path, { force: true }).catch(() => {
    });
  }
}

// src/net/auth.ts
var REFRESH_MARGIN_SEC = 120;
function toSession(tokens) {
  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAtFromToken(tokens.access_token),
    user_id: parseJwt(tokens.access_token).sub ?? ""
  };
}
var TelegramUnavailableError = class extends Error {
  constructor() {
    super("\u0412\u0445\u043E\u0434 \u0447\u0435\u0440\u0435\u0437 Telegram \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u2014 \u0432\u043E\u0439\u0434\u0438\u0442\u0435 \u043F\u043E \u043F\u043E\u0447\u0442\u0435: surprise login --email");
    this.name = "TelegramUnavailableError";
  }
};
async function startTelegramLogin() {
  const data = await callFunction("telegram-login-start", {
    mode: "login",
    platform: PLATFORM_HINT
  });
  if (data.method !== "bot" || !data.nonce || !data.poll_secret || !data.url) {
    throw new TelegramUnavailableError();
  }
  return {
    nonce: data.nonce,
    pollSecret: data.poll_secret,
    url: data.url,
    expiresAt: Math.floor(Date.now() / 1e3) + (data.expires_in ?? 300)
  };
}
async function pollTelegramLogin(pending) {
  let data;
  try {
    data = await callFunction(
      "telegram-login-poll",
      { nonce: pending.nonce, poll_secret: pending.pollSecret },
      { retries: 0 }
    );
  } catch (error) {
    if (error instanceof NetworkError) return { status: "pending" };
    if (error instanceof ApiError) {
      const body = error.body;
      if (body?.status === "failed") return { status: "failed", error: body.error ?? error.message };
      return { status: "failed", error: error.message };
    }
    throw error;
  }
  if (data.status === "ok" && data.session) {
    return { status: "ok", session: toSession(data.session), isNew: data.is_new === true };
  }
  if (data.status === "expired") return { status: "expired" };
  if (data.status === "failed") return { status: "failed", error: data.error ?? "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0432\u043E\u0439\u0442\u0438" };
  return { status: "pending" };
}
async function waitForTelegramLogin(pending, options = {}) {
  let delayMs = 1500;
  for (; ; ) {
    if (options.signal?.aborted) return { status: "failed", error: "\u0412\u0445\u043E\u0434 \u043E\u0442\u043C\u0435\u043D\u0451\u043D" };
    const secondsLeft = pending.expiresAt - Math.floor(Date.now() / 1e3);
    if (secondsLeft <= 0) return { status: "expired" };
    options.onTick?.(secondsLeft);
    const result = await pollTelegramLogin(pending);
    if (result.status !== "pending") {
      if (result.status === "ok") await persist(result.session);
      return result;
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    delayMs = Math.min(delayMs + 500, 4e3);
  }
}
async function loginWithPassword(email, password) {
  const data = await request(authUrl("token?grant_type=password"), {
    method: "POST",
    headers: anonHeaders(),
    body: { email, password },
    retries: 0
  });
  if (!data?.access_token || !data.refresh_token) {
    throw new Error("\u0421\u0435\u0440\u0432\u0435\u0440 \u043D\u0435 \u0432\u0435\u0440\u043D\u0443\u043B \u0442\u043E\u043A\u0435\u043D\u044B \u2014 \u043F\u043E\u043F\u0440\u043E\u0431\u0443\u0439\u0442\u0435 \u0435\u0449\u0451 \u0440\u0430\u0437");
  }
  const session = toSession({ access_token: data.access_token, refresh_token: data.refresh_token });
  await persist(session);
  return session;
}
async function persist(session) {
  await withSessionLock(() => writeSession(session));
}
var refreshInFlight = null;
function refreshOnce(stale) {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = withSessionLock(async () => {
    const current = await readSession() ?? stale;
    if (!isExpired(current.expires_at, REFRESH_MARGIN_SEC)) return current;
    try {
      const data = await request(authUrl("token?grant_type=refresh_token"), {
        method: "POST",
        headers: anonHeaders(),
        body: { refresh_token: current.refresh_token },
        retries: 0
      });
      if (!data?.access_token || !data.refresh_token) {
        await clearSession();
        return null;
      }
      const next = toSession({ access_token: data.access_token, refresh_token: data.refresh_token });
      await writeSession(next);
      return next;
    } catch (error) {
      if (error instanceof ApiError) {
        await clearSession();
        return null;
      }
      return current;
    }
  }).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}
async function getValidSession() {
  const session = await readSession();
  if (!session) return null;
  if (!isExpired(session.expires_at, REFRESH_MARGIN_SEC)) return session;
  return refreshOnce(session);
}
async function logout() {
  const session = await readSession();
  await withSessionLock(() => clearSession());
  if (!session) return;
  await request(authUrl("logout"), {
    method: "POST",
    headers: { ...anonHeaders(), Authorization: `Bearer ${session.access_token}` },
    retries: 0
  }).catch(() => {
  });
}

// src/ui/term.ts
var import_qrcode = __toESM(require_lib(), 1);
import { spawn } from "node:child_process";
import { createInterface } from "node:readline/promises";
var colorEnabled = () => process.stdout.isTTY === true && !process.env.NO_COLOR && process.env.TERM !== "dumb";
var wrap = (open2, close) => (text) => colorEnabled() ? `\x1B[${open2}m${text}\x1B[${close}m` : text;
var bold = wrap("1", "22");
var dim = wrap("2", "22");
var red = wrap("31", "39");
var green = wrap("32", "39");
var yellow = wrap("33", "39");
var cyan = wrap("36", "39");
function terminalWidth() {
  return process.stdout.columns ?? 80;
}
function visibleWidth(line) {
  return [...line.replace(/\u001B\[[0-9;]*m/g, "")].length;
}
async function renderQr(text) {
  let rendered;
  try {
    rendered = await import_qrcode.default.toString(text, { type: "terminal", small: true, margin: 1 });
  } catch {
    return null;
  }
  const widest = rendered.split("\n").reduce((max, line) => Math.max(max, visibleWidth(line)), 0);
  return widest > terminalWidth() ? null : rendered.replace(/\n+$/, "");
}
function openUrl(url) {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "start" : "xdg-open";
  try {
    const child = spawn(command, [url], { stdio: "ignore", detached: true });
    child.on("error", () => {
    });
    child.unref();
  } catch {
  }
}
function isInteractive() {
  return process.stdin.isTTY === true && process.stdout.isTTY === true;
}
async function promptLine(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    return (await rl.question(question)).trim();
  } finally {
    rl.close();
  }
}
async function promptHidden(question) {
  const { stdin, stdout } = process;
  stdout.write(question);
  const wasRaw = stdin.isRaw === true;
  if (stdin.isTTY) stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      stdin.removeListener("data", onData);
      if (stdin.isTTY) stdin.setRawMode(wasRaw);
      stdin.pause();
      stdout.write("\n");
    };
    const onData = (chunk2) => {
      for (const char of chunk2) {
        switch (char) {
          case "\r":
          case "\n":
            cleanup();
            resolve(value);
            return;
          case "":
            cleanup();
            reject(new Error("\u0412\u0432\u043E\u0434 \u043F\u0440\u0435\u0440\u0432\u0430\u043D"));
            return;
          case "\x7F":
          // Backspace
          case "\b":
            value = value.slice(0, -1);
            break;
          default:
            if (char >= " ") value += char;
        }
      }
    };
    stdin.on("data", onData);
  });
}

// src/commands/library.ts
var SECTIONS = ["playlists", "likes", "finds", "saved", "following"];
var SECTION_TITLES = {
  playlists: "\u041F\u043B\u0435\u0439\u043B\u0438\u0441\u0442\u044B",
  likes: "\u041B\u0430\u0439\u043A\u0438",
  finds: "\u041D\u0430\u0445\u043E\u0434\u043A\u0438",
  saved: "\u0421\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u043E\u0435",
  following: "\u041F\u043E\u0434\u043F\u0438\u0441\u043A\u0438"
};
function width() {
  return Math.max(40, Math.min(terminalWidth(), 100));
}
function playlistLabel(playlist) {
  const mark = playlist.is_system ? dim(" (\u0441\u0438\u0441\u0442\u0435\u043C\u043D\u044B\u0439)") : "";
  const visibility = playlist.is_public === false ? dim(" \xB7 \u043F\u0440\u0438\u0432\u0430\u0442\u043D\u044B\u0439") : "";
  return `${playlist.title}${mark}${visibility}`;
}
async function renderPlaylists(token, userId, asJson) {
  const playlists = await listPlaylists(token, userId);
  if (asJson) {
    process.stdout.write(`${JSON.stringify(playlists)}
`);
    return;
  }
  if (playlists.length === 0) {
    process.stdout.write(`${dim("\u041F\u043B\u0435\u0439\u043B\u0438\u0441\u0442\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.")}
`);
    return;
  }
  for (const playlist of playlists) {
    const count = dim(`${playlist.itemCount}`);
    process.stdout.write(`  ${count.padStart(4)}  ${truncate(playlistLabel(playlist), width() - 10)}
`);
  }
}
async function renderLikes(token, userId, asJson) {
  const shows = await listLikedShows(token, userId);
  if (asJson) {
    process.stdout.write(`${JSON.stringify(shows)}
`);
    return;
  }
  if (shows.length === 0) {
    process.stdout.write(`${dim("\u041B\u0430\u0439\u043A\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.")}
`);
    return;
  }
  for (const show of shows) {
    const artists = show.artists.join(", ");
    const label = artists ? `${show.title ?? "\u0411\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F"} \u2014 ${artists}` : show.title ?? "\u0411\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F";
    const time = dim(formatDuration(show.duration));
    process.stdout.write(`  ${truncate(label, width() - 12).padEnd(width() - 12)} ${time}
`);
  }
}
async function renderFinds(token, userId, asJson) {
  const finds = await listFinds(token, userId);
  if (asJson) {
    process.stdout.write(`${JSON.stringify(finds)}
`);
    return;
  }
  if (finds.length === 0) {
    process.stdout.write(`${dim("\u041D\u0430\u0445\u043E\u0434\u043E\u043A \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.")}
`);
    return;
  }
  for (const find of finds) {
    const label = [find.artist, find.title].filter(Boolean).join(" \u2014 ") || "\u043D\u0435\u043E\u043F\u043E\u0437\u043D\u0430\u043D\u043D\u044B\u0439 \u0442\u0440\u0435\u043A";
    process.stdout.write(`  ${truncate(label, width() - 24)}
`);
    const where = find.show?.title ?? "";
    if (where) {
      process.stdout.write(`       ${dim(`${formatDuration(find.timestampSec)} \xB7 ${truncate(where, width() - 20)}`)}
`);
    }
  }
}
async function renderSaved(token, userId, asJson) {
  const saves = await listSaves(token, userId);
  const showIds = saves.filter((save) => save.entityType === "show").map((save) => save.entityId);
  const shows = await resolveSavedShows(token, showIds);
  if (asJson) {
    process.stdout.write(
      `${JSON.stringify(
        saves.map((save) => ({ ...save, title: shows.get(save.entityId)?.title ?? null }))
      )}
`
    );
    return;
  }
  if (saves.length === 0) {
    process.stdout.write(`${dim("\u0421\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u043E\u0433\u043E \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.")}
`);
    return;
  }
  const byType = /* @__PURE__ */ new Map();
  for (const save of saves) byType.set(save.entityType, (byType.get(save.entityType) ?? 0) + 1);
  for (const save of saves) {
    if (save.entityType !== "show") continue;
    const show = shows.get(save.entityId);
    if (!show) continue;
    process.stdout.write(`  ${truncate(show.title ?? "\u0411\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F", width() - 6)}
`);
  }
  const others = [...byType.entries()].filter(([type]) => type !== "show");
  if (others.length > 0) {
    const summary = others.map(([type, count]) => `${type}: ${count}`).join(", ");
    process.stdout.write(`  ${dim(`\u0435\u0449\u0451 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u043E \u2014 ${summary}`)}
`);
  }
}
async function renderFollowing(token, userId, asJson) {
  const subscriptions = await listSubscriptions(token, userId);
  const names = await resolveSubscriptionNames(token, subscriptions);
  if (asJson) {
    process.stdout.write(
      `${JSON.stringify(
        subscriptions.map((subscription) => ({
          ...subscription,
          name: names.get(subscription.entityId) ?? null
        }))
      )}
`
    );
    return;
  }
  if (subscriptions.length === 0) {
    process.stdout.write(`${dim("\u041F\u043E\u0434\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.")}
`);
    return;
  }
  for (const subscription of subscriptions) {
    const name = names.get(subscription.entityId);
    if (!name) continue;
    const pending = subscription.status === "pending" ? yellow(" (\u043E\u0436\u0438\u0434\u0430\u0435\u0442 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F)") : "";
    process.stdout.write(`  ${dim(subscription.entityType.padEnd(7))} ${truncate(name, width() - 24)}${pending}
`);
  }
}
async function libraryCommand(argv) {
  const asJson = argv.includes("--json");
  const requested = argv.find((arg) => !arg.startsWith("--"));
  if (requested && !SECTIONS.includes(requested)) {
    process.stderr.write(`${red("\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u044B\u0439 \u0440\u0430\u0437\u0434\u0435\u043B:")} ${requested}
  ${SECTIONS.join(", ")}
`);
    return 1;
  }
  const session = await getValidSession();
  if (!session) {
    process.stderr.write(`${red("\u041D\u0443\u0436\u0435\u043D \u0432\u0445\u043E\u0434:")} surprise login
`);
    return 1;
  }
  const { access_token: token, user_id: userId } = session;
  const sections = requested ? [requested] : SECTIONS;
  for (const section of sections) {
    if (!asJson && sections.length > 1) process.stdout.write(`
${bold(SECTION_TITLES[section])}
`);
    else if (!asJson) process.stdout.write(`${bold(SECTION_TITLES[section])}
`);
    try {
      switch (section) {
        case "playlists":
          await renderPlaylists(token, userId, asJson);
          break;
        case "likes":
          await renderLikes(token, userId, asJson);
          break;
        case "finds":
          await renderFinds(token, userId, asJson);
          break;
        case "saved":
          await renderSaved(token, userId, asJson);
          break;
        case "following":
          await renderFollowing(token, userId, asJson);
          break;
      }
    } catch (error) {
      process.stderr.write(`${red(`\u0420\u0430\u0437\u0434\u0435\u043B \xAB${SECTION_TITLES[section]}\xBB \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u043B\u0441\u044F:`)} ${error.message}
`);
    }
  }
  if (!asJson) process.stdout.write(`
${dim("\u0418\u0433\u0440\u0430\u0442\u044C: surprise play <\u0441\u0441\u044B\u043B\u043A\u0430|\u0437\u0430\u043F\u0440\u043E\u0441>")}
`);
  return 0;
}
async function playlistCommand(argv) {
  const asJson = argv.includes("--json");
  const query = argv.filter((arg) => !arg.startsWith("--")).join(" ").trim();
  const session = await getValidSession();
  if (!session) {
    process.stderr.write(`${red("\u041D\u0443\u0436\u0435\u043D \u0432\u0445\u043E\u0434:")} surprise login
`);
    return 1;
  }
  const playlists = await listPlaylists(session.access_token, session.user_id);
  if (playlists.length === 0) {
    process.stdout.write(`${dim("\u041F\u043B\u0435\u0439\u043B\u0438\u0441\u0442\u043E\u0432 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442.")}
`);
    return 0;
  }
  const lowered = query.toLowerCase();
  const playlist = query ? playlists.find((candidate) => candidate.id === query || candidate.title.toLowerCase().includes(lowered)) : playlists[0];
  if (!playlist) {
    process.stderr.write(`${red("\u041F\u043B\u0435\u0439\u043B\u0438\u0441\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D:")} ${query}
`);
    return 1;
  }
  const entries = await listPlaylistItems(session.access_token, playlist.id);
  if (asJson) {
    process.stdout.write(`${JSON.stringify({ playlist, items: entries })}
`);
    return 0;
  }
  process.stdout.write(`${bold(playlist.title)} ${dim(`\xB7 ${entries.length}`)}
`);
  for (const [index, entry] of entries.entries()) {
    const number = dim(String(index + 1).padStart(3));
    const kind = entry.kind === "show" ? cyan("\u0432\u044B\u043F\u0443\u0441\u043A") : cyan("\u0442\u0440\u0435\u043A  ");
    const label = entry.subtitle ? `${entry.title} \u2014 ${entry.subtitle}` : entry.title;
    const time = dim(formatDuration(entry.durationSec));
    process.stdout.write(`${number} ${kind} ${truncate(label, width() - 24).padEnd(width() - 24)} ${time}
`);
  }
  return 0;
}

// src/api/profile.ts
async function fetchProfile(accessToken, userId) {
  const params = new URLSearchParams({
    select: "id,username,display_name,telegram_username,avatar_url",
    id: `eq.${userId}`,
    limit: "1"
  });
  const rows = await request(restUrl(`profiles?${params}`), {
    headers: authHeaders(accessToken)
  });
  return rows?.[0] ?? null;
}
async function isSupporter(accessToken, userId) {
  const params = new URLSearchParams({
    select: "id,current_period_end",
    user_id: `eq.${userId}`,
    status: "in.(active,trialing)",
    current_period_end: `gt.${(/* @__PURE__ */ new Date()).toISOString()}`,
    order: "current_period_end.desc",
    limit: "1"
  });
  try {
    const rows = await request(restUrl(`supporter_subscriptions?${params}`), {
      headers: authHeaders(accessToken)
    });
    return (rows?.length ?? 0) > 0;
  } catch {
    return false;
  }
}
function profileLabel(profile, userId) {
  if (!profile) return userId;
  if (profile.username) return `@${profile.username}`;
  if (profile.display_name) return profile.display_name;
  if (profile.telegram_username) return `@${profile.telegram_username}`;
  return userId;
}

// src/commands/login.ts
async function announce(accessToken, userId) {
  const profile = await fetchProfile(accessToken, userId).catch(() => null);
  const supporter = await isSupporter(accessToken, userId);
  const badge = supporter ? ` ${green("supporter")}` : "";
  process.stdout.write(`${green("\u2713")} \u0412\u043E\u0448\u043B\u0438 \u043A\u0430\u043A ${bold(profileLabel(profile, userId))}${badge}
`);
}
async function loginByEmail() {
  if (!isInteractive()) {
    process.stderr.write(`${red("\u0412\u0445\u043E\u0434 \u043F\u043E \u043F\u043E\u0447\u0442\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442 \u0438\u043D\u0442\u0435\u0440\u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0433\u043E \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B\u0430.")}
`);
    return 1;
  }
  const email = await promptLine("\u041F\u043E\u0447\u0442\u0430: ");
  if (!email) {
    process.stderr.write(`${red("\u041F\u043E\u0447\u0442\u0430 \u043D\u0435 \u0432\u0432\u0435\u0434\u0435\u043D\u0430.")}
`);
    return 1;
  }
  const password = await promptHidden("\u041F\u0430\u0440\u043E\u043B\u044C: ");
  if (!password) {
    process.stderr.write(`${red("\u041F\u0430\u0440\u043E\u043B\u044C \u043D\u0435 \u0432\u0432\u0435\u0434\u0451\u043D.")}
`);
    return 1;
  }
  try {
    const session = await loginWithPassword(email, password);
    await announce(session.access_token, session.user_id);
    return 0;
  } catch (error) {
    process.stderr.write(`${red("\u041D\u0435 \u0432\u043E\u0448\u043B\u0438:")} ${error.message}
`);
    return 1;
  }
}
async function loginByTelegram(autoOpen) {
  let pending;
  try {
    pending = await startTelegramLogin();
  } catch (error) {
    if (error instanceof TelegramUnavailableError) {
      process.stderr.write(`${yellow("!")} ${error.message}
`);
      return 2;
    }
    process.stderr.write(`${red("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043D\u0430\u0447\u0430\u0442\u044C \u0432\u0445\u043E\u0434:")} ${error.message}
`);
    return 1;
  }
  process.stdout.write(`
${bold("\u0412\u0445\u043E\u0434 \u0447\u0435\u0440\u0435\u0437 Telegram")}
`);
  const qr = await renderQr(pending.url);
  if (qr) process.stdout.write(`${qr}
`);
  process.stdout.write(`${dim("\u041E\u0442\u0441\u043A\u0430\u043D\u0438\u0440\u0443\u0439\u0442\u0435 QR \u0438\u043B\u0438 \u043E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 \u0441\u0441\u044B\u043B\u043A\u0443:")}
  ${cyan(pending.url)}
`);
  process.stdout.write(`${dim("\u0417\u0430\u0442\u0435\u043C \u043D\u0430\u0436\u043C\u0438\u0442\u0435 Start \u0443 \u0431\u043E\u0442\u0430. \u0416\u0434\u0451\u043C \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F\u2026")}

`);
  if (autoOpen) openUrl(pending.url);
  const result = await waitForTelegramLogin(pending);
  switch (result.status) {
    case "ok":
      await announce(result.session.access_token, result.session.user_id);
      return 0;
    case "expired":
      process.stderr.write(`${yellow("!")} \u0412\u0440\u0435\u043C\u044F \u043D\u0430 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u0432\u044B\u0448\u043B\u043E. \u0417\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u0435 \u0432\u0445\u043E\u0434 \u0437\u0430\u043D\u043E\u0432\u043E.
`);
      return 1;
    default:
      process.stderr.write(`${red("\u041D\u0435 \u0432\u043E\u0448\u043B\u0438:")} ${result.error}
`);
      return 1;
  }
}
async function loginCommand(argv) {
  const existing = await getValidSession();
  if (existing && !argv.includes("--force")) {
    await announce(existing.access_token, existing.user_id);
    process.stdout.write(`${dim("\u0423\u0436\u0435 \u0432 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0435. \u0421\u043C\u0435\u043D\u0438\u0442\u044C \u2014 surprise login --force")}
`);
    return 0;
  }
  if (argv.includes("--email")) return loginByEmail();
  const autoOpen = !argv.includes("--no-open") && isInteractive();
  const code = await loginByTelegram(autoOpen);
  if (code === 2) {
    process.stdout.write(`${dim("\u0417\u0430\u043F\u0430\u0441\u043D\u043E\u0439 \u0432\u0445\u043E\u0434:")} surprise login --email
`);
    return 1;
  }
  return code;
}

// src/api/shows.ts
var SHOW_SELECT = "id,public_id,slug,title,description,cover_url,duration,status,published_at,tracklist_disabled,show_artists(artists(id,name,slug))";
function toShow(row) {
  const artists = (row.show_artists ?? []).map((link) => link.artists).filter((artist) => artist !== null);
  const { show_artists: _ignored, ...rest } = row;
  return { ...rest, artists };
}
function headers(accessToken) {
  return accessToken ? authHeaders(accessToken) : anonHeaders();
}
async function findShow(param, accessToken = null) {
  const filter = param.isNumeric ? `public_id=eq.${param.publicId}` : `slug=eq.${encodeURIComponent(param.slug ?? "")}`;
  const rows = await request(restUrl(`shows_v2?select=${encodeURIComponent(SHOW_SELECT)}&${filter}&limit=1`), {
    headers: headers(accessToken)
  });
  const row = rows?.[0];
  if (!row) return null;
  if (isHiddenFromSite(row.status)) return null;
  return toShow(row);
}
async function searchShows(query, limit = 12, accessToken = null) {
  const pattern = `%${query}%`;
  const auth = headers(accessToken);
  const byTitle = new URLSearchParams({
    select: SHOW_SELECT,
    title: `ilike.${pattern}`,
    order: "published_at.desc.nullslast",
    limit: String(limit)
  });
  byTitle.append("status", `not.in.${ARCHIVED_FILTER}`);
  const byArtist = new URLSearchParams({
    select: `show:show_id(${SHOW_SELECT}),artists:artist_id!inner(name)`,
    "artists.name": `ilike.${pattern}`,
    limit: String(limit)
  });
  const [titleRows, artistRows] = await Promise.all([
    request(restUrl(`shows_v2?${byTitle}`), { headers: auth }).catch(() => []),
    request(restUrl(`show_artists?${byArtist}`), { headers: auth }).catch(() => [])
  ]);
  const found = /* @__PURE__ */ new Map();
  for (const row of titleRows ?? []) found.set(row.id, toShow(row));
  for (const link of artistRows ?? []) {
    const row = link.show;
    if (!row || found.has(row.id) || isHiddenFromSite(row.status)) continue;
    found.set(row.id, toShow(row));
  }
  return [...found.values()].sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? "")).slice(0, limit);
}
function fetchShowStream(showId, accessToken = null) {
  return callFunction("show-stream", { show_id: showId }, { accessToken });
}
async function fetchTracklist(show, accessToken = null) {
  if (show.tracklist_disabled) return [];
  const params = new URLSearchParams({
    select: "id,position,timestamp_sec,end_timestamp_sec,artist,title,is_identified",
    show_id: `eq.${show.id}`,
    order: "timestamp_sec.asc.nullslast,position.asc"
  });
  const rows = await request(restUrl(`show_tracklist?${params}`), {
    headers: headers(accessToken)
  });
  return rows ?? [];
}
function currentTrackIndex(items, positionSec) {
  if (positionSec === null || items.length === 0) return -1;
  let found = -1;
  for (const [index, item] of items.entries()) {
    const start = item.timestamp_sec;
    if (start === null || start > positionSec) break;
    found = index;
  }
  return found;
}

// src/lib/previewWindow.ts
var PREVIEW_FALLBACK_SEC = 30;
var PREVIEW_START_RATIO = 0.25;
var positiveInt = (value) => {
  const n = typeof value === "number" && Number.isFinite(value) ? Math.floor(value) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
};
function previewWindow(track) {
  const total = positiveInt(track.duration);
  const wanted = positiveInt(track.preview_duration_sec) ?? PREVIEW_FALLBACK_SEC;
  if (total === null) return { startSec: 0, durationSec: wanted, endSec: wanted };
  if (total <= wanted) return { startSec: 0, durationSec: total, endSec: total };
  const explicit = positiveInt(track.preview_start_sec);
  const desired = explicit ?? Math.floor(total * PREVIEW_START_RATIO);
  const startSec = Math.max(0, Math.min(desired, total - wanted));
  return { startSec, durationSec: wanted, endSec: startSec + wanted };
}

// src/api/store.ts
var TRACK_SELECT = "id,title,artist_name,duration,position,release_id,preview_start_sec,preview_duration_sec,releases(title)";
function toTrack(row) {
  const { releases, ...rest } = row;
  return { ...rest, releaseTitle: releases?.title ?? null };
}
async function fetchTrack(trackId, accessToken = null) {
  const params = new URLSearchParams({ select: TRACK_SELECT, id: `eq.${trackId}`, limit: "1" });
  const rows = await request(restUrl(`store_tracks?${params}`), {
    headers: accessToken ? authHeaders(accessToken) : anonHeaders()
  });
  const row = rows?.[0];
  return row ? toTrack(row) : null;
}
async function listReleaseTracks(releaseId, accessToken = null) {
  const params = new URLSearchParams({
    select: TRACK_SELECT,
    release_id: `eq.${releaseId}`,
    order: "position.asc.nullslast"
  });
  const rows = await request(restUrl(`store_tracks?${params}`), {
    headers: accessToken ? authHeaders(accessToken) : anonHeaders()
  });
  return (rows ?? []).map(toTrack);
}
var RERESOLVE_AFTER_SEC = 600;
function needsReresolve(access, nowSec = Math.floor(Date.now() / 1e3)) {
  return nowSec - access.issuedAt >= RERESOLVE_AFTER_SEC;
}
function explainDenial(reason, fallback) {
  switch (reason) {
    case "limit_reached":
      return "\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0435 \u043F\u0440\u043E\u0441\u043B\u0443\u0448\u0438\u0432\u0430\u043D\u0438\u044F \u044D\u0442\u043E\u0433\u043E \u0442\u0440\u0435\u043A\u0430 \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u043B\u0438\u0441\u044C. \u041F\u043E\u043B\u043D\u044B\u0439 \u0442\u0440\u0435\u043A \u2014 \u043F\u043E \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0435 \u0438\u043B\u0438 \u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u043A\u0443\u043F\u043A\u0438.";
    case "not_released":
      return "\u0420\u0435\u043B\u0438\u0437 \u0435\u0449\u0451 \u043D\u0435 \u0432\u044B\u0448\u0435\u043B.";
    case "no_owner":
    case "track_not_found":
      return "\u0422\u0440\u0435\u043A \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u0438\u043B\u0438 \u0441\u043D\u044F\u0442 \u0441 \u043F\u0440\u043E\u0434\u0430\u0436\u0438.";
    default:
      return fallback;
  }
}
var TrackAccessDeniedError = class extends Error {
  reason;
  constructor(reason, fallback) {
    super(explainDenial(reason, fallback));
    this.name = "TrackAccessDeniedError";
    this.reason = reason;
  }
};
async function resolveTrackAccess(track, listenerId, accessToken) {
  const issuedAt = Math.floor(Date.now() / 1e3);
  try {
    const data = await callFunction(
      "store-stream",
      { track_id: track.id, session_id: listenerId },
      { accessToken, retries: 0 }
    );
    if (data.url) {
      return {
        kind: data.free_listen === true ? "free_listen" : "full",
        url: data.url,
        isHls: data.hls === true,
        playsLeft: typeof data.plays_left === "number" ? data.plays_left : null,
        issuedAt,
        window: null
      };
    }
    throw new TrackAccessDeniedError(data.reason, data.error ?? "\u0414\u043E\u0441\u0442\u0443\u043F \u043A \u0442\u0440\u0435\u043A\u0443 \u043D\u0435 \u0432\u044B\u0434\u0430\u043D");
  } catch (error) {
    if (error instanceof TrackAccessDeniedError) throw error;
    if (error instanceof ApiError && error.status === 403) {
      const body = error.body ?? {};
      const denial = new TrackAccessDeniedError(body.reason, body.error ?? error.message);
      const preview = await fetchPreviewUrls([track.id], accessToken).catch(() => /* @__PURE__ */ new Map());
      const url = preview.get(track.id);
      if (!url) throw denial;
      return {
        kind: "preview",
        url,
        isHls: false,
        playsLeft: typeof body.plays_left === "number" ? body.plays_left : 0,
        issuedAt,
        window: previewWindow(track)
      };
    }
    throw error;
  }
}
async function fetchPreviewUrls(trackIds, accessToken) {
  const urls = /* @__PURE__ */ new Map();
  if (trackIds.length === 0) return urls;
  for (const part of chunk(trackIds, 50)) {
    const data = await callFunction(
      "preview-stream",
      { track_ids: part },
      { accessToken, retries: 1 }
    );
    for (const [id, url] of Object.entries(data.urls ?? {})) urls.set(id, url);
  }
  return urls;
}

// src/lib/publicId.ts
function parseEntityParam(param) {
  const isNumeric = !!param && /^\d+$/.test(param);
  return {
    isNumeric,
    publicId: isNumeric ? Number(param) : null,
    slug: isNumeric ? null : param ?? null
  };
}
var ROUTES = [
  { prefixes: ["episodes"], kind: "show" },
  { prefixes: ["release", "releases"], kind: "release" },
  { prefixes: ["artist"], kind: "artist" },
  { prefixes: ["author"], kind: "author" },
  { prefixes: ["playlist"], kind: "playlist" },
  { prefixes: ["lists"], kind: "list" },
  { prefixes: ["shows"], kind: "program" }
];
function parseSurpriseLink(input) {
  const trimmed = input.trim();
  if (!trimmed) return null;
  let url;
  try {
    url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./i, "").toLowerCase();
  if (host !== "surprise.fm") return null;
  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;
  const path = segments[0] === "store" ? segments.slice(1) : segments;
  const [head, tail] = path;
  if (!head || !tail) return null;
  if (head === "track") return { kind: "track", param: parseEntityParam(tail) };
  const route = ROUTES.find((candidate) => candidate.prefixes.includes(head));
  return route ? { kind: route.kind, param: parseEntityParam(tail) } : null;
}

// src/player/detect.ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";

// src/player/ffplay.ts
import { spawn as spawn2 } from "node:child_process";

// src/player/backend.ts
import { EventEmitter } from "node:events";
var BackendEmitter = class extends EventEmitter {
  on(event, listener) {
    return super.on(event, listener);
  }
  fire(event, ...args) {
    if (event === "error" && this.listenerCount("error") === 0) return;
    super.emit(event, ...args);
  }
};
var BackendUnavailableError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "BackendUnavailableError";
  }
};
var VOLUME_MIN = 0;
var VOLUME_MAX = 130;
function clampVolume(percent) {
  if (!Number.isFinite(percent)) return 100;
  return Math.min(VOLUME_MAX, Math.max(VOLUME_MIN, Math.round(percent)));
}

// src/player/failure.ts
function describeFailure(stderrTail, binary) {
  const text = stderrTail.trim();
  if (/ALSA|snd_|pipewire|pw\.conf|No such (audio )?device|Could not open|audio device|AO: \[/i.test(text)) {
    return `${binary} \u043D\u0435 \u0441\u043C\u043E\u0433 \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0437\u0432\u0443\u043A\u043E\u0432\u043E\u0435 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u043E \u2014 \u0438\u0433\u0440\u0430\u0442\u044C \u043D\u0435\u043A\u0443\u0434\u0430. \u041F\u043E\u0445\u043E\u0436\u0435, \u0432 \u0441\u0438\u0441\u0442\u0435\u043C\u0435 \u043D\u0435\u0442 \u0437\u0432\u0443\u043A\u043E\u0432\u043E\u0439 \u043A\u0430\u0440\u0442\u044B (\u0447\u0430\u0441\u0442\u044B\u0439 \u0441\u043B\u0443\u0447\u0430\u0439 \u0434\u043B\u044F \u043A\u043E\u043D\u0442\u0435\u0439\u043D\u0435\u0440\u0430 \u0438 SSH-\u0441\u0435\u0441\u0441\u0438\u0438).`;
  }
  if (/\b403\b/.test(text)) return "\u0421\u0435\u0440\u0432\u0435\u0440 \u043E\u0442\u043A\u0430\u0437\u0430\u043B \u0432 \u0434\u043E\u0441\u0442\u0443\u043F\u0435 \u043A \u0444\u0430\u0439\u043B\u0443 (403).";
  if (/\b404\b/.test(text)) return "\u0424\u0430\u0439\u043B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D \u043D\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435 (404).";
  if (/Invalid data|moov atom|Header missing|not found/i.test(text)) return "\u0424\u0430\u0439\u043B \u043F\u043E\u0432\u0440\u0435\u0436\u0434\u0451\u043D \u0438\u043B\u0438 \u044D\u0442\u043E \u043D\u0435 \u0430\u0443\u0434\u0438\u043E.";
  const lastLine = text.split("\n").map((line) => line.trim()).filter(Boolean).pop();
  return lastLine ? `${binary}: ${lastLine}` : `${binary} \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0441\u044F \u0441\u0440\u0430\u0437\u0443, \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043F\u0440\u043E\u0438\u0433\u0440\u0430\u0432.`;
}
var PLAYBACK_WATCHDOG_MS = 8e3;

// src/player/ffplay.ts
var TOO_FAST_MS = 1500;
var FfplayBackend = class extends BackendEmitter {
  name = "ffplay";
  canSeek = true;
  canSetVolume = false;
  positionIsExact = false;
  #child = null;
  #url = null;
  #volume = 100;
  #paused = false;
  /** Секунда, с которой стартовал текущий процесс. */
  #offsetSec = 0;
  /** Момент старта процесса по часам. */
  #startedAt = 0;
  /** Сколько суммарно простояли на паузе. */
  #pausedTotalMs = 0;
  #pausedAt = 0;
  #ticker = null;
  /** Свой перезапуск (перемотка) — не повод сообщать «доиграл» или «упал». */
  #restarting = false;
  /**
   * Имя бинаря отдельным полем, а не parameter property: Node снимает типы
   * «в лоб» и на `constructor(private x)` падает с ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX.
   * esbuild такое переваривает, поэтому сборка проходила, а `node --test` — нет.
   */
  #binary;
  constructor(binary = process.env.SURPRISE_FFPLAY ?? "ffplay") {
    super();
    this.#binary = binary;
  }
  status() {
    return {
      positionSec: this.#child ? this.#position() : null,
      // Длительность знает только декодер, а канала к нему нет. null честнее
      // выдуманного числа: интерфейс нарисует время без общей шкалы.
      durationSec: null,
      paused: this.#paused,
      idle: this.#child === null
    };
  }
  #position() {
    const pausedMs = this.#pausedTotalMs + (this.#paused ? Date.now() - this.#pausedAt : 0);
    return this.#offsetSec + Math.max(0, (Date.now() - this.#startedAt - pausedMs) / 1e3);
  }
  async start() {
  }
  async load(url, options = {}) {
    this.#url = url;
    await this.#spawnAt(options.startSec ?? 0);
  }
  async #spawnAt(startSec) {
    const url = this.#url;
    if (!url) throw new Error("\u043D\u0435\u0447\u0435\u0433\u043E \u0438\u0433\u0440\u0430\u0442\u044C");
    await this.#kill();
    const args = [
      "-nodisp",
      "-autoexit",
      "-loglevel",
      "error",
      "-volume",
      String(clampVolume(this.#volume))
    ];
    if (startSec > 0) args.push("-ss", String(Math.floor(startSec)));
    args.push(url);
    const child = spawn2(this.#binary, args, { stdio: ["ignore", "ignore", "pipe"] });
    this.#child = child;
    let stderrTail = "";
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (text) => {
      stderrTail = (stderrTail + text).slice(-2e3);
    });
    this.#offsetSec = startSec;
    this.#startedAt = Date.now();
    this.#pausedTotalMs = 0;
    this.#pausedAt = 0;
    this.#paused = false;
    child.on("error", (error) => {
      const wrapped = error.code === "ENOENT" ? new BackendUnavailableError(`\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D ${this.#binary}`) : error;
      this.fire("error", wrapped);
    });
    child.on("exit", (code, signal) => {
      const playedMs = Date.now() - this.#startedAt;
      this.#child = null;
      this.#stopTicker();
      if (this.#restarting) return;
      if (code === 0 && playedMs < TOO_FAST_MS) {
        this.fire("error", new Error(describeFailure(stderrTail, this.#binary)));
        this.fire("exit", { code, signal });
        return;
      }
      if (code === 0) this.fire("ended");
      else this.fire("exit", { code, signal });
    });
    this.#startTicker();
  }
  /**
   * ffplay не сообщает позицию — шлём её сами раз в секунду, чтобы у интерфейса
   * был один и тот же источник событий для обоих бэкендов.
   */
  #startTicker() {
    this.#stopTicker();
    this.#ticker = setInterval(() => {
      if (!this.#paused) this.fire("status", this.status());
    }, 1e3);
    this.#ticker.unref?.();
  }
  #stopTicker() {
    if (this.#ticker) clearInterval(this.#ticker);
    this.#ticker = null;
  }
  async #kill() {
    const child = this.#child;
    if (!child) return;
    this.#restarting = true;
    try {
      if (this.#paused) child.kill("SIGCONT");
      child.kill("SIGTERM");
      await new Promise((resolve) => {
        const timer = setTimeout(() => {
          child.kill("SIGKILL");
          resolve();
        }, 800);
        child.once("exit", () => {
          clearTimeout(timer);
          resolve();
        });
      });
    } finally {
      this.#restarting = false;
      this.#child = null;
      this.#stopTicker();
    }
  }
  async setPaused(paused) {
    const child = this.#child;
    if (!child || paused === this.#paused) return;
    child.kill(paused ? "SIGSTOP" : "SIGCONT");
    if (paused) {
      this.#pausedAt = Date.now();
    } else {
      this.#pausedTotalMs += Date.now() - this.#pausedAt;
      this.#pausedAt = 0;
    }
    this.#paused = paused;
    this.fire("status", this.status());
  }
  async seek(seconds, mode) {
    const target = mode === "absolute" ? seconds : this.#position() + seconds;
    await this.#spawnAt(Math.max(0, target));
  }
  async setVolume(percent) {
    this.#volume = clampVolume(percent);
  }
  async stop() {
    await this.#kill();
    this.#url = null;
  }
};

// src/player/mpv.ts
import { spawn as spawn3 } from "node:child_process";
import { connect } from "node:net";
import { mkdtemp, rm as rm2 } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join as join2 } from "node:path";
var CONNECT_TIMEOUT_MS = 5e3;
var COMMAND_TIMEOUT_MS = 5e3;
var OBSERVED = ["time-pos", "duration", "pause", "core-idle"];
var MpvBackend = class extends BackendEmitter {
  name = "mpv";
  canSeek = true;
  canSetVolume = true;
  positionIsExact = true;
  #child = null;
  #socket = null;
  #socketDir = null;
  #buffer = "";
  #nextRequestId = 1;
  #pending = /* @__PURE__ */ new Map();
  #stopping = false;
  #state = { positionSec: null, durationSec: null, paused: false, idle: true };
  /** Хвост stderr: mpv объясняет отказ только туда, а сам при этом не падает. */
  #stderrTail = "";
  /** Сторож запуска — см. комментарий в #armWatchdog. */
  #watchdog = null;
  /**
   * Первая позиция после загрузки — точка отсчёта для сторожа.
   *
   * Проверять «позиция появилась» недостаточно: mpv присылает time-pos = 0 сразу
   * при открытии файла, ещё до того, как что-то зазвучало. На этом нуле сторож
   * снимался, а часы потом так и не шли — ровно тот случай, который он должен
   * был поймать. Признак настоящего воспроизведения — что позиция СДВИНУЛАСЬ.
   */
  #firstPosition = null;
  #positionMoved = false;
  /**
   * Имя бинаря отдельным полем, а не parameter property: Node снимает типы
   * «в лоб» и на `constructor(private x)` падает с ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX.
   * esbuild такое переваривает, поэтому сборка проходила, а `node --test` — нет.
   */
  #binary;
  constructor(binary = process.env.SURPRISE_MPV ?? "mpv") {
    super();
    this.#binary = binary;
  }
  status() {
    return { ...this.#state };
  }
  async start() {
    if (this.#child) return;
    this.#socketDir = await mkdtemp(join2(tmpdir(), "surprise-mpv-"));
    const socketPath = process.platform === "win32" ? `\\\\.\\pipe\\surprise-mpv-${process.pid}` : join2(this.#socketDir, "ipc.sock");
    const child = spawn3(
      this.#binary,
      [
        "--idle=yes",
        "--no-video",
        "--no-terminal",
        // Конфиг пользователя может содержать что угодно — вплоть до
        // видеовыхода и своих привязок клавиш. Нам нужен предсказуемый плеер.
        "--no-config",
        "--audio-display=no",
        // Поток icecast рвётся на ровном месте: без этого одна сетевая икота
        // заканчивала бы эфир навсегда.
        "--stream-lavf-o=reconnect=1,reconnect_streamed=1,reconnect_delay_max=5",
        `--input-ipc-server=${socketPath}`
      ],
      // stderr в трубу, а не в никуда: без него причина отказа теряется целиком.
      { stdio: ["ignore", "ignore", "pipe"] }
    );
    child.stderr?.setEncoding("utf8");
    child.stderr?.on("data", (text) => {
      this.#stderrTail = (this.#stderrTail + text).slice(-4e3);
    });
    this.#child = child;
    child.on("error", (error) => {
      const wrapped = error.code === "ENOENT" ? new BackendUnavailableError(`\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D ${this.#binary}`) : error;
      this.fire("error", wrapped);
    });
    child.on("exit", (code, signal) => {
      this.#child = null;
      this.#state = { positionSec: null, durationSec: null, paused: false, idle: true };
      this.#rejectAllPending(new Error("mpv \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0441\u044F"));
      if (!this.#stopping) this.fire("exit", { code, signal });
    });
    await this.#connect(socketPath);
    for (const [index, property] of OBSERVED.entries()) {
      await this.#command(["observe_property", index + 1, property]).catch(() => {
      });
    }
  }
  /**
   * Сокет появляется не в момент спавна, а когда mpv дойдёт до его создания —
   * поэтому подключаемся с повторами, а не один раз.
   */
  async #connect(socketPath) {
    const deadline = Date.now() + CONNECT_TIMEOUT_MS;
    for (; ; ) {
      if (!this.#child) throw new BackendUnavailableError(`${this.#binary} \u043D\u0435 \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u043B\u0441\u044F`);
      try {
        this.#socket = await new Promise((resolve, reject) => {
          const socket2 = connect(socketPath);
          socket2.once("connect", () => resolve(socket2));
          socket2.once("error", reject);
        });
        break;
      } catch {
        if (Date.now() > deadline) {
          throw new BackendUnavailableError(
            `\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C\u0441\u044F \u043A ${this.#binary} \u0437\u0430 ${CONNECT_TIMEOUT_MS / 1e3} \u0441`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, 60));
      }
    }
    const socket = this.#socket;
    if (!socket) throw new BackendUnavailableError("\u0441\u043E\u043A\u0435\u0442 mpv \u043D\u0435 \u043E\u0442\u043A\u0440\u044B\u043B\u0441\u044F");
    socket.setEncoding("utf8");
    socket.on("data", (chunk2) => this.#ingest(chunk2));
    socket.on("error", () => {
    });
  }
  /**
   * Разбор входящего потока.
   *
   * Сообщения разделены переводом строки, но чанк может оборваться на середине
   * JSON — поэтому копим хвост, а не парсим каждый чанк целиком.
   */
  #ingest(chunk2) {
    this.#buffer += chunk2;
    let index = this.#buffer.indexOf("\n");
    while (index !== -1) {
      const line = this.#buffer.slice(0, index).trim();
      this.#buffer = this.#buffer.slice(index + 1);
      if (line) this.#handleMessage(line);
      index = this.#buffer.indexOf("\n");
    }
  }
  #handleMessage(line) {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      return;
    }
    if (typeof message.request_id === "number") {
      const pending = this.#pending.get(message.request_id);
      if (pending) {
        this.#pending.delete(message.request_id);
        clearTimeout(pending.timer);
        if (message.error === "success") pending.resolve(message.data);
        else pending.reject(new Error(String(message.error ?? "\u043E\u0448\u0438\u0431\u043A\u0430 mpv")));
      }
      return;
    }
    if (message.event === "property-change") this.#applyProperty(String(message.name), message.data);
    else if (message.event === "end-file") this.#handleEndFile(String(message.reason ?? ""));
  }
  #applyProperty(name, value) {
    const numeric = typeof value === "number" && Number.isFinite(value) ? value : null;
    switch (name) {
      case "time-pos":
        if (numeric !== null) {
          if (this.#firstPosition === null) this.#firstPosition = numeric;
          else if (numeric !== this.#firstPosition) {
            this.#positionMoved = true;
            this.#disarmWatchdog();
          }
        }
        this.#state.positionSec = numeric;
        break;
      case "duration":
        this.#state.durationSec = numeric && numeric > 0 ? numeric : null;
        break;
      case "pause":
        this.#state.paused = value === true;
        break;
      case "core-idle":
        this.#state.idle = value === true;
        break;
      default:
        return;
    }
    this.fire("status", this.status());
  }
  #handleEndFile(reason) {
    if (reason === "eof") this.fire("ended");
  }
  #rejectAllPending(error) {
    for (const [, pending] of this.#pending) {
      clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.#pending.clear();
  }
  #command(args) {
    const socket = this.#socket;
    if (!socket || socket.destroyed) return Promise.reject(new Error("mpv \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D"));
    const requestId = this.#nextRequestId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(requestId);
        reject(new Error(`mpv \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B \u043D\u0430 ${String(args[0])}`));
      }, COMMAND_TIMEOUT_MS);
      this.#pending.set(requestId, { resolve, reject, timer });
      socket.write(`${JSON.stringify({ command: args, request_id: requestId })}
`);
    });
  }
  async load(url, options = {}) {
    await this.start();
    this.#state = { positionSec: null, durationSec: null, paused: false, idle: false };
    const startSec = options.startSec && options.startSec > 0 ? options.startSec : null;
    const args = ["loadfile", url, "replace"];
    if (startSec) args.push({ start: String(Math.floor(startSec)) });
    await this.#command(args);
    this.#armWatchdog();
  }
  /**
   * Сторож запуска воспроизведения.
   *
   * mpv без звукового устройства файл ОТКРЫВАЕТ — кодек определяется, дорожка
   * выбирается, процесс живёт, — но часы не запускает: time-pos остаётся
   * «property unavailable» навсегда. Ни падения, ни сообщения; строка состояния
   * вечно висит на `--:--`, и с точки зрения человека плеер просто не работает,
   * не объясняя почему. Поймано на машине без звуковой карты.
   *
   * Поэтому: не пришло ни одной позиции за отведённое время — говорим, в чём
   * дело, разобрав stderr.
   */
  #armWatchdog() {
    this.#disarmWatchdog();
    this.#firstPosition = null;
    this.#positionMoved = false;
    this.#watchdog = setTimeout(() => {
      if (this.#positionMoved || !this.#child) return;
      this.fire("error", new Error(describeFailure(this.#stderrTail, this.#binary)));
      this.fire("exit", { code: null, signal: null });
    }, Number(process.env.SURPRISE_MPV_WATCHDOG_MS) || PLAYBACK_WATCHDOG_MS);
    this.#watchdog.unref?.();
  }
  #disarmWatchdog() {
    if (this.#watchdog) clearTimeout(this.#watchdog);
    this.#watchdog = null;
  }
  async setPaused(paused) {
    await this.#command(["set_property", "pause", paused]);
    this.#state.paused = paused;
    this.fire("status", this.status());
  }
  async seek(seconds, mode) {
    await this.#command(["seek", seconds, mode]);
  }
  async setVolume(percent) {
    await this.#command(["set_property", "volume", clampVolume(percent)]);
  }
  async stop() {
    this.#stopping = true;
    this.#disarmWatchdog();
    const child = this.#child;
    try {
      await this.#command(["quit"]).catch(() => {
      });
    } finally {
      this.#socket?.destroy();
      this.#socket = null;
      if (child && child.exitCode === null) {
        await new Promise((resolve) => {
          const timer = setTimeout(() => {
            child.kill("SIGKILL");
            resolve();
          }, 1e3);
          child.once("exit", () => {
            clearTimeout(timer);
            resolve();
          });
        });
      }
      if (this.#socketDir) await rm2(this.#socketDir, { recursive: true, force: true }).catch(() => {
      });
      this.#socketDir = null;
      this.#child = null;
      this.#stopping = false;
    }
  }
};

// src/player/detect.ts
var run = promisify(execFile);
var VERSION_FLAG = { ffplay: "-version", ffmpeg: "-version" };
function versionFlag(binary) {
  const name = binary.replace(/\.exe$/i, "").split(/[\\/]/).pop() ?? binary;
  return VERSION_FLAG[name] ?? "--version";
}
async function isAvailable(binary) {
  try {
    await run(binary, [versionFlag(binary)], { timeout: 4e3 });
    return true;
  } catch {
    return false;
  }
}
function installHint() {
  switch (process.platform) {
    case "darwin":
      return "brew install mpv";
    case "win32":
      return "winget install mpv";
    default:
      return "apt install mpv  (\u0438\u043B\u0438 dnf/pacman \u2014 \u043F\u0430\u043A\u0435\u0442 \u043D\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0442\u0430\u043A \u0436\u0435)";
  }
}
var NoAudioBackendError = class extends Error {
  constructor() {
    super(
      `\u041D\u0435 \u043D\u0430\u0448\u043B\u0438, \u0447\u0435\u043C \u0438\u0433\u0440\u0430\u0442\u044C \u0437\u0432\u0443\u043A. \u041F\u043E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 mpv:
  ${installHint()}
\u041F\u043E\u0434\u043E\u0439\u0434\u0451\u0442 \u0438 ffplay \u0438\u0437 \u043F\u0430\u043A\u0435\u0442\u0430 ffmpeg, \u043D\u043E \u0441 \u043D\u0438\u043C \u043D\u0435 \u0431\u0443\u0434\u0435\u0442 \u043F\u043B\u0430\u0432\u043D\u043E\u0439 \u043F\u0435\u0440\u0435\u043C\u043E\u0442\u043A\u0438 \u0438 \u0440\u0435\u0433\u0443\u043B\u0438\u0440\u043E\u0432\u043A\u0438 \u0433\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u0438.`
    );
    this.name = "NoAudioBackendError";
  }
};
async function pickBackend(preferred) {
  const mpvBinary = process.env.SURPRISE_MPV ?? "mpv";
  const ffplayBinary = process.env.SURPRISE_FFPLAY ?? "ffplay";
  if (preferred !== "ffplay" && await isAvailable(mpvBinary)) {
    return { backend: new MpvBackend(mpvBinary), name: "mpv", degraded: false };
  }
  if (await isAvailable(ffplayBinary)) {
    return { backend: new FfplayBackend(ffplayBinary), name: "ffplay", degraded: true };
  }
  throw new NoAudioBackendError();
}

// src/api/plays.ts
var FREE_LISTEN_THRESHOLD_SEC = 30;
var ANALYTICS_THRESHOLD_MS = 1e4;
var ANALYTICS_DEDUPE_MS = 30 * 60 * 1e3;
var PlayDeduper = class {
  #seen = /* @__PURE__ */ new Map();
  #windowMs;
  constructor(windowMs = ANALYTICS_DEDUPE_MS) {
    this.#windowMs = windowMs;
  }
  /** Можно ли засчитать сейчас. Отмечает как засчитанное, если да. */
  claim(entityType, entityId, now = Date.now()) {
    const key = `${entityType}:${entityId}`;
    const last = this.#seen.get(key);
    if (last !== void 0 && now - last < this.#windowMs) return false;
    this.#seen.set(key, now);
    return true;
  }
  reset() {
    this.#seen.clear();
  }
};
async function recordPlayEvent(entityType, entityId, sessionId, durationMs, accessToken) {
  await request(restUrl("rpc/record_play"), {
    method: "POST",
    headers: accessToken ? authHeaders(accessToken) : anonHeaders(),
    body: {
      p_entity_type: entityType,
      p_entity_id: entityId,
      p_session_id: sessionId,
      p_duration_ms: Math.max(0, Math.round(durationMs)),
      p_context: { device: "cli", os: process.platform }
    },
    retries: 0,
    timeoutMs: 8e3
  }).catch(() => {
  });
}
async function recordTrackStart(trackId, releaseId, sessionId, accessToken) {
  await callFunction(
    "record-play",
    { track_id: trackId, release_id: releaseId, session_id: sessionId },
    { accessToken, retries: 0 }
  ).catch(() => {
  });
}
async function recordFreeListen(trackId, releaseId, sessionId, listenerId, listenedSec, accessToken) {
  const response = await callFunction(
    "record-play",
    {
      track_id: trackId,
      release_id: releaseId,
      session_id: sessionId,
      listener_id: listenerId,
      duration_listened: Math.round(listenedSec),
      free_listen: true
    },
    { accessToken, retries: 0 }
  ).catch(() => null);
  return typeof response?.plays_left === "number" ? response.plays_left : null;
}
var ListenCounter = class {
  #accumulatedMs = 0;
  #since = null;
  start(now = Date.now()) {
    if (this.#since === null) this.#since = now;
  }
  pause(now = Date.now()) {
    if (this.#since === null) return;
    this.#accumulatedMs += now - this.#since;
    this.#since = null;
  }
  listenedMs(now = Date.now()) {
    return this.#accumulatedMs + (this.#since === null ? 0 : now - this.#since);
  }
  listenedSec(now = Date.now()) {
    return this.listenedMs(now) / 1e3;
  }
  reset() {
    this.#accumulatedMs = 0;
    this.#since = null;
  }
};

// src/lib/ids.ts
import { randomUUID } from "node:crypto";
import { mkdir as mkdir2, readFile as readFile2, writeFile as writeFile2 } from "node:fs/promises";
import { dirname as dirname2, join as join3 } from "node:path";
function listenerIdPath() {
  return process.env.SURPRISE_LISTENER_ID_PATH ?? join3(configDir(), "listener-id");
}
var cachedListenerId = null;
async function getListenerId() {
  if (cachedListenerId) return cachedListenerId;
  const path = listenerIdPath();
  try {
    const stored = (await readFile2(path, "utf8")).trim();
    if (stored) {
      cachedListenerId = stored;
      return stored;
    }
  } catch {
  }
  const created = randomUUID();
  try {
    await mkdir2(dirname2(path), { recursive: true, mode: 448 });
    await writeFile2(path, created, { encoding: "utf8", mode: 384 });
  } catch {
  }
  cachedListenerId = created;
  return created;
}
var SESSION_ID = randomUUID();
function getSessionId() {
  return SESSION_ID;
}

// src/ui/playback.ts
var STATUS_INTERVAL_MS = 1e3;
function startPlayback(options) {
  const { backend } = options;
  let stopping = false;
  let statusLineOpen = false;
  const timers = [];
  const clearStatusLine = () => {
    if (!statusLineOpen) return;
    process.stdout.write(`\r${" ".repeat(Math.max(0, terminalWidth() - 1))}\r`);
    statusLineOpen = false;
  };
  const say = (text) => {
    clearStatusLine();
    process.stdout.write(`${text}
`);
  };
  const redraw = () => {
    if (stopping || !process.stdout.isTTY) return;
    const state = backend.status();
    const { position, total } = options.progress?.() ?? {
      position: state.positionSec,
      total: state.durationSec
    };
    const width2 = terminalWidth();
    process.stdout.write(`\r${" ".repeat(Math.max(0, width2 - 1))}\r${options.render(state, position, total, width2)}`);
    statusLineOpen = true;
  };
  let resolveDone = () => {
  };
  const done = new Promise((resolve) => {
    resolveDone = resolve;
  });
  const finish = (code) => {
    if (stopping) return;
    stopping = true;
    void (async () => {
      for (const timer of timers) clearInterval(timer);
      clearStatusLine();
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
      process.stdin.pause();
      await backend.stop().catch(() => {
      });
      await options.cleanup?.().catch(() => {
      });
      resolveDone(code);
    })();
  };
  backend.on("error", (error) => say(`${red("\u041F\u043B\u0435\u0435\u0440:")} ${error.message}`));
  backend.on("exit", ({ code }) => {
    say(`${red("\u041F\u043B\u0435\u0435\u0440 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0441\u044F")}${code === null ? "" : ` (\u043A\u043E\u0434 ${code})`}.`);
    finish(1);
  });
  backend.on("ended", () => {
    if (options.onEnded) options.onEnded();
    else finish(0);
  });
  timers.push(setInterval(redraw, STATUS_INTERVAL_MS));
  if (options.hint) say(dim(options.hint));
  process.on("SIGINT", () => finish(0));
  process.on("SIGTERM", () => finish(0));
  if (isInteractive()) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (key) => {
      if (options.keys?.onKey?.(key)) return;
      switch (key) {
        case " ":
          void backend.setPaused(!backend.status().paused).then(redraw);
          break;
        case "q":
        case "":
          finish(0);
          break;
        default:
          break;
      }
    });
  }
  return { say, redraw, finish, done };
}
function stateMark(state) {
  if (state.paused) return yellow("\u23F8");
  if (state.idle) return dim("\u2026");
  return green("\u25B6");
}

// src/commands/track.ts
function trackLabel(track) {
  const artist = track.artist_name?.trim();
  const title = track.title?.trim() || "\u0411\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F";
  return artist ? `${artist} \u2014 ${title}` : title;
}
function accessNote(access) {
  switch (access.kind) {
    case "full":
      return green("\u043F\u043E\u043B\u043D\u044B\u0439 \u0442\u0440\u0435\u043A");
    case "free_listen":
      return access.playsLeft === null ? yellow("\u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E\u0435 \u043F\u0440\u043E\u0441\u043B\u0443\u0448\u0438\u0432\u0430\u043D\u0438\u0435") : yellow(`\u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E\u0435 \u043F\u0440\u043E\u0441\u043B\u0443\u0448\u0438\u0432\u0430\u043D\u0438\u0435, \u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C ${access.playsLeft}`);
    case "preview":
      return dim(`\u043F\u0440\u0435\u0432\u044C\u044E ${access.window ? `${access.window.durationSec} \u0441` : ""}`.trim());
  }
}
async function playTrack(track, accessToken) {
  const listenerId = await getListenerId();
  const sessionId = getSessionId();
  let access;
  try {
    access = await resolveTrackAccess(track, listenerId, accessToken);
  } catch (error) {
    if (error instanceof TrackAccessDeniedError) {
      process.stderr.write(`${red("\u041D\u0435\u043B\u044C\u0437\u044F \u043F\u043E\u0441\u043B\u0443\u0448\u0430\u0442\u044C:")} ${error.message}
`);
      if (!accessToken) process.stderr.write(`${dim("\u0412\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u043F\u043E\u043C\u043E\u0436\u0435\u0442 \u0432\u0445\u043E\u0434: surprise login")}
`);
      return 1;
    }
    process.stderr.write(`${red("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u043B\u0443\u0447\u0438\u0442\u044C \u0434\u043E\u0441\u0442\u0443\u043F:")} ${error.message}
`);
    return 1;
  }
  let choice;
  try {
    choice = await pickBackend();
  } catch (error) {
    if (error instanceof NoAudioBackendError) {
      process.stderr.write(`${red(error.message)}
`);
      return 1;
    }
    throw error;
  }
  const { backend, name, degraded } = choice;
  const counter = new ListenCounter();
  const deduper = new PlayDeduper();
  let freeListenCounted = false;
  let analyticsCounted = false;
  const playback = startPlayback({
    backend,
    describe: () => trackLabel(track),
    hint: backend.canSeek ? "space \u2014 \u043F\u0430\u0443\u0437\u0430, \u2190/\u2192 \u2014 10 \u0441\u0435\u043A\u0443\u043D\u0434, q \u2014 \u0432\u044B\u0445\u043E\u0434" : "space \u2014 \u043F\u0430\u0443\u0437\u0430, q \u2014 \u0432\u044B\u0445\u043E\u0434",
    cleanup: async () => {
      counter.pause();
      process.stdout.write("\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E.\n");
    },
    keys: {
      onKey: (key) => {
        if (!backend.canSeek || access.kind === "preview") return false;
        if (key === "\x1B[C") {
          void backend.seek(10, "relative");
          return true;
        }
        if (key === "\x1B[D") {
          void backend.seek(-10, "relative");
          return true;
        }
        return false;
      }
    },
    render: (state, position, total, width2) => {
      const window = access.window;
      const shownPosition = window && position !== null ? Math.max(0, position - window.startSec) : position;
      const shownTotal = window ? window.durationSec : total ?? track.duration ?? null;
      const clock = `${formatDuration(shownPosition)} / ${formatDuration(shownTotal)}`;
      const bar = progressBar(shownPosition, shownTotal, Math.max(0, Math.min(24, width2 - 48)));
      const head = truncate(trackLabel(track), Math.max(10, width2 - clock.length - bar.length - 8));
      return `${stateMark(state)} ${bold(head)} ${bar ? `${dim(bar)} ` : ""}${dim(clock)}`;
    }
  });
  try {
    await backend.start();
    await backend.load(access.url, { startSec: access.window?.startSec });
  } catch (error) {
    playback.say(`${red("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C:")} ${error.message}`);
    playback.finish(1);
    return playback.done;
  }
  counter.start();
  playback.say(`${cyan("\u266A")} ${bold(trackLabel(track))} ${accessNote(access)}`);
  if (track.releaseTitle) playback.say(dim(`  ${track.releaseTitle}`));
  if (degraded) playback.say(`${yellow("!")} \u0418\u0433\u0440\u0430\u0435\u043C \u0447\u0435\u0440\u0435\u0437 ${name}: \u043F\u0435\u0440\u0435\u043C\u043E\u0442\u043A\u0430 \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442 \u043F\u043E\u0442\u043E\u043A.`);
  if (track.release_id) void recordTrackStart(track.id, track.release_id, sessionId, accessToken);
  const tick = setInterval(() => {
    const state = backend.status();
    if (state.paused) {
      counter.pause();
      return;
    }
    counter.start();
    const position = state.positionSec;
    const window = access.window;
    if (window && position !== null && position >= window.endSec) {
      playback.say(dim("\u041A\u043E\u043D\u0435\u0446 \u043F\u0440\u0435\u0432\u044C\u044E. \u041F\u043E\u043B\u043D\u044B\u0439 \u0442\u0440\u0435\u043A \u2014 \u043F\u043E \u043F\u043E\u0434\u043F\u0438\u0441\u043A\u0435 \u0438\u043B\u0438 \u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u043A\u0443\u043F\u043A\u0438."));
      playback.finish(0);
      return;
    }
    if (!analyticsCounted && counter.listenedMs() >= ANALYTICS_THRESHOLD_MS) {
      analyticsCounted = true;
      if (deduper.claim("store_track", track.id)) {
        void recordPlayEvent("store_track", track.id, sessionId, counter.listenedMs(), accessToken);
      }
    }
    if (!freeListenCounted && access.kind === "free_listen" && track.release_id && counter.listenedSec() >= FREE_LISTEN_THRESHOLD_SEC) {
      freeListenCounted = true;
      const releaseId = track.release_id;
      void recordFreeListen(
        track.id,
        releaseId,
        sessionId,
        listenerId,
        counter.listenedSec(),
        accessToken
      ).then((playsLeft) => {
        if (playsLeft !== null) playback.say(dim(`\u0411\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u044B\u0445 \u043F\u0440\u043E\u0441\u043B\u0443\u0448\u0438\u0432\u0430\u043D\u0438\u0439 \u043E\u0441\u0442\u0430\u043B\u043E\u0441\u044C: ${playsLeft}`));
      });
    }
  }, 1e3);
  tick.unref?.();
  backend.on("status", (state) => {
    if (state.paused || !needsReresolve(access)) return;
    void (async () => {
      try {
        const fresh = await resolveTrackAccess(track, listenerId, accessToken);
        const position = backend.status().positionSec ?? access.window?.startSec ?? 0;
        access = fresh;
        await backend.load(fresh.url, { startSec: position });
      } catch {
      }
    })();
  });
  return playback.done;
}

// src/commands/play.ts
function showTitle(show) {
  const artists = show.artists.map((artist) => artist.name).join(", ");
  const title = show.title ?? "\u0411\u0435\u0437 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F";
  if (!artists) return title;
  return title.toLowerCase().includes(artists.toLowerCase()) ? title : `${title} \u2014 ${artists}`;
}
function trackLine(item) {
  const artist = item.artist?.trim();
  const title = item.title?.trim();
  const label = [artist, title].filter(Boolean).join(" \u2014 ");
  return label || "\u043D\u0435\u043E\u043F\u043E\u0437\u043D\u0430\u043D\u043D\u044B\u0439 \u0442\u0440\u0435\u043A";
}
async function resolveShow(input, accessToken) {
  const link = parseSurpriseLink(input);
  if (link) {
    if (link.kind !== "show") {
      process.stderr.write(`${yellow("!")} \u041F\u043E\u043A\u0430 \u0443\u043C\u0435\u0435\u043C \u0438\u0433\u0440\u0430\u0442\u044C \u0442\u043E\u043B\u044C\u043A\u043E \u0432\u044B\u043F\u0443\u0441\u043A\u0438. \u0421\u0441\u044B\u043B\u043A\u0430 \u0432\u0435\u0434\u0451\u0442 \u043D\u0430 \u0434\u0440\u0443\u0433\u043E\u0435 (${link.kind}).
`);
      return null;
    }
    return findShow(link.param, accessToken);
  }
  const found = await searchShows(input, 8, accessToken);
  if (found.length === 0) return null;
  const first = found[0];
  if (!first) return null;
  if (found.length > 1) {
    process.stdout.write(`${dim(`\u041D\u0430\u0448\u043B\u0438 ${found.length}, \u0438\u0433\u0440\u0430\u0435\u043C \u043F\u0435\u0440\u0432\u044B\u0439:`)}
`);
    for (const [index, show] of found.slice(0, 5).entries()) {
      const mark = index === 0 ? cyan("\u25B8") : " ";
      process.stdout.write(`${mark} ${truncate(showTitle(show), 70)}
`);
    }
  }
  return first;
}
async function playCommand(argv) {
  const asJson = argv.includes("--json");
  const query = argv.filter((arg) => !arg.startsWith("--")).join(" ").trim();
  if (!query) {
    process.stderr.write(`${red("\u0427\u0442\u043E \u0438\u0433\u0440\u0430\u0442\u044C?")} \u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: surprise play https://surprise.fm/episodes/837393
`);
    return 1;
  }
  const session = await getValidSession();
  const accessToken = session?.access_token ?? null;
  const link = parseSurpriseLink(query);
  if (link?.kind === "track") {
    const trackId = link.param.slug ?? "";
    const track = trackId ? await fetchTrack(trackId, accessToken) : null;
    if (!track) {
      process.stderr.write(`${red("\u0422\u0440\u0435\u043A \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D:")} ${query}
`);
      return 1;
    }
    return playTrack(track, accessToken);
  }
  if (link?.kind === "release") {
    const releaseId = link.param.slug ?? "";
    const tracks = releaseId ? await listReleaseTracks(releaseId, accessToken) : [];
    const first = tracks[0];
    if (!first) {
      process.stderr.write(`${red("\u0423 \u0440\u0435\u043B\u0438\u0437\u0430 \u043D\u0435\u0442 \u0442\u0440\u0435\u043A\u043E\u0432 \u0438\u043B\u0438 \u043E\u043D \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D:")} ${query}
`);
      return 1;
    }
    if (tracks.length > 1) process.stdout.write(`${dim(`\u0412 \u0440\u0435\u043B\u0438\u0437\u0435 ${tracks.length} \u0442\u0440\u0435\u043A\u043E\u0432, \u0438\u0433\u0440\u0430\u0435\u043C \u043F\u0435\u0440\u0432\u044B\u0439.`)}
`);
    return playTrack(first, accessToken);
  }
  const show = await resolveShow(query, accessToken);
  if (!show) {
    process.stderr.write(`${red("\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u043D\u0430\u0448\u043B\u0438:")} ${query}
`);
    return 1;
  }
  const stream = await fetchShowStream(show.id, accessToken).catch(() => null);
  if (!stream?.audio_url) {
    process.stderr.write(`${red("\u0423 \u0432\u044B\u043F\u0443\u0441\u043A\u0430 \u043D\u0435\u0442 \u0430\u0443\u0434\u0438\u043E:")} ${showTitle(show)}
`);
    return 1;
  }
  if (asJson) {
    process.stdout.write(
      `${JSON.stringify({
        id: show.id,
        public_id: show.public_id,
        slug: show.slug,
        title: show.title,
        artists: show.artists.map((artist) => artist.name),
        duration: show.duration,
        audio_url: stream.audio_url
      })}
`
    );
    return 0;
  }
  let choice;
  try {
    choice = await pickBackend();
  } catch (error) {
    if (error instanceof NoAudioBackendError) {
      process.stderr.write(`${red(error.message)}
`);
      return 1;
    }
    throw error;
  }
  const { backend, name, degraded } = choice;
  const tracklist = await fetchTracklist(show, accessToken).catch(() => []);
  let announcedTrack = -1;
  const playback = startPlayback({
    backend,
    describe: () => showTitle(show),
    cleanup: async () => {
      process.stdout.write("\u041E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E.\n");
    },
    hint: backend.canSeek ? "space \u2014 \u043F\u0430\u0443\u0437\u0430, \u2190/\u2192 \u2014 30 \u0441\u0435\u043A\u0443\u043D\u0434, \u2191/\u2193 \u2014 5 \u043C\u0438\u043D\u0443\u0442, q \u2014 \u0432\u044B\u0445\u043E\u0434" : "space \u2014 \u043F\u0430\u0443\u0437\u0430, q \u2014 \u0432\u044B\u0445\u043E\u0434",
    keys: {
      onKey: (key) => {
        if (!backend.canSeek) return false;
        switch (key) {
          case "\x1B[C":
            void backend.seek(30, "relative");
            return true;
          case "\x1B[D":
            void backend.seek(-30, "relative");
            return true;
          case "\x1B[A":
            void backend.seek(300, "relative");
            return true;
          case "\x1B[B":
            void backend.seek(-300, "relative");
            return true;
          default:
            return false;
        }
      }
    },
    render: (state, position, total, width2) => {
      const duration = total ?? show.duration ?? null;
      const clock = `${formatDuration(position)} / ${formatDuration(duration)}`;
      const bar = progressBar(position, duration, Math.max(0, Math.min(24, width2 - 48)));
      const head = truncate(showTitle(show), Math.max(10, width2 - clock.length - bar.length - 8));
      return `${stateMark(state)} ${bold(head)} ${bar ? `${dim(bar)} ` : ""}${dim(clock)}`;
    }
  });
  try {
    await backend.start();
    await backend.load(stream.audio_url);
  } catch (error) {
    playback.say(`${red("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C:")} ${error.message}`);
    playback.finish(1);
    return playback.done;
  }
  playback.say(`${cyan("\u266A")} ${bold(showTitle(show))}`);
  if (show.duration) playback.say(dim(`${formatDuration(show.duration)}  \xB7  ${tracklist.length} \u0442\u0440\u0435\u043A\u043E\u0432 \u0432 \u0442\u0440\u0435\u043A\u043B\u0438\u0441\u0442\u0435`));
  if (degraded) {
    playback.say(`${yellow("!")} \u0418\u0433\u0440\u0430\u0435\u043C \u0447\u0435\u0440\u0435\u0437 ${name}: \u043F\u0435\u0440\u0435\u043C\u043E\u0442\u043A\u0430 \u043F\u0435\u0440\u0435\u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442 \u043F\u043E\u0442\u043E\u043A, \u0433\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u044C \u043D\u0435 \u043C\u0435\u043D\u044F\u0435\u0442\u0441\u044F.`);
  }
  if (tracklist.length > 0) {
    const timer = setInterval(() => {
      const index = currentTrackIndex(tracklist, backend.status().positionSec);
      if (index < 0 || index === announcedTrack) return;
      announcedTrack = index;
      const item = tracklist[index];
      if (!item) return;
      playback.say(`  ${dim(formatDuration(item.timestamp_sec))} ${trackLine(item)}`);
    }, 2e3);
    timer.unref?.();
  }
  return playback.done;
}

// src/lib/backupStream.ts
function normalizeBackupMode(value) {
  return value === "on" || value === "off" ? value : "auto";
}
function resolveBackupActive(mode, hasCurrentEfir) {
  if (mode === "on") return true;
  if (mode === "off") return false;
  return hasCurrentEfir;
}
function resolveLiveStreamUrl(args) {
  return args.active ? args.backupUrl : args.primaryUrl;
}
function needsPlaylistResolve(url) {
  return url.endsWith(".m3u") || url.endsWith(".m3u8");
}
function firstEntryFromPlaylist(body) {
  for (const raw of body.split("\n")) {
    const line = raw.trim();
    if (line && !line.startsWith("#")) return line;
  }
  return null;
}
function forceHttps(url) {
  return url.replace(/^http:\/\//, "https://");
}

// src/api/radio.ts
async function fetchStationSettings() {
  const params = new URLSearchParams({
    select: "stream_url,backup_stream_url,backup_stream_mode,metadata_url",
    limit: "1"
  });
  try {
    const rows = await request(restUrl(`station_settings?${params}`), {
      headers: anonHeaders()
    });
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}
async function resolveLiveStream(settings) {
  const primary = settings?.stream_url || FALLBACK_STREAM;
  const backup = settings?.backup_stream_url || FALLBACK_STREAM;
  const mode = normalizeBackupMode(settings?.backup_stream_mode);
  const active = resolveBackupActive(mode, false);
  const chosen = forceHttps(resolveLiveStreamUrl({ active, primaryUrl: primary, backupUrl: backup }));
  if (!needsPlaylistResolve(chosen)) return chosen;
  try {
    const body = await request(chosen, { headers: {}, retries: 1 });
    const entry = typeof body === "string" ? firstEntryFromPlaylist(body) : null;
    return entry ? forceHttps(entry) : chosen;
  } catch {
    return chosen;
  }
}
function fetchRadioSchedule() {
  return callFunction("radio-schedule", {}, { timeoutMs: 1e4, retries: 1 });
}
var SCHEDULE_INTERVAL_MS = NOWPLAYING_INTERVAL_MS;
function showLabel(input) {
  const title = (input.title || "").trim();
  const artist = (input.artistName || "").trim();
  if (!artist) return title;
  if (!title) return artist;
  if (/\d{1,2}\.\d{1,2}\.\d{2,4}/.test(title)) return artist;
  const lowerTitle = title.toLowerCase();
  const lowerArtist = artist.toLowerCase();
  if (lowerTitle === lowerArtist) return artist;
  if (lowerTitle.includes(lowerArtist)) return title;
  return `${title} w/ ${artist}`;
}
function formatRadioItem(item) {
  if (!item) return "";
  const showArtists = (item.show?.artists || []).map((a) => a.trim()).filter(Boolean);
  const artist = showArtists.join(", ") || (item.artist || "").trim();
  const label = showLabel({ title: item.show?.title, artistName: artist });
  return label || (item.title || "").trim() || item.text || "";
}
function elapsedSec(item, nowSec = Math.floor(Date.now() / 1e3)) {
  if (!item?.played_at) return null;
  const elapsed = nowSec - item.played_at;
  if (!Number.isFinite(elapsed) || elapsed < 0) return 0;
  if (item.duration && elapsed > item.duration) return item.duration;
  return elapsed;
}
async function fetchLiveChannelId() {
  const params = new URLSearchParams({ select: "id", slug: "eq.live", limit: "1" });
  try {
    const rows = await request(restUrl(`radio_channels?${params}`), {
      headers: anonHeaders()
    });
    return rows?.[0]?.id ?? null;
  } catch {
    return null;
  }
}
function rpcUrl(name) {
  return restUrl(`rpc/${name}`);
}
function presenceContext() {
  return {
    device: "cli",
    os: process.platform,
    browser: "surprise-cli",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? ""
  };
}
async function sendHeartbeat(channelId, sessionId, accessToken) {
  await request(rpcUrl("radio_heartbeat"), {
    method: "POST",
    headers: accessToken ? authHeaders(accessToken) : anonHeaders(),
    body: { p_channel: channelId, p_session: sessionId, p_context: presenceContext() },
    retries: 0,
    timeoutMs: 8e3
  }).catch(() => {
  });
}
async function leavePresence(sessionId, accessToken) {
  await request(rpcUrl("radio_presence_leave"), {
    method: "POST",
    headers: accessToken ? authHeaders(accessToken) : anonHeaders(),
    body: { p_session: sessionId },
    retries: 0,
    timeoutMs: 4e3
  }).catch(() => {
  });
}

// src/commands/radio.ts
async function radioCommand(argv) {
  const asJson = argv.includes("--json");
  const settings = await fetchStationSettings();
  const streamUrl = await resolveLiveStream(settings);
  if (asJson) {
    const schedule = await fetchRadioSchedule().catch(() => null);
    process.stdout.write(
      `${JSON.stringify({
        stream_url: streamUrl,
        is_online: schedule?.is_online ?? null,
        now: schedule?.now ? { label: formatRadioItem(schedule.now), show: schedule.now.show } : null,
        next: schedule?.next ? { label: formatRadioItem(schedule.next) } : null
      })}
`
    );
    return 0;
  }
  let choice;
  try {
    choice = await pickBackend();
  } catch (error) {
    if (error instanceof NoAudioBackendError) {
      process.stderr.write(`${red(error.message)}
`);
      return 1;
    }
    throw error;
  }
  const { backend, name, degraded } = choice;
  const session = await getValidSession();
  const accessToken = session?.access_token ?? null;
  const sessionId = getSessionId();
  const channelId = await fetchLiveChannelId();
  let current = null;
  const playback = startPlayback({
    backend,
    describe: () => formatRadioItem(current) || "\u044D\u0444\u0438\u0440",
    hint: "space \u2014 \u043F\u0430\u0443\u0437\u0430, q \u2014 \u0432\u044B\u0445\u043E\u0434",
    cleanup: async () => {
      if (channelId) await leavePresence(sessionId, accessToken);
      process.stdout.write("\u042D\u0444\u0438\u0440 \u043E\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D.\n");
    },
    // Позиция берётся не у плеера, а из расписания: у бесконечного потока своей
    // позиции нет, а человеку интересно, сколько уже идёт текущий выпуск.
    progress: () => ({ position: elapsedSec(current), total: current?.duration ?? null }),
    render: (state, position, total, width2) => {
      const clock = total ? `${formatDuration(position)} / ${formatDuration(total)}` : formatDuration(position);
      const bar = progressBar(position, total, Math.max(0, Math.min(20, width2 - 46)));
      const head = truncate(formatRadioItem(current) || "\u044D\u0444\u0438\u0440", Math.max(10, width2 - clock.length - bar.length - 8));
      return `${stateMark(state)} ${bold(head)} ${bar ? `${dim(bar)} ` : ""}${dim(clock)}`;
    }
  });
  try {
    await backend.start();
    await backend.load(streamUrl);
  } catch (error) {
    playback.say(`${red("\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u043F\u0443\u0441\u0442\u0438\u0442\u044C \u043F\u043E\u0442\u043E\u043A:")} ${error.message}`);
    playback.finish(1);
    return playback.done;
  }
  playback.say(`${green("\u25B6")} ${bold("SURPRISE.FM")} ${dim(streamUrl)}`);
  if (degraded) {
    playback.say(`${yellow("!")} \u0418\u0433\u0440\u0430\u0435\u043C \u0447\u0435\u0440\u0435\u0437 ${name}: \u0431\u0435\u0437 \u043F\u043B\u0430\u0432\u043D\u043E\u0439 \u043F\u0435\u0440\u0435\u043C\u043E\u0442\u043A\u0438 \u0438 \u0440\u0435\u0433\u0443\u043B\u0438\u0440\u043E\u0432\u043A\u0438 \u0433\u0440\u043E\u043C\u043A\u043E\u0441\u0442\u0438.`);
  }
  const refreshSchedule = async () => {
    const schedule = await fetchRadioSchedule().catch(() => null);
    if (!schedule) return;
    const label = formatRadioItem(schedule.now);
    const previous = formatRadioItem(current);
    current = schedule.now;
    if (label && label !== previous) {
      playback.say(`${cyan("\u266A")} ${bold(label)}`);
      const description = schedule.now?.show?.description?.replace(/\s+/g, " ").trim();
      if (description) playback.say(`  ${dim(truncate(description, 76))}`);
    }
  };
  await refreshSchedule();
  const scheduleTimer = setInterval(() => void refreshSchedule(), SCHEDULE_INTERVAL_MS);
  scheduleTimer.unref?.();
  if (channelId) {
    await sendHeartbeat(channelId, sessionId, accessToken);
    const heartbeatTimer = setInterval(
      () => void sendHeartbeat(channelId, sessionId, accessToken),
      HEARTBEAT_INTERVAL_MS
    );
    heartbeatTimer.unref?.();
  }
  return playback.done;
}

// src/commands/session.ts
async function whoamiCommand(argv) {
  const asJson = argv.includes("--json");
  const session = await getValidSession();
  if (!session) {
    if (asJson) process.stdout.write(`${JSON.stringify({ authenticated: false })}
`);
    else process.stdout.write(`${dim("\u041D\u0435 \u0432 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0435.")} \u0412\u0445\u043E\u0434: surprise login
`);
    return 1;
  }
  const profile = await fetchProfile(session.access_token, session.user_id).catch(() => null);
  const supporter = await isSupporter(session.access_token, session.user_id);
  if (asJson) {
    process.stdout.write(
      `${JSON.stringify({
        authenticated: true,
        user_id: session.user_id,
        username: profile?.username ?? null,
        display_name: profile?.display_name ?? null,
        supporter,
        expires_at: session.expires_at
      })}
`
    );
    return 0;
  }
  process.stdout.write(`${bold(profileLabel(profile, session.user_id))}${supporter ? ` ${green("supporter")}` : ""}
`);
  process.stdout.write(`${dim(session.user_id)}
`);
  return 0;
}
async function logoutCommand() {
  await logout();
  process.stdout.write("\u0412\u044B\u0448\u043B\u0438 \u0438\u0437 \u0430\u043A\u043A\u0430\u0443\u043D\u0442\u0430.\n");
  return 0;
}

// src/index.ts
var USAGE = `${bold("surprise")} \u2014 SURPRISE.FM \u0432 \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B\u0435

${bold("\u041A\u043E\u043C\u0430\u043D\u0434\u044B")}
  ${cyan("radio")} [--json]                          \u0438\u0433\u0440\u0430\u0442\u044C \u044D\u0444\u0438\u0440
  ${cyan("play")} <\u0441\u0441\u044B\u043B\u043A\u0430|\u0437\u0430\u043F\u0440\u043E\u0441> [--json]          \u0438\u0433\u0440\u0430\u0442\u044C \u0432\u044B\u043F\u0443\u0441\u043A
  ${cyan("library")} [\u0440\u0430\u0437\u0434\u0435\u043B] [--json]              \u0441\u0432\u043E\u044F \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0430
  ${cyan("playlist")} [\u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435] [--json]           \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u043E\u0435 \u043F\u043B\u0435\u0439\u043B\u0438\u0441\u0442\u0430
  ${cyan("login")} [--email] [--no-open] [--force]   \u0432\u043E\u0439\u0442\u0438 \u0432 \u0430\u043A\u043A\u0430\u0443\u043D\u0442
  ${cyan("whoami")} [--json]                         \u043A\u0442\u043E \u0432\u043E\u0448\u0451\u043B
  ${cyan("logout")}                                  \u0432\u044B\u0439\u0442\u0438

${bold("\u0424\u043B\u0430\u0433\u0438")}
  --json        \u043C\u0430\u0448\u0438\u043D\u043E\u0447\u0438\u0442\u0430\u0435\u043C\u044B\u0439 \u0432\u044B\u0432\u043E\u0434
  --version     \u0432\u0435\u0440\u0441\u0438\u044F
  --help        \u044D\u0442\u0430 \u0441\u043F\u0440\u0430\u0432\u043A\u0430

${dim("\u0420\u0430\u0437\u0434\u0435\u043B\u044B \u0431\u0438\u0431\u043B\u0438\u043E\u0442\u0435\u043A\u0438: playlists, likes, finds, saved, following.")}
${dim("\u0412\u0445\u043E\u0434 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u2014 \u0447\u0435\u0440\u0435\u0437 Telegram: \u0432 \u0442\u0435\u0440\u043C\u0438\u043D\u0430\u043B\u0435 \u043F\u043E\u044F\u0432\u0438\u0442\u0441\u044F QR \u0438 \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 \u0431\u043E\u0442\u0430.")}
${dim("\u041F\u043E SSH \u0443\u0434\u043E\u0431\u043D\u0435\u0435 \u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u0442\u044C QR \u0442\u0435\u043B\u0435\u0444\u043E\u043D\u043E\u043C \u2014 \u0431\u0440\u0430\u0443\u0437\u0435\u0440 \u0434\u043B\u044F \u044D\u0442\u043E\u0433\u043E \u043D\u0435 \u043D\u0443\u0436\u0435\u043D.")}
`;
async function main(argv) {
  const [command, ...rest] = argv;
  if (!command || command === "--help" || command === "-h" || command === "help") {
    process.stdout.write(USAGE);
    return 0;
  }
  if (command === "--version" || command === "-v") {
    process.stdout.write(`${CLIENT_VERSION}
`);
    return 0;
  }
  switch (command) {
    case "radio":
      return radioCommand(rest);
    case "play":
      return playCommand(rest);
    case "library":
    case "lib":
      return libraryCommand(rest);
    case "playlist":
      return playlistCommand(rest);
    case "login":
      return loginCommand(rest);
    case "whoami":
      return whoamiCommand(rest);
    case "logout":
      return logoutCommand();
    default:
      process.stderr.write(`${red("\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043A\u043E\u043C\u0430\u043D\u0434\u0430:")} ${command}

${USAGE}`);
      return 1;
  }
}
main(process.argv.slice(2)).then((code) => {
  process.exitCode = code;
}).catch((error) => {
  process.stderr.write(`${red("\u041E\u0448\u0438\u0431\u043A\u0430:")} ${error instanceof Error ? error.message : String(error)}
`);
  process.exitCode = 1;
});
