import { AddressType } from "bitcoin-address-validation";
import { getAddressType } from "../utils/address";
import { BitcoinUTXO, Output } from "../utxo";
import { networks, payments } from "bitcoinjs-lib";
import { OpReturnMessage } from "../transaction";
import { electrumFetchTxHex, electrumFetchUtxos } from "../utils/electrum";

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

function _isTxContainsTransfer(tx: OpReturnMessage) {
  if (tx.transfer && tx.transfer.transfers) {
    return tx.transfer.transfers.map(transfer => ({
      asset: transfer.asset,
      amount: transfer.amount
    }));
  }
  return null;
}

export async function coinSelect(
  network: networks.Network,
  inputs: BitcoinUTXO[],
  outputs: Output[],
  feeRate: number,
  address: string,
  tx: OpReturnMessage,
  electrumApi: string,
  glittrApi: string,
  changeOutputAddress?: string
) {
  let txBytes = transactionBytes(inputs, outputs);
  let totalInputValue = inputs.reduce((prev, input) => prev + input.value, 0);
  const totalOutputValue = outputs.reduce(
    (prev, output) => prev + output.value!,
    0
  );

  let totalFee = feeRate * txBytes;
  // if (totalInputValue < totalOutputValue + totalFee) {
  //   return;
  // }

  const utxos = await electrumFetchUtxos(electrumApi, address);

  const fetchGlittrAsset = async (txId: string, vout: number) => {
    try {
      const assetFetch = await fetch(
        `${glittrApi}/assets/${txId}/${vout}`
      );
      const asset = await assetFetch.text();

      return JSON.stringify(asset);
    } catch (e) {
      throw new Error(`Error fetching Glittr Asset : ${e}`);
    }
  }
  // Separate UTXOs based on asset presence
  const utxosGlittr: BitcoinUTXO[] = [];
  const nonUtxosGlittr: BitcoinUTXO[] = [];

  for (const utxo of utxos) {
    const assetString = await fetchGlittrAsset(utxo.txid, utxo.vout);
    const asset = JSON.parse(JSON.parse(assetString));
    const assetIsEmpty =
      !asset.assets ||
      !asset.assets.list ||
      Object.keys(asset.assets.list).length === 0;

    if (assetIsEmpty) {
      nonUtxosGlittr.push(utxo);
    } else {
      // Convert the asset list object into the required format
      const glittrUtxo: BitcoinUTXO = {
        ...utxo,
        assets: Object.entries(asset.assets.list).map(([assetId, amount]) => ({
          asset: assetId,
          amount: amount as number
        }))
      };
      utxosGlittr.push(glittrUtxo);
    }
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


  if (_isTxContainsTransfer(tx)) {
    const transferAssets = _isTxContainsTransfer(tx);
    if (!transferAssets) throw new Error("Transfer TX invalid");


    // Filter utxosGlittr to only include UTXOs that contain the required transfer assets
    const relevantUtxos = utxosGlittr.filter(utxo => {
      return transferAssets?.some(transfer =>
        utxo.assets?.some(asset =>
          Array.isArray(transfer.asset) &&
          asset.asset === `${transfer.asset[0]}:${transfer.asset[1]}` 
          // && BigInt(asset.amount) >= BigInt(transfer.amount)
        )
      );
    });

    addUtxosToInputs(relevantUtxos, feeRate);

    // Handle if input asset is enough or more
    const getInputAssetSum = (assetId: string) => {
      return inputs.reduce((sum, input) => {
        const matchingAsset = input.assets?.find(a => a.asset === assetId);
        return sum + BigInt(matchingAsset?.amount || 0);
      }, BigInt(0));
    }

    // Check if glittr asset inputs are enough
    for (const { asset, amount } of transferAssets) {
      const assetId = `${asset[0]}:${asset[1]}`;

      // If input asset is enough, continue to next asset
      if (getInputAssetSum(assetId) === BigInt(amount)) {
        continue;
      }

      // Loop through relevant UTXOs till input asset is enough or more
      for (const utxo of relevantUtxos) {
        if (getInputAssetSum(assetId) >= BigInt(amount)) break;
        if (inputs.some(input => input.txid === utxo.txid)) continue;
        
        addUtxosToInputs([utxo], feeRate);
      }

      // If input asset is still not enough, throw error
      if (getInputAssetSum(assetId) < BigInt(amount)) {
        throw new Error(`Insufficient balance for asset ${assetId}. Required: ${amount}, Available: ${getInputAssetSum(assetId)}`);
      }

      const excessAssetValue = getInputAssetSum(assetId) - BigInt(amount);
      if (excessAssetValue > 0) {
        // TODO handle excess asset input
        // - add excess amount transfer tx into transfer.transfers
        tx?.transfer?.transfers.push({
          asset: asset,
          amount: excessAssetValue.toString(),
          output: outputs.length,
        });

        // - add output for excess amount to the sender address
        outputs.push({
          value: 546,
          address: address,
        });
        txBytes += outputBytes({
          value: 546,
          address: address,
        });
        totalFee = feeRate * txBytes;

        // - make sure the transfer index and output is matched
      }
    }

    // Check if utxo inputs are enough, add from nonUtxosGlittr
    if (totalInputValue < totalOutputValue + totalFee) {
      addUtxosToInputs(nonUtxosGlittr, feeRate);
    }

  } else {
    // Add UTXOs from nonUtxosGlittr for non-transfer type
    addUtxosToInputs(nonUtxosGlittr, feeRate);
  }

  // TODO handle multiple utxo type in one array
  let utxoInputs = [];
  const addressType = getAddressType(address);
  for (const utxo of inputs) {
    switch (addressType) {
      case AddressType.p2pkh:
        const txHex = await electrumFetchTxHex(electrumApi, utxo.txid);
        utxoInputs.push({
          hash: utxo.txid,
          index: utxo.vout,
          nonWitnessUtxo: Buffer.from(txHex, "hex"),
        });
        break;
      case AddressType.p2wpkh:
        const paymentOutput = payments.p2wpkh({ address, network }).output!;
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

  return { inputs: utxoInputs, outputs, fee, txFee, tx };
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
