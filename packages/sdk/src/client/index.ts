import { Psbt } from "bitcoinjs-lib";
import { Account } from "../account/types";
import { TransactionFormat, TransferFormat } from "../transaction/message";
import { Network } from "../types";
import { BitcoinUTXO, Output } from "../utxo";
import { coinSelect } from "./coinselect";
import { getBitcoinNetwork, validator } from "../utils";
import { getAddressType } from "../utils/address";
import { AddressType } from "bitcoin-address-validation";
import { encodeGlittrData } from "../utils/encode";
import { fetchPOST } from "../utils/fetch";

export type CreateBroadcastTxParams = {
  account: Account;
  tx: TransactionFormat;
  outputs?: Output[];
  utxos?: BitcoinUTXO[];
};

type GlittrSDKParams = {
  network: Network;
  glittrApi: string;
  electrumApi: string;
};

export class GlittrSDK {
  private network: Network;
  private glittrApi: string;
  electrumApi: string;

  constructor({ network, glittrApi, electrumApi }: GlittrSDKParams) {
    this.network = network;
    this.glittrApi = glittrApi;
    this.electrumApi = electrumApi;

    this.getUtxos = this.getUtxos.bind(this);
    this.getTxHex = this.getTxHex.bind(this);
    this.getGlittrAsset = this.getGlittrAsset.bind(this);
  }

  private async getUtxos(address: string): Promise<BitcoinUTXO[]> {
    // TODO glittr aware for txtype glittr
    try {
      const utxoFetch = await fetch(
        `${this.electrumApi}/address/${address}/utxo`
      );
      const unconfirmedUtxos = (await utxoFetch.json()) ?? [];
      const utxos = unconfirmedUtxos.filter(
        (tx: BitcoinUTXO) => tx.status && tx.status.confirmed
      );

      return utxos;
    } catch (e) {
      throw new Error(`Error fetching UTXOS : ${e}`);
    }
  }

  private async getTxHex(txId: string): Promise<string> {
    try {
      const txHexFetch = await fetch(`${this.electrumApi}/tx/${txId}/hex`);
      const txHex = await txHexFetch.text();

      return txHex;
    } catch (e) {
      throw new Error(`Error fetching TX Hex : ${e}`);
    }
  }

  private async getGlittrAsset(txId: string, vout: number) {
    try {
      const assetFetch = await fetch(
        `${this.glittrApi}/assets/${txId}/${vout}`
      );
      const asset = await assetFetch.text();

      return JSON.stringify(asset);
    } catch (e) {
      throw new Error(`Error fetching Glittr Asset : ${e}`);
    }
  }

  createTx() {}
  broadcastTx() {}

  async createAndBroadcastTx({
    account,
    tx,
    outputs,
    utxos,
  }: CreateBroadcastTxParams) {
    outputs = outputs ?? []

    const addressType = getAddressType(account.address);

    const embed = encodeGlittrData(JSON.stringify(tx));
    outputs = outputs.concat({ script: embed, value: 0 });

    const psbt = new Psbt({ network: getBitcoinNetwork(this.network) });
    const coins = await coinSelect(
      utxos ?? [],
      outputs,
      2,
      account.address,
      tx,
      this.getUtxos,
      this.getTxHex,
      this.getGlittrAsset,
      account.address
    );

    const _inputs = coins?.inputs ?? [];
    for (const input of _inputs) {
      switch (addressType) {
        case AddressType.p2pkh:
          psbt.addInput({
            hash: input.hash,
            index: input.index,
            nonWitnessUtxo: input.nonWitnessUtxo,
          });
          break;
        case AddressType.p2wpkh:
          psbt.addInput({
            hash: input.hash,
            index: input.index,
            witnessUtxo: input.witnessUtxo,
          });
          break;
        default:
          throw new Error(`Error Address Type not supported yet`);
      }
    }

    const _outputs = coins?.outputs ?? [];
    for (const output of _outputs) {
      if (output.address) {
        psbt.addOutput({ address: output.address, value: output.value });
      } else if (output.script) {
        psbt.addOutput({ script: output.script, value: output.value });
      }
    }

    psbt.signAllInputs(account.keypair);
    const isValidSignature = psbt.validateSignaturesOfAllInputs(validator);
    if (!isValidSignature) {
      throw new Error(`Error signature invalid`);
    }
    psbt.finalizeAllInputs();
    const hex = psbt.extractTransaction(true).toHex();

    // Validate Glittr TX
    const isValidGlittrTx = await fetchPOST(
      `${this.glittrApi}/validate-tx`,
      { "Content-Type": "application/json" },
      hex
    );
    if (!isValidGlittrTx.is_valid)
      throw new Error(`Glittr Error: TX Invalid ${isValidGlittrTx}`);

    // Broadcast TX
    const txId = await fetchPOST(
      `${this.electrumApi}/tx`,
      { "Content-Type": "application/json" },
      hex
    );
    return txId;
  }
}
