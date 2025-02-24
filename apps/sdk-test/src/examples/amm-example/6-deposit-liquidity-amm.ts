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

const creatorAccount = new Account({
  wif: "cU6mHpUnEn6MB3uwAhUgNvXW3ChsWZBm3AVY7cT3BnK7kVghdrTN",
  network: NETWORK,
});

async function mint() {
  const contract: BlockTxTuple = [27082, 1];

  const contractInfo = await client.getGlittrMessage(contract[0], contract[1]);
  const firstContract: BlockTxTuple =
    contractInfo.message.message.contract_creation.contract_type.mba
      .mint_mechanism.collateralized.input_assets[0].glittr_asset;
  const secondContract: BlockTxTuple =
    contractInfo.message.message.contract_creation.contract_type.mba
      .mint_mechanism.collateralized.input_assets[1].glittr_asset;
  const address = creatorAccount.p2tr().address;

  const inputAssetsFirst = await client.getAssetUtxos(
    address,
    firstContract[0] + ":" + firstContract[1]
  );
  const inputAssetsSecond = await client.getAssetUtxos(
    address,
    secondContract[0] + ":" + secondContract[1]
  );

  if (inputAssetsFirst.length == 0) {
    throw new Error(
      `You do not have assets for ${firstContract[0] + ":" + firstContract[1]}`
    );
  }

  if (inputAssetsSecond.length == 0) {
    throw new Error(
      `You do not have assets for ${secondContract[0] + ":" + secondContract[1]}`
    );
  }

  const sumArray = (arr: any[]) =>
    arr.reduce((total, current) => total + current, 0);

  const totalHoldFirstAsset = sumArray(
    inputAssetsFirst.map((item) => parseInt(item.assetAmount))
  );
  const totalHoldSecondAsset = sumArray(
    inputAssetsSecond.map((item) => parseInt(item.assetAmount))
  );
  console.log(`Total hold ${firstContract} : ${totalHoldFirstAsset}`);
  console.log(`Total hold ${secondContract} : ${totalHoldSecondAsset}`);

  const firstContractAmountForLiquidity = 100;
  const secondContractAmountForLiquidity = 100;

  if (firstContractAmountForLiquidity > totalHoldFirstAsset) {
    throw new Error(`Amount for contract ${firstContract} insufficient`);
  }

  if (secondContractAmountForLiquidity > totalHoldSecondAsset) {
    throw new Error(`Amount for contract ${secondContract} insufficient`);
  }

  const tx: OpReturnMessage = {
    contract_call: {
      contract,
      call_type: {
        mint: {
          pointer: 1,
        },
      },
    },
    transfer: {
      transfers: [
        {
          asset: firstContract,
          output: 1,
          amount: (
            totalHoldFirstAsset - firstContractAmountForLiquidity
          ).toString(),
        },
        {
          asset: secondContract,
          output: 1,
          amount: (
            totalHoldSecondAsset - secondContractAmountForLiquidity
          ).toString(),
        },
      ],
    },
  };

  const utxos = await electrumFetchNonGlittrUtxos(client, address);

  const nonFeeInputs: BitcoinUTXO[] = inputAssetsFirst
    .concat(inputAssetsSecond)
    .filter((value, index, arr) => {
      const _value = JSON.stringify(value);
      return index === arr.findIndex(obj => {
        return JSON.stringify(obj) === _value;
      });
    }); // remove duplicates
  const nonFeeOutputs: Output[] = [
    { script: txBuilder.compile(tx), value: 0 }, // Output #0 should alwasy be OP_RETURN
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
    account: creatorAccount.p2tr(),
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
      break;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  }
}

mint();
