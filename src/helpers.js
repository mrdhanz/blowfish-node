import { PADDING } from './constants';
import { stringToU8 } from './encoding';

export function signedToUnsigned(signed) {
  return signed >>> 0;
}

export function xor(a, b) {
  return signedToUnsigned(a ^ b);
}

export function sumMod32(a, b) {
  return signedToUnsigned((a + b) | 0);
}

export function packFourBytes(byte1, byte2, byte3, byte4) {
  return signedToUnsigned((byte1 << 24) | (byte2 << 16) | (byte3 << 8) | byte4);
}

export function unpackFourBytes(pack) {
  return [
    (pack >>> 24) & 0xff,
    (pack >>> 16) & 0xff,
    (pack >>> 8) & 0xff,
    pack & 0xff,
  ];
}

export function isString(val) {
  return typeof val === 'string';
}

export function isBuffer(val) {
  return typeof val === 'object' && 'byteLength' in val;
}

export function isU8Array(val) {
  return val instanceof Uint8Array;
}

export function isStringOrBuffer(val) {
  return isString(val) || isBuffer(val);
}

export function includes(obj, val) {
  let result = false;
  Object.keys(obj).forEach((key) => {
    if (obj[key] === val) {
      result = true;
    }
  });
  return result;
}

export function toUint8Array(val) {
  if (isString(val)) {
    return stringToU8(val);
  } else if (isBuffer(val)) {
    return new Uint8Array(val);
  } else if (isU8Array(val)) {
    return val;
  }
  throw new Error('Unsupported type');
}

export function expandKey(key) {
  if (key.length >= 72) {
    // 576 bits -> 72 bytes
    return key;
  }
  const longKey = [];
  while (longKey.length < 72) {
    for (let i = 0; i < key.length; i++) {
      longKey.push(key[i]);
    }
  }
  return new Uint8Array(longKey);
}

export function pad(bytes, padding) {
  const count = 8 - (bytes.length % 8);
  if (count === 8 && bytes.length > 0 && padding !== PADDING.PKCS5) {
    return bytes;
  }
  const writer = new Uint8Array(bytes.length + count);
  const newBytes = [];
  let remaining = count;
  let padChar = 0;

  switch (padding) {
    case PADDING.PKCS5: {
      padChar = count;
      break;
    }
    case PADDING.ONE_AND_ZEROS: {
      newBytes.push(0x80);
      remaining--;
      break;
    }
    case PADDING.SPACES: {
      padChar = 0x20;
      break;
    }
  }

  while (remaining > 0) {
    if (padding === PADDING.LAST_BYTE && remaining === 1) {
      newBytes.push(count);
      break;
    }
    newBytes.push(padChar);
    remaining--;
  }

  writer.set(bytes);
  writer.set(newBytes, bytes.length);
  return writer;
}

export function unpad(bytes, padding) {
  let cutLength = 0;
  switch (padding) {
    case PADDING.LAST_BYTE:
    case PADDING.PKCS5: {
      const lastChar = bytes[bytes.length - 1];
      if (lastChar <= 8) {
        cutLength = lastChar;
      }
      break;
    }
    case PADDING.ONE_AND_ZEROS: {
      let i = 1;
      while (i <= 8) {
        const char = bytes[bytes.length - i];
        if (char === 0x80) {
          cutLength = i;
          break;
        }
        if (char !== 0) {
          break;
        }
        i++;
      }
      break;
    }
    case PADDING.NULL:
    case PADDING.SPACES: {
      const padChar = padding === PADDING.SPACES ? 0x20 : 0;
      let i = 1;
      while (i <= 8) {
        const char = bytes[bytes.length - i];
        if (char !== padChar) {
          cutLength = i - 1;
          break;
        }
        i++;
      }
      break;
    }
  }
  return bytes.subarray(0, bytes.length - cutLength);
}

