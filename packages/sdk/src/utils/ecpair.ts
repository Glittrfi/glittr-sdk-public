import ECPairFactory from "ecpair";
import ecc from "@bitcoinerlab/secp256k1";

export const ecpair = ECPairFactory(ecc)

export const validator = (pubkey: any, msghash: any, signature: any): boolean =>
    ecpair.fromPublicKey(pubkey).verify(msghash, signature);
