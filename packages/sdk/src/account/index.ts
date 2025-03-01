import { ECPairInterface } from "ecpair";
import { Network } from "../types";
import { ecpair } from "../utils/ecpair";
import { crypto, payments } from "bitcoinjs-lib";
import { getBitcoinNetwork } from "../utils/network";
import { P2pkhAccount, P2trAccount, P2wpkhAccount } from "./types";

export type AccountParams = {
  privateKey?: string;
  wif?: string;
  network: Network;
};

export class Account {
  private keypair: ECPairInterface;
  private network: Network;

  constructor({ privateKey, wif, network }: AccountParams) {
    this.keypair = ecpair.makeRandom();

    if (privateKey) {
      const privateKeyBuffer = Buffer.from(privateKey, "hex");
      this.keypair = ecpair.fromPrivateKey(privateKeyBuffer, {
        network: getBitcoinNetwork(network),
      });
    }

    if (wif) {
      this.keypair = ecpair.fromWIF(wif, getBitcoinNetwork(network));
    }

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

  p2wpkh(): P2wpkhAccount {
    const p2wpkhPayments = payments.p2wpkh({
      pubkey: this.keypair.publicKey,
      network: getBitcoinNetwork(this.network),
    });

    return {
      address: p2wpkhPayments.address!,
      keypair: this.keypair,
    };
  }

  p2tr(): P2trAccount {
    const p2trPayments = payments.p2tr({
      internalPubkey: this.keypair.publicKey.slice(1, 33), // Remove the first byte and take 32 bytes
      network: getBitcoinNetwork(this.network),
    });

    return {
      address: p2trPayments.address!,
      keypair: this.keypair,
    };
  }
}