export function b64ToUint6(nChr) {
  return nChr > 64 && nChr < 91
    ? nChr - 65
    : nChr > 96 && nChr < 123
    ? nChr - 71
    : nChr > 47 && nChr < 58
    ? nChr + 4
    : nChr === 43
    ? 62
    : nChr === 47
    ? 63
    : 0;
}

export function base64DecToArr(sBase64, nBlocksSize) {
  const sB64Enc = sBase64.replace(/[^A-Za-z0-9+/]/g, '');
  const nInLen = sB64Enc.length;
  const nOutLen = nBlocksSize
    ? Math.ceil(((nInLen * 3 + 1) >> 2) / nBlocksSize) * nBlocksSize
    : (nInLen * 3 + 1) >> 2;
  const taBytes = new Uint8Array(nOutLen);

  let nMod3;
  let nMod4;
  let nUint24 = 0;
  let nOutIdx = 0;
  for (let nInIdx = 0; nInIdx < nInLen; nInIdx++) {
    nMod4 = nInIdx & 3;
    nUint24 |= b64ToUint6(sB64Enc.charCodeAt(nInIdx)) << (6 * (3 - nMod4));
    if (nMod4 === 3 || nInLen - nInIdx === 1) {
      nMod3 = 0;
      while (nMod3 < 3 && nOutIdx < nOutLen) {
        taBytes[nOutIdx] = (nUint24 >>> ((16 >>> nMod3) & 24)) & 255;
        nMod3++;
        nOutIdx++;
      }
      nUint24 = 0;
    }
  }

  return taBytes;
}

/* Base64 string to array encoding */
export function uint6ToB64(nUint6) {
  return nUint6 < 26
    ? nUint6 + 65
    : nUint6 < 52
    ? nUint6 + 71
    : nUint6 < 62
    ? nUint6 - 4
    : nUint6 === 62
    ? 43
    : nUint6 === 63
    ? 47
    : 65;
}

export function base64EncArr(aBytes) {
  let nMod3 = 2;
  let sB64Enc = '';

  const nLen = aBytes.length;
  let nUint24 = 0;
  for (let nIdx = 0; nIdx < nLen; nIdx++) {
    nMod3 = nIdx % 3;
    if (nIdx > 0 && ((nIdx * 4) / 3) % 76 === 0) {
      sB64Enc += '\r\n';
    }

    nUint24 |= aBytes[nIdx] << ((16 >>> nMod3) & 24);
    if (nMod3 === 2 || aBytes.length - nIdx === 1) {
      sB64Enc += String.fromCodePoint(
        uint6ToB64((nUint24 >>> 18) & 63),
        uint6ToB64((nUint24 >>> 12) & 63),
        uint6ToB64((nUint24 >>> 6) & 63),
        uint6ToB64(nUint24 & 63)
      );
      nUint24 = 0;
    }
  }
  return (
    sB64Enc.substr(0, sB64Enc.length - 2 + nMod3) +
    (nMod3 === 2 ? '' : nMod3 === 1 ? '=' : '==')
  );
}

/* UTF-8 array to JS string and vice versa */

export function UTF8ArrToStr(aBytes) {
  let sView = '';
  let nPart;
  const nLen = aBytes.length;
  for (let nIdx = 0; nIdx < nLen; nIdx++) {
    nPart = aBytes[nIdx];
    sView += String.fromCodePoint(
      nPart > 251 && nPart < 254 && nIdx + 5 < nLen /* six bytes */
        ? /* (nPart - 252 << 30) may be not so safe in ECMAScript! So…: */
          (nPart - 252) * 1073741824 +
            ((aBytes[++nIdx] - 128) << 24) +
            ((aBytes[++nIdx] - 128) << 18) +
            ((aBytes[++nIdx] - 128) << 12) +
            ((aBytes[++nIdx] - 128) << 6) +
            aBytes[++nIdx] -
            128
        : nPart > 247 && nPart < 252 && nIdx + 4 < nLen /* five bytes */
        ? ((nPart - 248) << 24) +
          ((aBytes[++nIdx] - 128) << 18) +
          ((aBytes[++nIdx] - 128) << 12) +
          ((aBytes[++nIdx] - 128) << 6) +
          aBytes[++nIdx] -
          128
        : nPart > 239 && nPart < 248 && nIdx + 3 < nLen /* four bytes */
        ? ((nPart - 240) << 18) +
          ((aBytes[++nIdx] - 128) << 12) +
          ((aBytes[++nIdx] - 128) << 6) +
          aBytes[++nIdx] -
          128
        : nPart > 223 && nPart < 240 && nIdx + 2 < nLen /* three bytes */
        ? ((nPart - 224) << 12) +
          ((aBytes[++nIdx] - 128) << 6) +
          aBytes[++nIdx] -
          128
        : nPart > 191 && nPart < 224 && nIdx + 1 < nLen /* two bytes */
        ? ((nPart - 192) << 6) + aBytes[++nIdx] - 128 /* nPart < 127 ? */
        : /* one byte */
          nPart
    );
  }
  return sView;
}

