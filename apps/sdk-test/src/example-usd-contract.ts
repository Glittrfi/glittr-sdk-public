import { sign } from "@bitcoinerlab/secp256k1";
import { Account, BlockTxTuple, GlittrSDK, txBuilder } from "@glittr-sdk/sdk";
import {
  OracleMessage,
  OracleMessageSigned,
} from "@glittr-sdk/sdk/dist/transaction/calltype/types";
import { schnorr, utils, getPublicKey } from "@noble/secp256k1";
import { sha256 } from "bitcoinjs-lib/src/crypto";

const NETWORK = "regtest";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: '1c4938fb-1a10-48c2-82eb-bd34eeb05b20',
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

// ORACLE
// Generate a random private key
const oraclePrivateKey = new Uint8Array([
  155, 112, 1, 86, 197, 238, 25, 119, 90, 109, 241, 199, 214, 248, 145, 209,
  253, 107, 11, 21, 162, 36, 125, 70, 42, 12, 110, 21, 177, 251, 9, 79,
]);

// Get the corresponding public key
const oraclePubkey = Array.from(getPublicKey(oraclePrivateKey, true)).slice(1);
console.log("Oracle public key:", Buffer.from(oraclePubkey).toString("hex"));

async function createContract() {
  /// Example: most basic Hermetica implementation
  /// {
  /// TxType: contract,
  /// simpleAsset:{
  /// 	supplyCap: null,
  /// 	divisibility: 8,
  /// 	Livetime: 0,
  /// },
  /// Purchase:{
  /// 	inputAsset: BTC,
  /// 	payTo: pubkey,
  /// 	Ratio: {
  /// 		Oracle: {
  /// 	        oracleKey: pubKey,
  /// 	        Args:{
  ///               satsPerDollar: int,
  ///               purchaseValue: float,
  ///               BLOCKHEIGHT: {AllowedBlockSlippage: -5},
  ///             },
  ///        },
  ///     },
  /// },
  /// }
  ///
  const creatorBitcoinAddress = creatorAccount.p2pkh().address;

  const tx = txBuilder.contractInstantiate({
    divisibility: 1,
    live_time: 0,
    mint_mechanism: {
      purchase: {
        input_asset: "raw_btc",
        ratio: {
          oracle: {
            setting: {
              pubkey: oraclePubkey,
              asset_id: "btc",
              block_height_slippage: 5,
            },
          },
        },
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

async function getCurrentBlockHeight() {
  const electrumApi = "https://devnet-electrum.glittr.fi";

  const result = await fetch(`${electrumApi}/blocks/tip/height`);

  return await result.json();
}

async function mint() {
  const contract: BlockTxTuple = [101999, 1]; // TX: https://explorer.glittr.fi/tx/57fe6b460c1c77d0fb40048d7cd360276a331f980f35c08fcddf60abb1f380e9

  // get current block height
  const blockHeight = await getCurrentBlockHeight();

  // get user utxos

  // 1 BTC = 70000 usd
  // 1 sat = 0.0007
  // with divisibilty 8 => 1 sat = 70000
  // times 10**-8 for display

  const oracleMessage: OracleMessage = {
    asset_id: "btc",
    ratio: [70000, 1], // 1 sats = 70000 asset
    block_height: blockHeight,
  };

  const signature = await schnorr.sign(
    sha256(Buffer.from(JSON.stringify(oracleMessage), "ascii")).toString("hex"),
    oraclePrivateKey
  );

  const oracleSignedMessage: OracleMessageSigned = {
    signature: Array.from(signature),
    message: oracleMessage,
  };

  const tx = txBuilder.contractCall({
    contract: contract,
    call_type: {
      mint: {
        pointer: 0, // 1 is op_return, 0 is specified, last is remainder
        oracle_message: oracleSignedMessage,
      },
    },
  });

  // mint 1000 sats, gets 70000000 == 0.7 usd
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
    "cece25c03d7d2c1a297eab6eff89965989259953c0b55e08c3f1370a0ecdfdc8";
  const vout = 0;
  const result = await fetch(
    `https://devnet-core-api.glittr.fi/assets/${assetTxId}/${vout}`
  );

  console.log(await result.text());
}

mint();
