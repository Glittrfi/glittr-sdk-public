import { U128_MAX_NUMBER } from "../helper/const";
import { encodeVaruint } from "./varuint";

export function encodeBase26(str: string) {
  str = str.toUpperCase();

  // should be u128
  let number = 0n;

  // should be u32
  let spacersValue = 0n;

  let charIndex = 0;
  for (let i = 0; i < str.length; i += 1) {
    const c = str.charAt(i);
    if (c >= "A" && c <= "Z") {
      if (charIndex > 0) {
        number += 1n;
      }
      number *= 26n;

      number += BigInt(c.charCodeAt(0) - "A".charCodeAt(0));

      if (number > U128_MAX_NUMBER) {
        throw new Error("Character is too large to be encoded");
      }
      charIndex += 1;
    } else if (c === "." || c === "•") {
      const flag = 1n << BigInt(charIndex);

      if ((spacersValue & flag) === 0n) {
        spacersValue |= flag;
      }
    } else {
      throw new Error(`Invalid character in ticker: ${c}`);
    }
  }

  if (spacersValue > 0n) {
    return {
      number: encodeVaruint(number),
      spacers: encodeVaruint(spacersValue)
    }
  } else {
    return {
      number: encodeVaruint(number),
    }
  }
}