export function strToUTF8Arr(sDOMStr) {
  let nChr;
  const nStrLen = sDOMStr.length;
  let nArrLen = 0;

  /* mapping… */
  for (let nMapIdx = 0; nMapIdx < nStrLen; nMapIdx++) {
    nChr = sDOMStr.codePointAt(nMapIdx);

    if (nChr > 65536) {
      nMapIdx++;
    }

    nArrLen +=
      nChr < 0x80
        ? 1
        : nChr < 0x800
        ? 2
        : nChr < 0x10000
        ? 3
        : nChr < 0x200000
        ? 4
        : nChr < 0x4000000
        ? 5
        : 6;
  }

  // eslint-disable-next-line prefer-const
  let aBytes = new Uint8Array(nArrLen);

  /* transcription… */
  let nIdx = 0;
  let nChrIdx = 0;
  while (nIdx < nArrLen) {
    nChr = sDOMStr.codePointAt(nChrIdx);
    if (nChr < 128) {
      /* one byte */
      aBytes[nIdx++] = nChr;
    } else if (nChr < 0x800) {
      /* two bytes */
      aBytes[nIdx++] = 192 + (nChr >>> 6);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x10000) {
      /* three bytes */
      aBytes[nIdx++] = 224 + (nChr >>> 12);
      aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
    } else if (nChr < 0x200000) {
      /* four bytes */
      aBytes[nIdx++] = 240 + (nChr >>> 18);
      aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
      aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
      nChrIdx++;
    } else if (nChr < 0x4000000) {
      /* five bytes */
      aBytes[nIdx++] = 248 + (nChr >>> 24);
      aBytes[nIdx++] = 128 + ((nChr >>> 18) & 63);
      aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
      aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
      nChrIdx++;
    } /* if (nChr <= 0x7fffffff) */ else {
      /* six bytes */
      aBytes[nIdx++] = 252 + (nChr >>> 30);
      aBytes[nIdx++] = 128 + ((nChr >>> 24) & 63);
      aBytes[nIdx++] = 128 + ((nChr >>> 18) & 63);
      aBytes[nIdx++] = 128 + ((nChr >>> 12) & 63);
      aBytes[nIdx++] = 128 + ((nChr >>> 6) & 63);
      aBytes[nIdx++] = 128 + (nChr & 63);
      nChrIdx++;
    }
    nChrIdx++;
  }

  return aBytes;
}

export function autoFixJSON(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    try {
      let jsonFix = str
        .replace(
          /(\w+:)|(\w+ :)/g,
          (match) => `"${match.substring(0, match.length - 1)}":`
        )
        .replace(/'/g, '"');
      if (jsonFix[0].charCodeAt(0) === 125) {
        jsonFix = jsonFix.slice(0, 1);
      }
      if (jsonFix[jsonFix.length - 2].charCodeAt(0) === 125) {
        jsonFix = `${jsonFix.slice(0, -2)}}`;
      }
      return JSON.parse(jsonFix);
    } catch (error) {
      throw new Error('Invalid JSON');
    }
  }
}