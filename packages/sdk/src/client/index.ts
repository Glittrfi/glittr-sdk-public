import { payments, Psbt } from "bitcoinjs-lib";
import { Account } from "../account/types";
import { Network } from "../types";
import { BitcoinUTXO, Output } from "../utxo";
import { coinSelect } from "./coinselect";
import { getBitcoinNetwork, validator } from "../utils";
import { getAddressType } from "../utils/address";
import { AddressType } from "bitcoin-address-validation";
import { encodeGlittrData } from "../utils/encode";
import { fetchPOST } from "../utils/fetch";
import { electrumFetchTxHex } from "../utils/electrum";
import { OpReturnMessage } from "../transaction";

export type CreateTxParams = {
  address: string;
  tx: OpReturnMessage;
  outputs?: Output[];
  utxos?: BitcoinUTXO[];
};

export type CreateBroadcastTxParams = {
  account: Account;
  tx: OpReturnMessage;
  outputs?: Output[];
  utxos?: BitcoinUTXO[];
};

export type CreateAndBroadcastRawTxParams = {
  account: Account;
  inputs: BitcoinUTXO[];
  outputs: Output[];
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
  }

  async createTx({ address, tx, outputs, utxos }: CreateTxParams): Promise<Psbt> {
    outputs = outputs ?? [];
    const addressType = getAddressType(address);

    const embed = encodeGlittrData(JSON.stringify(tx));
    outputs = outputs.concat({ script: embed, value: 0 });

    const psbt = new Psbt({ network: getBitcoinNetwork(this.network) });
    const coins = await coinSelect(
      getBitcoinNetwork(this.network),
      utxos ?? [],
      outputs,
      2,
      address,
      tx,
      this.electrumApi,
      this.glittrApi,
      address
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

    return psbt
  }

  // broadcastTx() {}
  async createAndBroadcastTx({
    account,
    tx,
    outputs,
    utxos,
  }: CreateBroadcastTxParams) {
    outputs = outputs ?? [];

    const addressType = getAddressType(account.address);

    const embed = encodeGlittrData(JSON.stringify(tx));
    outputs = [{ script: embed, value: 0 }, ...outputs];

    const psbt = new Psbt({ network: getBitcoinNetwork(this.network) });
    const coins = await coinSelect(
      getBitcoinNetwork(this.network),
      utxos ?? [],
      outputs,
      2,
      account.address,
      tx,
      this.electrumApi,
      this.glittrApi,
      account.address
    );

    // Hacky: If the embeded tx is different from the tx passed in, change the first output to the tx from coinselect
    if (embed !== encodeGlittrData(JSON.stringify(coins?.tx))) {
      const embedCoinTx = encodeGlittrData(JSON.stringify(coins?.tx));
      outputs[0] = { script: embedCoinTx, value: 0 };
    }

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
    // const isValidGlittrTx = await fetchPOST(
    //   `${this.glittrApi}/validate-tx`,
    //   { "Content-Type": "application/json" },
    //   hex
    // );
    // if (!isValidGlittrTx.is_valid)
    //   throw new Error(`Glittr Error: TX Invalid ${isValidGlittrTx}`);

    // Broadcast TX
    const txId = await fetchPOST(
      `${this.electrumApi}/tx`,
      { "Content-Type": "application/json" },
      hex
    );
    return txId;
  }

  async createAndBroadcastRawTx({
    account,
    inputs,
    outputs
  }: CreateAndBroadcastRawTxParams) {
    const addressType = getAddressType(account.address);

    if (inputs && inputs.length === 0) {
      throw new Error("No inputs provided");
    }

    if (outputs && outputs.length === 0) {
      throw new Error("No outputs provided");
    }

    const psbt = new Psbt({ network: getBitcoinNetwork(this.network) });

    for (const input of inputs) {
      switch (addressType) {
        case AddressType.p2pkh:
          const txHex = await electrumFetchTxHex(this.electrumApi, input.txid);
          psbt.addInput({
            hash: input.txid,
            index: input.vout,
            nonWitnessUtxo: Buffer.from(txHex, "hex"),
          });
          break;
        case AddressType.p2wpkh:
          const paymentOutput = payments.p2wpkh({
            address: account.address,
            network: getBitcoinNetwork(this.network)
          }).output!;
          psbt.addInput({
            hash: input.txid,
            index: input.vout,
            witnessUtxo: {
              script: paymentOutput,
              value: input.value,
            }
          });
          break;
      }
    }

    for (const output of outputs) {
      if (output.address) {
        psbt.addOutput({ address: output.address, value: output.value });
      } else if (output.script) {
        psbt.addOutput({ script: output.script, value: output.value });
      }
    }
  }
}

