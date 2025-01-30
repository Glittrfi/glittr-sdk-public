import { AddressType } from "bitcoin-address-validation";
import { getAddressType } from "../utils/address";
import { BitcoinUTXO, Output } from "../utxo";
import { networks, payments } from "bitcoinjs-lib";
import { OpReturnMessage } from "../transaction";
import { electrumFetchTxHex, electrumFetchNonGlittrUtxos } from "../utils/electrum";
import { getInputBytes, getOutputBytes, getTransactionBytes } from "../helper/fee";
import { fetchGET } from "../utils/fetch";
import { GlittrSDK } from ".";
import { decodeVaruint, encodeVaruint, getBitcoinNetwork } from "../utils";

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
  // @ts-ignore
  return data?.reduce((prev: any, input: any) => prev + (input.value || 0), 0);
}

function _isTxContainsOnlyTransfer(tx: OpReturnMessage) {
  // Check if tx has exactly one key and it's 'transfer'
  const keys = Object.keys(tx);
  if (keys.length === 1 && keys[0] === 'transfer' && tx.transfer?.transfers) {
    return tx.transfer.transfers.map(transfer => ({
      asset: transfer.asset,
      amount: transfer.amount
    }));
  }
  return null;
}

function _isTxContainsMintContractCall(tx: OpReturnMessage) {
  if (tx.contract_call && tx.contract_call.call_type && 'mint' in tx.contract_call.call_type) {
    const mintCall = tx.contract_call.call_type.mint;
    return {
      contract: tx.contract_call.contract,
      pointer: mintCall.pointer,
    };
  }
  return null;
}

export async function coinSelect(
  client: GlittrSDK,
  inputs: BitcoinUTXO[],
  outputs: Output[],
  feeRate: number,
  address: string,
  tx: OpReturnMessage,
  changeOutputAddress?: string,
  publicKey?: string,
) {
  let txBytes = getTransactionBytes(inputs, outputs);
  let totalInputValue = inputs.reduce((prev, input) => prev + input.value, 0);
  const totalOutputValue = outputs.reduce(
    (prev, output) => prev + output.value!,
    0
  );

  let totalFee = feeRate * txBytes;
  // if (totalInputValue < totalOutputValue + totalFee) {
  //   return;
  // }

  const utxos = await electrumFetchNonGlittrUtxos(client, address);

  const fetchGlittrAsset = async (txId: string, vout: number) => {
    try {
      const asset = await fetchGET(
        `${client.glittrApi}/assets/${txId}/${vout}`,
        { Authorization: `Bearer ${client.apiKey}` },
      )
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
    const asset = JSON.parse(assetString);
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
      const utxoBytes = getInputBytes(utxo);
      const utxoFee = feeRate * utxoBytes;
      const utxoValue = utxo.value;

      if (utxoFee > utxoValue) continue;

      txBytes += utxoBytes;
      totalInputValue += utxoValue;
      inputs.push(utxo);

      if (totalInputValue >= totalOutputValue + totalFee) break;
    }
  };


  if (_isTxContainsOnlyTransfer(tx)) {
    const transferAssets = _isTxContainsOnlyTransfer(tx);
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
      const _amount = decodeVaruint(amount)
      const assetId = `${asset[0]}:${asset[1]}`;

      // If input asset is enough, continue to next asset
      if (getInputAssetSum(assetId) === BigInt(_amount)) {
        continue;
      }

      // Loop through relevant UTXOs till input asset is enough or more
      for (const utxo of relevantUtxos) {
        if (getInputAssetSum(assetId) >= BigInt(_amount)) break;
        if (inputs.some(input => input.txid === utxo.txid)) continue;

        addUtxosToInputs([utxo], feeRate);
      }

      // If input asset is still not enough, throw error
      if (getInputAssetSum(assetId) < BigInt(_amount)) {
        throw new Error(`Insufficient balance for asset ${assetId}. Required: ${_amount}, Available: ${getInputAssetSum(assetId)}`);
      }

      const excessAssetValue = getInputAssetSum(assetId) - BigInt(_amount);
      if (excessAssetValue > 0) {
        // TODO handle excess asset input
        // - add excess amount transfer tx into transfer.transfers
        tx?.transfer?.transfers.push({
          asset: asset,
          amount: encodeVaruint(excessAssetValue),
          output: encodeVaruint(outputs.length),
        });

        // - add output for excess amount to the sender address
        outputs.push({
          value: 546,
          address: address,
        });
        txBytes += getOutputBytes({
          value: 546,
          address: address,
        });
        totalFee = feeRate * txBytes;

        // - make sure the transfer index and output is matched
      }
    }
  }

  // // TODO handle mint, add output from mint pointer
  // if (_isTxContainsMintContractCall(tx)) {
  //   const mintCall = _isTxContainsMintContractCall(tx);
  //   if (!mintCall) throw new Error("Mint TX invalid");
  // }

  if (totalInputValue < totalOutputValue + totalFee) {
    addUtxosToInputs(nonUtxosGlittr, feeRate);
  }

  // TODO handle multiple utxo type in one array
  let utxoInputs = [];
  const addressType = getAddressType(address);
  for (const utxo of inputs) {
    switch (addressType) {
      case AddressType.p2pkh:
      case AddressType.p2sh:
        const txHex = await electrumFetchTxHex(client.electrumApi, client.apiKey, utxo.txid);
        utxoInputs.push({
          hash: utxo.txid,
          index: utxo.vout,
          nonWitnessUtxo: Buffer.from(txHex, "hex"),
        });
        break;
      case AddressType.p2wpkh:
        const paymentOutput = payments.p2wpkh({ address, network: getBitcoinNetwork(client.network) }).output!;
        utxoInputs.push({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: paymentOutput,
            value: utxo.value,
          },
        });
        break;
      case AddressType.p2tr:
        const p2trOutput = payments.p2tr({ address, network }).output!;
        utxoInputs.push({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: p2trOutput,
            value: utxo.value,
          },
          tapInternalKey: publicKey ? Buffer.from(publicKey, 'hex') : undefined
        })
        break;
    }
  }

  // Finalize
  let changeFee = FEE_TX_OUTPUT_BASE + FEE_TX_OUTPUT_PUBKEYHASH;
  if (changeOutputAddress) {
    changeFee = getOutputBytes({ address, value: 0 }); // value: 0 is dummy
  }
  const bytesAccum = getTransactionBytes(inputs, outputs);
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

  const txFee = getTransactionBytes(inputs, outputs) * feeRate;

  return { inputs: utxoInputs, outputs, fee, txFee, tx };
}

export function dustThreshold(feeRate: number) {
  return FEE_TX_INPUT_BASE + FEE_TX_INPUT_PUBKEYHASH * feeRate;
}
