import { networks } from "bitcoinjs-lib";
import { Network } from "../types";

export function getBitcoinNetwork (network: Network) {
    switch (network) {
      case 'regtest':
        return networks.regtest;
      case 'testnet':
        return networks.testnet
      case 'mainnet':
        return networks.bitcoin;
      default:
        throw new Error(`Unsupported network: ${network}`);
    }
  }