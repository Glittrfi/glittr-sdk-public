import { payments, crypto, Psbt } from "bitcoinjs-lib";
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
import { OpReturnMessage, txBuilder } from "../transaction";

export type CreateTxParams = {
  address: string;
  tx: OpReturnMessage;
  outputs?: Output[];
  utxos?: BitcoinUTXO[];
  publicKey?: string;
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

export type CreateRawTxParams = {
  address: string;
  inputs: BitcoinUTXO[];
  outputs: Output[];
  publicKey: string
}

type GlittrSDKParams = {
  network: Network;
  apiKey: string,
  glittrApi: string,
  electrumApi: string,
};

export class GlittrSDK {
  network: Network;
  apiKey: string;
  glittrApi: string;
  electrumApi: string;

  constructor({ network, apiKey, glittrApi, electrumApi }: GlittrSDKParams) {
    this.network = network;
    this.apiKey = apiKey;
    this.glittrApi = glittrApi;
    this.electrumApi = electrumApi;
  }

  async createTx({
    address,
    tx,
    outputs,
    utxos,
    publicKey,
  }: CreateTxParams): Promise<Psbt> {
    outputs = outputs ?? [];
    const addressType = getAddressType(address);

    const embed = await txBuilder.compress(tx)
    outputs = outputs.concat({ script: embed, value: 0 });

    const psbt = new Psbt({ network: getBitcoinNetwork(this.network) });
    const coins = await coinSelect(
      this,
      utxos ?? [],
      outputs,
      2,
      address,
      tx,
      address,
      publicKey
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
        case AddressType.p2sh:
          // NOTE: P2SH-P2WPKH for xverse (nested segwit)
          const decodedPublicKey = Buffer.from(publicKey!, "hex");
          const p2wpkh = payments.p2wpkh({
            pubkey: decodedPublicKey,
            network: getBitcoinNetwork(this.network),
          });
          const p2sh = payments.p2sh({
            redeem: p2wpkh,
            network: getBitcoinNetwork(this.network),
          });
          psbt.addInput({
            hash: input.hash,
            index: input.index,
            nonWitnessUtxo: input.nonWitnessUtxo,
            redeemScript: p2sh.redeem?.output,
          });
          break;
        case AddressType.p2wpkh:
          psbt.addInput({
            hash: input.hash,
            index: input.index,
            witnessUtxo: input.witnessUtxo,
          });
          break;
        case AddressType.p2tr:
          psbt.addInput({
            hash: input.hash,
            index: input.index,
            witnessUtxo: input.witnessUtxo,
            tapInternalKey: input.tapInternalKey
          })
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

    return psbt;
  }

  async broadcastTx(hex: string) {
    // Validate Glittr TX
    const isValidGlittrTx = await fetchPOST(
      `${this.glittrApi}/validate-tx`,
      {},
      hex
    );
    if (!isValidGlittrTx.is_valid)
      throw new Error(`Glittr Error: TX Invalid ${isValidGlittrTx}`);

    // Broadcast TX
    const txId = await fetchPOST(`${this.electrumApi}/tx`, {}, hex);
    return txId;
  }

  async createAndBroadcastTx({
    account,
    tx,
    outputs,
    utxos,
  }: CreateBroadcastTxParams) {
    outputs = outputs ?? [];

    const addressType = getAddressType(account.address);

    const embed = await txBuilder.compress(tx)
    outputs = [{ script: embed, value: 0 }, ...outputs];

    const psbt = new Psbt({ network: getBitcoinNetwork(this.network) });
    const coins = await coinSelect(
      this,
      utxos ?? [],
      outputs,
      2,
      account.address,
      tx,
      account.address,
      account.keypair.publicKey.toString('hex')
    );

    // Hacky: If the embeded tx is different from the tx passed in, change the opreturn to the tx from coinselect
    if (embed !== encodeGlittrData(JSON.stringify(coins?.tx))) {
      const embedCoinTx = encodeGlittrData(JSON.stringify(coins?.tx));
      outputs[0] = { script: embedCoinTx, value: 0 };
    }

    const _inputs = coins?.inputs ?? [];
    for (const input of _inputs) {
      switch (addressType) {
        case AddressType.p2pkh:
        case AddressType.p2sh:
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
        case AddressType.p2tr:
          psbt.addInput({
            hash: input.hash,
            index: input.index,
            witnessUtxo: input.witnessUtxo,
            tapInternalKey: input.tapInternalKey
          })
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

    if (addressType === AddressType.p2tr) {
      const tweakedSigner = account.keypair.tweak(
        crypto.taggedHash(
          'TapTweak',
          account.keypair.publicKey.subarray(1, 33)
        )
      )
      psbt.signAllInputs(tweakedSigner)
    } else {
      psbt.signAllInputs(account.keypair);

      const isValidSignature = psbt.validateSignaturesOfAllInputs(validator);
      if (!isValidSignature) {
        throw new Error(`Error signature invalid`);
      }
    }

    psbt.finalizeAllInputs();
    const hex = psbt.extractTransaction(true).toHex();

    // Validate Glittr TX
    const isValidGlittrTx = await fetchPOST(
      `${this.glittrApi}/validate-tx`,
      {},
      hex
    );
    if (!isValidGlittrTx.is_valid)
      throw new Error(`Glittr Error: TX Invalid ${isValidGlittrTx}`);

    // Broadcast TX
    const txId = await fetchPOST(`${this.electrumApi}/tx`, {}, hex);
    return txId;
  }

  async createAndBroadcastRawTx({
    account,
    inputs,
    outputs,
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
          const txHex = await electrumFetchTxHex(this.electrumApi, this.apiKey, input.txid);
          psbt.addInput({
            hash: input.txid,
            index: input.vout,
            nonWitnessUtxo: Buffer.from(txHex, "hex"),
          });
          break;
        case AddressType.p2wpkh:
          const paymentOutput = payments.p2wpkh({
            address: account.address,
            network: getBitcoinNetwork(this.network),
          }).output!;
          psbt.addInput({
            hash: input.txid,
            index: input.vout,
            witnessUtxo: {
              script: paymentOutput,
              value: input.value,
            },
          });
          break;
        case AddressType.p2tr:
          const tapInternalKey = account.keypair.publicKey.subarray(1, 33)
          const p2trPayments = payments.p2tr({ address: account.address, network: getBitcoinNetwork(this.network), internalPubkey: tapInternalKey })
          const p2trOutput = p2trPayments.output!
          psbt.addInput({
            hash: input.txid,
            index: input.vout,
            witnessUtxo: {
              script: p2trOutput,
              value: input.value
            },
            tapInternalKey,
          })
      }
    }

    for (const output of outputs) {
      if (output.address) {
        psbt.addOutput({ address: output.address, value: output.value });
      } else if (output.script) {
        psbt.addOutput({ script: output.script, value: output.value });
      }
    }

    if (addressType === AddressType.p2tr) {
      const tweakedSigner = account.keypair.tweak(
        crypto.taggedHash(
          'TapTweak',
          account.keypair.publicKey.subarray(1, 33)
        )
      )
      psbt.signAllInputs(tweakedSigner)
    } else {
      psbt.signAllInputs(account.keypair);

      const isValidSignature = psbt.validateSignaturesOfAllInputs(validator);
      if (!isValidSignature) {
        throw new Error(`Error signature invalid`);
      }
    }

    psbt.finalizeAllInputs();
    const hex = psbt.extractTransaction(true).toHex();

    // Validate Glittr TX
    const isValidGlittrTx = await fetchPOST(
      `${this.glittrApi}/validate-tx`,
      {},
      hex
    );
    if (!isValidGlittrTx.is_valid)
      throw new Error(`Invalid Glittr TX Format : ${JSON.stringify(isValidGlittrTx)}`)
    // console.error(`Invalid Glittr TX Format : ${isValidGlittrTx}`)

    const txId = await fetchPOST(
      `${this.electrumApi}/tx`,
      { Authorization: `Bearer ${this.apiKey}` },
      hex
    );
    return txId;
  }

  async createRawTx({
    address,
    inputs,
    outputs,
    publicKey
  }: CreateRawTxParams) {
    const addressType = getAddressType(address)

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
          const txHex = await electrumFetchTxHex(this.electrumApi, this.apiKey, input.txid);
          psbt.addInput({
            hash: input.txid,
            index: input.vout,
            nonWitnessUtxo: Buffer.from(txHex, "hex"),
          });
          break;
        case AddressType.p2wpkh:
          const paymentOutput = payments.p2wpkh({
            address,
            network: getBitcoinNetwork(this.network),
          }).output!;
          psbt.addInput({
            hash: input.txid,
            index: input.vout,
            witnessUtxo: {
              script: paymentOutput,
              value: input.value,
            },
          });
          break;
        case AddressType.p2tr:
          const tapInternalKey = Buffer.from(publicKey, 'hex').subarray(1, 33)
          const p2trPayments = payments.p2tr({ address, network: getBitcoinNetwork(this.network), internalPubkey: tapInternalKey })
          const p2trOutput = p2trPayments.output!
          psbt.addInput({
            hash: input.txid,
            index: input.vout,
            witnessUtxo: {
              script: p2trOutput,
              value: input.value
            },
            tapInternalKey,
          })
      }
    }

    for (const output of outputs) {
      if (output.address) {
        psbt.addOutput({ address: output.address, value: output.value });
      } else if (output.script) {
        psbt.addOutput({ script: output.script, value: output.value });
      }
    }

    return psbt
  }
}
