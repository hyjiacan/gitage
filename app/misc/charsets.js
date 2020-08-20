const fs = require('fs')

const charsets = {
  BigEndianUnicode: 'big-endian-unicode',
  Unicode: 'unicode',
  UTF8: 'utf-8'
}

/**
 * 判断是否是不带 BOM 的 UTF8 格式
 * @param {Buffer} data
 * @return {boolean}
 */
function IsUTF8Bytes(data) {
  // 计算当前正分析的字符应还有的字节数
  let charByteCounter = 1
  // 当前分析的字节
  let curByte
  for (let i = 0; i < data.length; i++) {
    curByte = data[i]
    if (charByteCounter === 1) {
      if (curByte >= 0x80) {
        //判断当前
        while (((curByte <<= 1) & 0x80) !== 0) {
          charByteCounter++
        }
        // 标记位首位若为非0 则至少以2个1开始 如:110XXXXX...........1111110X
        if (charByteCounter === 1 || charByteCounter > 6) {
          return false
        }
      }
    } else {
      //若是UTF-8 此时第一位必须为1
      if ((curByte & 0xC0) !== 0x80) {
        return false
      }
      charByteCounter--
    }
  }
  return charByteCounter <= 1
}

/**
 *
 * @param {string|Buffer} file 当为字符串时，只能是文件名
 * @param {string} [defaultCharset] 指定未检测到时使用的默认的编码
 * @return {string}
 */
function detect(file, defaultCharset) {
  if (typeof file === 'string') {
    return detect(fs.readFileSync(file, {flag: 'r'}))
  }

  if (file.length < 2) {
    return defaultCharset
  }

  let index = 0

  //保存文件流的前4个字节
  let byte1 = file[index++]
  let byte2 = file[index++]
  let byte3 = 0

  if (file.length >= 3) {
    byte3 = file[index++]
  }

  //根据文件流的前4个字节判断Encoding
  //Unicode {0xFF, 0xFE};
  //BE-Unicode {0xFE, 0xFF};
  //UTF8 = {0xEF, 0xBB, 0xBF};
  if (byte1 === 0xFE && byte2 === 0xFF)//UnicodeBe
  {
    return charsets.BigEndianUnicode
  }
  if (byte1 === 0xFF && byte2 === 0xFE && byte3 !== 0xFF)//Unicode
  {
    return charsets.Unicode
  }
  if (byte1 === 0xEF && byte2 === 0xBB && byte3 === 0xBF)//UTF8
  {
    return charsets.UTF8
  }

  // 不带BOM的UTF8
  if (IsUTF8Bytes(file)) {
    return charsets.UTF8
  }

  return defaultCharset
}

module.exports = {
  detect
}
