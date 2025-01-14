export const U128_MAX_NUMBER = 0xffff_ffff_ffff_ffff_ffff_ffff_ffff_ffffn;
export const BUFFER_MAX_VARUINT_LENGTH = 19; // maximum u128 length

export function encodeVaruint(t: number | string | bigint) {
  let n = BigInt(t)
  if (n < 0n) {
    throw new Error("Value must be positive");
  }
  if (n > U128_MAX_NUMBER) {
    throw new Error(`Can't encode value more than ${U128_MAX_NUMBER}`);
  }

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

export function decodeVaruint(buffer: Uint8Array) {
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

  return finalValue;
}