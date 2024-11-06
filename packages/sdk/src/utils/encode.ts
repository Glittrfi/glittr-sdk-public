import { script } from "bitcoinjs-lib";

export function encodeGlittrData(message: string): Buffer {
  const glittrFlag = Buffer.from("GLITTR", "utf8"); // Prefix
  const glittrData = Buffer.from(message, "utf8");
  const embed = script.compile([106, glittrFlag, glittrData]);

  return embed;
}
