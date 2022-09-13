# Blowfish

[![npm package][npm-badge]][npm]

[build-badge]: https://img.shields.io/travis/com/mrdhanz/blowfish-node/master.svg?style=flat-square

[npm-badge]: https://img.shields.io/npm/v/blowfish-node.svg?style=flat-square
[npm]: https://www.npmjs.org/package/blowfish-node

[Blowfish](https://en.wikipedia.org/wiki/Blowfish_(cipher)) encryption library for browsers and Node.js.

Works in Node.js 4+, IE10+ and all modern browsers.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
  - [Example](#example)
  - [Block cipher mode of operation](#block-cipher-mode-of-operation)
  - [Padding](#padding)
  - [Return type](#return-type)

## Installation

Take latest version [here](https://unpkg.com/blowfish-node) or with:
### npm
```sh
npm install blowfish-node --save
```
### yarn:
```sh
yarn add blowfish-node
```

## Usage

All input data including key, IV, plaintext and ciphertext should be a `String` or `ArrayBuffer` / `Buffer`.
Strings support all unicode including emoji ✨.

### Example

```js
const Blowfish = require('blowfish-node');
const bf = new Blowfish('super key', Blowfish.MODE.ECB, Blowfish.PADDING.NULL); // only key isn't optional
bf.setIv('abcdefgh'); // optional for ECB mode; bytes length should be equal 8

const encoded = bf.encode('input text even with emoji 🎅');
const decoded = bf.decode(encoded, Blowfish.TYPE.STRING); // type is optional

// encode the object to base64
const encoded = bf.encodeToBase64(JSON.stringify({message: 'super secret response api'}));
const decoded = bf.decode(encoded, Blowfish.TYPE.JSON_OBJECT); // type is required to JSON_OBJECT
// only for typescript
const response = bf.decode<{message: string}>(encoded, Blowfish.TYPE.JSON_OBJECT); // type is required to JSON_OBJECT
```

You can play with this example in runkit: https://runkit.com/mrdhanz/blowfish-example

### Block cipher mode of operation

https://en.wikipedia.org/wiki/Block_cipher_mode_of_operation

```js
Blowfish.MODE.ECB // (default) Electronic Codebook
Blowfish.MODE.CBC // Cipher Block Chaining
```

### Padding

http://www.di-mgt.com.au/cryptopad.html

```js
Blowfish.PADDING.PKCS5 // (default) Pad with bytes all of the same value as the number of padding bytes
Blowfish.PADDING.ONE_AND_ZEROS // Pad with 0x80 followed by zero bytes
Blowfish.PADDING.LAST_BYTE // Pad with zeroes except make the last byte equal to the number of padding bytes
Blowfish.PADDING.NULL // Pad with zero (null) characters
Blowfish.PADDING.SPACES // Pad with spaces
```

### Return type

Which type of data should return method `decode`:

```js
Blowfish.TYPE.STRING // (default) String
Blowfish.TYPE.UINT8_ARRAY // Uint8Array
Blowfish.TYPE.JSON_OBJECT // JSON
```
