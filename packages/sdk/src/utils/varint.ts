import {
  BUFFER_MAX_VARUINT_LENGTH,
  I128_MAX_NUMBER,
  I128_MIN_NUMBER,
} from "../helper/const";

export function encodeVarint(t: number | string | bigint) {
  let n = BigInt(t);
  if (n > I128_MAX_NUMBER) {
    throw new Error(`Can't encode value more than ${I128_MAX_NUMBER}`);
  }
  if (n < I128_MIN_NUMBER) {
    throw new Error(`Can't encode value less than ${I128_MIN_NUMBER}`);
  }

  // zigzag encoding to convert it into unsigned
  let unsigned = 0n;
  if (n > 1n) {
    // positive
    unsigned = n << 1n;
  } else if (n !== 0n) {
    // negative
    unsigned = (-n << 1n) - 1n;
  }
  n = unsigned;

  const arr = new Uint8Array(BUFFER_MAX_VARUINT_LENGTH);

  let i = 0;
  while (n >> 7n > 0) {
    arr[i] = Number((n & 0b1111_1111n) | 0b1000_0000n);
    n >>= 7n;
    i += 1;
  }
  arr[i] = Number(n);

  return arr.slice(0, i + 1);
}

export function decodeVarint(buffer: Uint8Array) {
  let finalValue = BigInt(0);
  for (let i = 0; i < buffer.length; i += 1) {
    const byte = buffer[i]!;
    const value = byte & 0b0111_1111;
    finalValue = finalValue | (BigInt(value) << (7n * BigInt(i)));
  }

  if (finalValue < 0n) {
    // this can't be happen, just for safety
    throw new Error("Value is minus, something wrong");
  }

  if (finalValue == 0n) {
    return finalValue;
  }

  // zigzag encoding to convert it into signed
  if ((finalValue & 1n) == 1n) {
    // negative
    return -((finalValue + 1n) >> 1n);
  } else {
    // positive
    return finalValue >> 1n;
  }
}
