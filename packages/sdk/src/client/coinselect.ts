import { AddressType } from "bitcoin-address-validation";
import { getAddressType } from "../utils/address";
import { BitcoinUTXO, Output } from "../utxo";
import { payments, Psbt } from "bitcoinjs-lib";
import { getBitcoinNetwork } from "../utils";
import {
  MintContractCallFormat,
  TransactionFormat,
  TransferFormat,
} from "../transaction";

export const FEE_TX_EMPTY_SIZE = 4 + 1 + 1 + 4;

export const FEE_TX_INPUT_BASE = 32 + 4 + 1 + 4;
export const FEE_TX_INPUT_PUBKEYHASH = 107;
export const FEE_TX_INPUT_SCRIPTHASH = 1; // calculate based on script length
export const FEE_TX_INPUT_SEGWIT = 27 + 1;
export const FEE_TX_INPUT_SEGWIT_SCRIPTHASH = 0; // calculate based on script length
export const FEE_TX_INPUT_TAPROOT = 17 + 1;

export const FEE_TX_OUTPUT_BASE = 8 + 1;
export const FEE_TX_OUTPUT_PUBKEYHASH = 25;
export const FEE_TX_OUTPUT_SCRIPTHASH = 23;
export const FEE_TX_OUTPUT_SEGWIT = 22;
export const FEE_TX_OUTPUT_SEGWIT_SCRIPTHASH = 34;
export const FEE_TX_OUTPUT_TAPROOT = 34;

export type CoinSelectParams = {};

function _sumValues(data: BitcoinUTXO[] | Output[]) {
  return data.reduce((prev, input) => prev + (input.value || 0), 0);
}

function _isTransferFormat(tx: TransactionFormat): tx is TransferFormat {
  return (tx as TransferFormat).transfer !== undefined;
}

export async function coinSelect(
  inputs: BitcoinUTXO[],
  outputs: Output[],
  feeRate: number,
  address: string,
  tx: TransactionFormat,
  getUtxos: (address: string) => Promise<BitcoinUTXO[]>,
  getTxHex: (txId: string) => Promise<string>,
  getGlittrAsset: (txId: string, vout: number) => Promise<string>,
  changeOutputAddress?: string
) {
  let txBytes = transactionBytes(inputs, outputs);
  let totalInputValue = inputs.reduce((prev, input) => prev + input.value, 0);
  const totalOutputValue = outputs.reduce(
    (prev, output) => prev + output.value!,
    0
  );

  const totalFee = feeRate * txBytes;
  if (totalInputValue > totalOutputValue + totalFee) {
    return;
  }

  const utxos = await getUtxos(address);

  // Separate UTXOs based on asset presence
  const utxosGlittr: BitcoinUTXO[] = [];
  const nonUtxosGlittr: BitcoinUTXO[] = [];

  for (const utxo of utxos) {
    const assetString = await getGlittrAsset(utxo.txid, utxo.vout);
    const asset = JSON.parse(JSON.parse(assetString));
    const assetIsEmpty =
      !asset.assets ||
      !asset.assets.list ||
      Object.keys(asset.assets.list).length === 0;

    assetIsEmpty ? nonUtxosGlittr.push(utxo) : utxosGlittr.push(utxo);
  }

  const addUtxosToInputs = (utxosList: BitcoinUTXO[], feeRate: number) => {
    for (const utxo of utxosList) {
      const utxoBytes = inputBytes(utxo);
      const utxoFee = feeRate * utxoBytes;
      const utxoValue = utxo.value;

      if (utxoFee > utxoValue) continue;

      txBytes += utxoBytes;
      totalInputValue += utxoValue;
      inputs.push(utxo);

      if (totalInputValue >= totalOutputValue + totalFee) break;
    }
  };

  if (_isTransferFormat(tx)) {
    // Add UTXOs from utxosGlittr for transfer type
    addUtxosToInputs(utxosGlittr, feeRate);

    // If still not enough, add UTXOs from nonUtxosGlittr
    if (totalInputValue < totalOutputValue + totalFee) {
      addUtxosToInputs(nonUtxosGlittr, feeRate);
    }
  } else {
    // Add UTXOs from nonUtxosGlittr for non-transfer type
    addUtxosToInputs(nonUtxosGlittr, feeRate);
  }

  // Todo handle multiple utxo type in one array
  let utxoInputs = [];
  const addressType = getAddressType(address);
  for (const utxo of inputs) {
    switch (addressType) {
      case AddressType.p2pkh:
        const txHex = await getTxHex(utxo.txid);
        utxoInputs.push({
          hash: utxo.txid,
          index: utxo.vout,
          nonWitnessUtxo: Buffer.from(txHex, "hex"),
        });
        break;
      case AddressType.p2wpkh:
        const paymentOutput = payments.p2wpkh({ address }).output!;
        utxoInputs.push({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: paymentOutput,
            value: utxo.value,
          },
        });
        break;
    }
  }

  // Finalize
  let changeFee = FEE_TX_OUTPUT_BASE + FEE_TX_OUTPUT_PUBKEYHASH;
  if (changeOutputAddress) {
    changeFee = outputBytes({ address, value: 0 }); // value: 0 is dummy
  }
  const bytesAccum = transactionBytes(inputs, outputs);
  const feeAfterExtraOutput = feeRate * (bytesAccum + changeFee);
  const remainderAfterExtraOutput =
    inputs.reduce((prev, input) => prev + input.value, 0) -
    (outputs.reduce((prev, output) => prev + output.value!, 0) +
      feeAfterExtraOutput);

  if (
    changeOutputAddress &&
    remainderAfterExtraOutput > dustThreshold(feeRate)
  ) {
    outputs.push({
      address: changeOutputAddress,
      value: remainderAfterExtraOutput,
    });
  }

  const fee = _sumValues(inputs) - _sumValues(outputs);
  if (!isFinite(fee)) return { fee: feeRate * bytesAccum };

  const txFee = transactionBytes(inputs, outputs) * feeRate;

  return { inputs: utxoInputs, outputs, fee, txFee };
}

