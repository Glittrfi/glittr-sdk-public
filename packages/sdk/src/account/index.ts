import { ECPairInterface } from "ecpair";
import { Network } from "../types";
import { ecpair } from "../utils/ecpair";
import { payments } from "bitcoinjs-lib";
import { getBitcoinNetwork } from "../utils/network";
import { P2pkhAccount } from "./types";

export type AccountParams = {
  privateKey: string;
  wif: string;
  network: Network;
};

export class Account {
  privateKey: string;
  wif: string;
  network: Network;

  private keypair: ECPairInterface;

  constructor({ privateKey, wif, network }: AccountParams) {
    this.keypair = ecpair.makeRandom();

    if (privateKey) {
      const privateKeyBuffer = Buffer.from(privateKey, "hex");
      this.keypair = ecpair.fromPrivateKey(privateKeyBuffer);
    }

    if (wif) {
      this.keypair = ecpair.fromWIF(wif);
    }

    this.privateKey = privateKey;
    this.wif = wif;
    this.network = network;
  }

  p2pkh(): P2pkhAccount {
    const p2pkhPayments = payments.p2pkh({
      pubkey: this.keypair.publicKey,
      network: getBitcoinNetwork(this.network),
    });

    return {
      address: p2pkhPayments.address!,
      keypair: this.keypair,
    };
  }
}
