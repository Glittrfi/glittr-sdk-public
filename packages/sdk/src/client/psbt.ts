import { Psbt } from "bitcoinjs-lib";
import { Network } from "../types";
import { getBitcoinNetwork } from "../utils";

export type PSBTParams = {
  network: Network;
};

export class PSBT {
  private psbt: Psbt;

  constructor({ network }: PSBTParams) {
    this.psbt = new Psbt({ network: getBitcoinNetwork(network) });
  }
}