function transactionBytes(inputs: BitcoinUTXO[], outputs: Output[]) {
  return (
    FEE_TX_EMPTY_SIZE +
    inputs.reduce((prev, input) => prev + inputBytes(input), 0) +
    outputs.reduce((prev, output) => prev + outputBytes(output), 0)
  );
}

function inputBytes(input: BitcoinUTXO) {
  let bytes = FEE_TX_INPUT_BASE;

  if (input.redeemScript) {
    bytes += input.redeemScript.length;
  }

  if (input.witnessScript) {
    bytes += Math.ceil(input.witnessScript.byteLength / 4);
  } else if (input.isTaproot) {
    if (input.taprootWitness) {
      bytes += Math.ceil(
        FEE_TX_INPUT_TAPROOT +
          input.taprootWitness.reduce(
            (prev, buffer) => prev + buffer.byteLength,
            0
          ) /
            4
      );
    } else {
      bytes += FEE_TX_INPUT_TAPROOT;
    }
  } else if (input.witnessUtxo) {
    bytes += FEE_TX_INPUT_SEGWIT;
  } else if (!input.redeemScript) {
    bytes += FEE_TX_INPUT_PUBKEYHASH;
  }

  return bytes;
}

function outputBytes(output: Output) {
  let bytes = FEE_TX_OUTPUT_BASE;

  if (output.script) {
    bytes += output.script.byteLength;
  } else if (
    output.address?.startsWith("bc1") || // mainnet
    output.address?.startsWith("tb1") || // testnet
    output.address?.startsWith("bcrt1") // regtest
  ) {
    // 42 for mainnet/testnet, 44 for regtest
    if (output.address?.length === 42 || output.address?.length === 44) {
      bytes += FEE_TX_OUTPUT_SEGWIT;
    } else {
      // taproot fee approximate is same like p2wsh (2 of 3 multisig)
      bytes += FEE_TX_OUTPUT_SEGWIT_SCRIPTHASH;
    }
    // both testnet and regtest has the same prefix 2
  } else if (
    output.address?.startsWith("3") ||
    output.address?.startsWith("2")
  ) {
    bytes += FEE_TX_OUTPUT_SCRIPTHASH;
  } else {
    bytes += FEE_TX_OUTPUT_PUBKEYHASH;
  }

  return bytes;
}

export function dustThreshold(feeRate: number) {
  return FEE_TX_INPUT_BASE + FEE_TX_INPUT_PUBKEYHASH * feeRate;
}
