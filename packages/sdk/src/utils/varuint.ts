export const U128_MAX_NUMBER = 0xffff_ffff_ffff_ffff_ffff_ffff_ffff_ffffn;
export const BUFFER_MAX_VARUINT_LENGTH = 19; // maximum u128 length
export function encodeVaruint(n: bigint) {
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