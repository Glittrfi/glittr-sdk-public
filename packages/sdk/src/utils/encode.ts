import { script } from "bitcoinjs-lib";
import { secp256k1 } from '@noble/curves/secp256k1';
import { sha256 } from '@noble/hashes/sha256';

export function encodeGlittrData(message: string): Buffer {
  const glittrFlag = Buffer.from("GLITTR", "utf8"); // Prefix
  const glittrData = Buffer.from(message, "utf8");
  const embed = script.compile([106, glittrFlag, glittrData]);

  return embed;
}

export async function encryptMessage(
  publicKeyBytes: Uint8Array,
  message: string
): Promise<Uint8Array> {
  const ephemeralPrivateKey = secp256k1.utils.randomPrivateKey();
  const ephemeralPublicKey = secp256k1.getPublicKey(ephemeralPrivateKey);
  const publicKey = secp256k1.ProjectivePoint.fromHex(publicKeyBytes);
  
  // Simplified ECDH calculation
  const sharedSecret = publicKey.multiply(
    BigInt('0x' + Buffer.from(ephemeralPrivateKey).toString('hex'))
  ).toRawBytes();
  
  const symmetricKey = sha256(sharedSecret);
  const nonce = crypto.getRandomValues(new Uint8Array(12));
  
  const key = await crypto.subtle.importKey(
    'raw',
    symmetricKey,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    key,
    new TextEncoder().encode(message)
  );

  // Combine all components
  return Buffer.concat([
    Buffer.from(ephemeralPublicKey),
    nonce,
    new Uint8Array(ciphertext)
  ]);
}