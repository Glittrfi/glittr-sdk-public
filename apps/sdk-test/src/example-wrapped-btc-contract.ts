import { Account, BlockTxTuple, GlittrSDK, txBuilder } from "@glittr-sdk/sdk";

const NETWORK = "regtest";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: '1c4938fb-1a10-48c2-82eb-bd34eeb05b20',
  glittrApi: "https://devnet-core-api.glittr.fi",
  electrumApi: "https://devnet-electrum.glittr.fi",
});

const creatorAccount = new Account({
  wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
  network: NETWORK,
});

const minterAccount = new Account({
  wif: "cMqUkLHLtHJ4gSBdxAVtgFjMnHkUi5ZXkrsoBcpECGrE2tcJiNDh",
  network: NETWORK,
});

console.log(`Creator account ${creatorAccount.p2pkh().address}`);
console.log(`Minter account ${minterAccount.p2pkh().address}`);

async function createContract() {
  ///Example: most basic gBTC implementation
  /// {
  ///     TxType: Contract,
  ///     SimpleAsset:{
  ///         supplyCap: 21000000,
  ///         Divisibility: 8
  ///         Livetime: 0
  ///     },
  ///     Purchase:{
  ///         inputAsset: BTC,
  ///         payTo: bitcoinAddress,
  ///         Ratio: 1,
  ///     }
  ///     }
  const creatorBitcoinAddress = creatorAccount.p2pkh().address;

  const tx = txBuilder.contractInstantiate({
    divisibility: 8,
    live_time: 0,
    supply_cap: 21000000n.toString(),
    mint_mechanism: {
      purchase: {
        input_asset: "raw_btc",
        ratio: { fixed: { ratio: [1, 1] } }, // 1:1 ratio
      },
    },
  });

  const txid = await client.createAndBroadcastTx({
    account: creatorAccount.p2pkh(),
    tx,
    outputs: [{ address: creatorAccount.p2pkh().address, value: 546 }],
  });

  console.log(`TX: https://explorer.glittr.fi/tx/${txid}`);
}

async function mint() {
  const contract: BlockTxTuple = [101869, 1]; // https://explorer.glittr.fi/tx/688cbe5f4c147e46ef3ed2bbf448291c2041a7ab14ee9032ce1153b1ce89ed6e

  const tx = txBuilder.contractCall({
    contract,
    call_type: {
      mint: {
        pointer: 0, // 1 is op_return, 0 is specified, last is remainder
      },
    },
  });

  // mint 1000 sats
  const txid = await client.createAndBroadcastTx({
    account: minterAccount.p2pkh(),
    tx,
    outputs: [
      { address: minterAccount.p2pkh().address, value: 546 },
      { address: creatorAccount.p2pkh().address, value: 1000 },
    ],
  });

  console.log(`TX: https://explorer.glittr.fi/tx/${txid}`);
}

async function checkingAsset() {
  const assetTxId =
    "a320545261eb503ba305ebaf3e7bcaa7534c905b91b03a51759cf8e8128808de";
  const vout = 0;
  const result = await fetch(
    `https://devnet-core-api.glittr.fi/assets/${assetTxId}/${vout}`
  );

  console.log(await result.text());
}

checkingAsset();
