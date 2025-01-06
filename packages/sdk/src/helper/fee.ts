import { FEE_TX_EMPTY_SIZE, FEE_TX_INPUT_BASE, FEE_TX_INPUT_PUBKEYHASH, FEE_TX_INPUT_SEGWIT, FEE_TX_INPUT_TAPROOT, FEE_TX_OUTPUT_BASE, FEE_TX_OUTPUT_PUBKEYHASH, FEE_TX_OUTPUT_SCRIPTHASH, FEE_TX_OUTPUT_SEGWIT, FEE_TX_OUTPUT_SEGWIT_SCRIPTHASH } from "../client/coinselect";
import { Network } from "../types";
import { BitcoinUTXO, Output } from "../utxo";

// Add these type definitions at the top
type FeeRateLevel = 'HIGH' | 'MEDIUM' | 'LOW';

const DEFAULT_FEE_RATES = {
  MAINNET: {
    HIGH: 25,
    MEDIUM: 15,
    LOW: 5
  },
  TESTNET: {
    HIGH: 10,
    MEDIUM: 5,
    LOW: 1
  },
  REGTEST: {
    HIGH: 1,
    MEDIUM: 1,
    LOW: 1
  }
};

export async function getFeeRate(
  network: Network,
  level?: FeeRateLevel,
  mempoolUrl?: string
): Promise<number> {
  // For regtest, always use minimal fee rate
  if (network === 'regtest') {
    return DEFAULT_FEE_RATES.REGTEST[level || 'MEDIUM'];
  }

  // For mainnet/testnet, try to get from mempool if URL provided
  if (mempoolUrl) {
    try {
      const response = await fetch(mempoolUrl);
      const fees = await response.json();

      switch (level) {
        case 'HIGH':
          return fees.fastestFee;
        case 'MEDIUM':
          return fees.halfHourFee;
        case 'LOW':
          return fees.minimumFee;
      }
    } catch (error) {
      console.warn('Failed to fetch fee rates, using defaults');
    }
  }

  // Cast the network string to the correct type
  const networkKey = network.toUpperCase() as keyof typeof DEFAULT_FEE_RATES;
  return DEFAULT_FEE_RATES[networkKey][level || 'MEDIUM'];
}

export function getInputBytes(input: BitcoinUTXO) {
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

export function getOutputBytes(output: Output) {
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


export function getTransactionBytes(inputs: BitcoinUTXO[], outputs: Output[]) {
  return (
    FEE_TX_EMPTY_SIZE +
    inputs.reduce((prev, input) => prev + getInputBytes(input), 0) +
    outputs.reduce((prev, output) => prev + getOutputBytes(output), 0)
  );
}

export async function addFeeToTx(network: Network, address: string, utxos: BitcoinUTXO[], inputs: BitcoinUTXO[], outputs: Output[]) {
  const feeRate = await getFeeRate(network);
  const txBytes = getTransactionBytes(inputs, outputs);
  const totalFee = feeRate * txBytes;

  for (const utxo of utxos) {
    if (inputs.some(input => input.txid === utxo.txid && input.vout === utxo.vout)) continue

    inputs.push(utxo)

    const totalInputValue = inputs.reduce((prev, input) => prev + input.value, 0);
    const totalOutputValue = outputs.reduce((prev, output) => prev + output.value!, 0);
    if (totalInputValue >= totalOutputValue + totalFee + 1000) break
  }

  // Calculate change amount
  const changeAmountBytes = FEE_TX_OUTPUT_BASE + FEE_TX_OUTPUT_PUBKEYHASH
  const txBytesAfterFee = getTransactionBytes(inputs, outputs)
  const feeWithChangeAmount = feeRate * (txBytesAfterFee + changeAmountBytes)
  const remainderAfterChangeAmount =
    inputs.reduce((prev, input) => prev + input.value, 0) -
    (outputs.reduce((prev, output) => prev + output.value, 0) + feeWithChangeAmount + totalFee)

  const changeFee = feeRate * (FEE_TX_OUTPUT_BASE + FEE_TX_OUTPUT_PUBKEYHASH)
  if (remainderAfterChangeAmount > 546 && remainderAfterChangeAmount > changeFee) {
    outputs.push({
      address,
      value: remainderAfterChangeAmount
    })
  }

  // Final validation temporary disabled
  // const finalTxBytes = getTransactionBytes(inputs, outputs);
  // const finalFee = inputs.reduce((prev, input) => prev + input.value, 0) -
  //   outputs.reduce((prev, output) => prev + output.value, 0);
  // if (finalFee / finalTxBytes < 1) {
  //   throw new Error('Transaction fee rate too low. Minimum required is 1 sat/vbyte.');
  // }

  return { inputs, outputs }
}