import {
  Account,
  GlittrSDK,
  Output,
  OpReturnMessage,
  BlockTxTuple,
  electrumFetchNonGlittrUtxos,
  BitcoinUTXO,
  txBuilder,
  addFeeToTx,
} from "@glittr-sdk/sdk";

const NETWORK = "regtest";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: "",
  // glittrApi: "https://devnet-core-api.glittr.fi", // devnet
  // electrumApi: "https://devnet-electrum.glittr.fi" // devnet
  // glittrApi: "https://testnet-core-api.glittr.fi", // testnet
  // electrumApi: "https://testnet-electrum.glittr.fi", // testnet
  glittrApi: "http://127.0.0.1:3001",
  electrumApi: "http://127.0.0.1:3002",
});

const minterAccount = new Account({
  wif: "cMqUkLHLtHJ4gSBdxAVtgFjMnHkUi5ZXkrsoBcpECGrE2tcJiNDh",
  network: NETWORK,
});

const sumArray = (arr: any[]) =>
  arr.reduce((total, current) => total + current, 0);

const contractTupleToString = (contract: [number, number]) => {
  return contract[0] + ":" + contract[1];
};

const calculateOutAmount = async (
  contract: [number, number],
  contractInput: [number, number],
  amount: number
): Promise<number> => {
  const contractState = await client.getContractState(contract[0], contract[1]);

  const outputContract = Object.keys(
    contractState.collateralized.amounts
  ).filter((item: string) => item !== contractTupleToString(contractInput))[0]!;

  const inputTotalSupply =
    contractState.collateralized.amounts[contractTupleToString(contractInput)];
  const outputTotalSupply =
    contractState.collateralized.amounts[outputContract];

  const outputAmount = Math.floor(
    outputTotalSupply -
      (inputTotalSupply * outputTotalSupply) / (inputTotalSupply + amount)
  );

  if (outputAmount == 0) {
    throw new Error("Calculated output amount is 0");
  }

  return outputAmount;
};

async function mint() {
  // Swap the first asset with the second asset
  const contract: BlockTxTuple = [27082, 1];
  const firstContract: BlockTxTuple = [27048, 1];
  const address = minterAccount.p2tr().address;

  const inputAssetsFirst = await client.getAssetUtxos(
    address,
    firstContract[0] + ":" + firstContract[1]
  );

  const totalInput = sumArray(
    inputAssetsFirst.map((item) => parseInt(item.assetAmount))
  );
  const totalInputUsed = 10;
  console.log(`Total Input Asset: ${totalInput}`);
  console.log(`Total Input Amount: ${totalInputUsed}`);

  // Slippage calculation

  const outAmount = await calculateOutAmount(
    contract,
    firstContract,
    totalInputUsed
  );
  console.log(`[+] Calculated output amount is: ${outAmount}`);
  const slippagePercentage = 10;
  const minOutputAmount = Math.floor(outAmount - (outAmount * 10) / 100);
  console.log(
    `[+] Minimum output amount is: ${minOutputAmount} (slippage: ${slippagePercentage}%)`
  );

  const tx: OpReturnMessage = {
    contract_call: {
      contract,
      call_type: {
        swap: {
          pointer: 1,
          assert_values: { min_out_value: minOutputAmount.toString() },
        },
      },
    },
    transfer: {
      transfers: [
        {
          asset: firstContract, 
          output: 2,
          amount: (totalInput - totalInputUsed).toString(), // just use 10 for swap, the reset will be change for the account
        },
      ],
    },
  };

  const utxos = await electrumFetchNonGlittrUtxos(client, address);

  const nonFeeInputs: BitcoinUTXO[] = inputAssetsFirst;
  const nonFeeOutputs: Output[] = [
    { script: txBuilder.compile(tx), value: 0 }, // Output #0 should alwasy be OP_RETURN
    { address: address, value: 546 },
    { address: address, value: 546 },
  ];

  const { inputs, outputs } = await addFeeToTx(
    NETWORK,
    address,
    utxos,
    nonFeeInputs,
    nonFeeOutputs
  );

  const txid = await client.createAndBroadcastRawTx({
    account: minterAccount.p2tr(),
    inputs,
    outputs,
  });

  console.log(`TXID : ${txid}`);
  console.log("[+] Waiting to be mined");

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const message = await client.getGlittrMessageByTxId(txid);
      console.log("Mined! Response", JSON.stringify(message));
      const assetOutput = await client.getGlittrAsset(txid, 1);
      console.log("Asset output: ", assetOutput);
      break;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  }

}

mint();
