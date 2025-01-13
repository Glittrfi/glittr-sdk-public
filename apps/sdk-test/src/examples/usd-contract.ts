import {
  Account,
  GlittrSDK,
  OpReturnMessage,
  electrumFetchNonGlittrUtxos,
  BitcoinUTXO,
  Output,
  addFeeToTx,
  txBuilder,
  BlockTxTuple,
  encodeVaruint,
} from "@glittr-sdk/sdk";
import {
  OracleMessage,
  OracleMessageSigned,
} from "@glittr-sdk/sdk/dist/transaction/calltype/types";
import { schnorr, getPublicKey } from "@noble/secp256k1";
import { sha256 } from "bitcoinjs-lib/src/crypto";

const NETWORK = "regtest";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: '1c4938fb-1a10-48c2-82eb-bd34eeb05b20',
  glittrApi: "https://devnet-core-api.glittr.fi", // devnet
  electrumApi: "https://devnet-electrum.glittr.fi" // devnet
});

const creatorAccount = new Account({
  wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
  network: NETWORK,
});

const minterAccount = new Account({
  wif: "cMqUkLHLtHJ4gSBdxAVtgFjMnHkUi5ZXkrsoBcpECGrE2tcJiNDh",
  network: NETWORK,
});

// ORACLE
// Generate a random private key
const oraclePrivateKey = new Uint8Array([
  155, 112, 1, 86, 197, 238, 25, 119, 90, 109, 241, 199, 214, 248, 145, 209,
  253, 107, 11, 21, 162, 36, 125, 70, 42, 12, 110, 21, 177, 251, 9, 79,
]);

// Get the corresponding public key
const oraclePubkey = Array.from(getPublicKey(oraclePrivateKey, true)).slice(1);
console.log("Oracle public key:", Buffer.from(oraclePubkey).toString("hex"));

async function deployUsdContract() {
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
  const tx: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        moa: {
          divisibility: 1,
          live_time: 0,
          mint_mechanism: {
            purchase: {
              input_asset: { raw_btc: {} },
              ratio: {
                oracle: {
                  setting: {
                    pubkey: oraclePubkey,
                    asset_id: 'btc',
                    block_height_slippage: 5
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  const utxos = await electrumFetchNonGlittrUtxos(client.electrumApi, client.apiKey, creatorAccount.p2pkh().address)
  const nonFeeInputs: BitcoinUTXO[] = []
  const nonFeeOutputs: Output[] = [
    { script: txBuilder.compile(tx), value: 0 },
    { address: creatorAccount.p2pkh().address, value: 546 }
  ]

  const { inputs, outputs } = await addFeeToTx(NETWORK, creatorAccount.p2pkh().address, utxos, nonFeeInputs, nonFeeOutputs)

  const txid = await client.createAndBroadcastRawTx({
    account: creatorAccount.p2pkh(),
    inputs,
    outputs
  })

  console.log(`TXID : ${txid}`)
}

async function mint() {
  const contract: BlockTxTuple = [encodeVaruint(101999), encodeVaruint(1)]

  // Get block height
  const blockHeightFetch = await fetch(`${client.electrumApi}/blocks/tip/height`)
  const blockHeight = await blockHeightFetch.json()

  // 1 BTC = 70000 usd
  // 1 sat = 0.0007
  // with divisibilty 8 => 1 sat = 70000
  // times 10**-8 for display

  const oracleMessage: OracleMessage = {
    asset_id: "btc",
    ratio: [encodeVaruint(70000), encodeVaruint(1)], // 1 sats = 70000 asset
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

  const tx: OpReturnMessage = {
    contract_call: {
      contract: contract,
      call_type: {
        mint: {
          pointer: encodeVaruint(1), // Points to the mint receiver's index in Output array
          oracle_message: oracleSignedMessage
        }
      }
    }
  }

  const utxos = await electrumFetchNonGlittrUtxos(client.electrumApi, client.apiKey, minterAccount.p2pkh().address)
  const nonFeeInputs: BitcoinUTXO[] = []
  const nonFeeOutputs: Output[] = [
    { script: txBuilder.compile(tx), value: 0 }, // Output #0 should always be OP_RETURN
    { address: minterAccount.p2pkh().address, value: 546 },
    { address: creatorAccount.p2pkh().address, value: 1000 },
  ]

  const { inputs, outputs } = await addFeeToTx(NETWORK, minterAccount.p2pkh().address, utxos, nonFeeInputs, nonFeeOutputs)

  const txid = await client.createAndBroadcastRawTx({
    account: minterAccount.p2pkh(),
    inputs,
    outputs
  })

  console.log(`TXID : ${txid}`)
}

/**
 * Call deployUsdContract() function first
 * wait for confirmation and indexing
 * then call the mint() function
 */
deployUsdContract()



/**
 * Function to check asset after mint
 * change the mintTxId and mintVout
 * with your mint() fnction result
 */
async function _checkingAsset() {
  const mintTxid = "cece25c03d7d2c1a297eab6eff89965989259953c0b55e08c3f1370a0ecdfdc8"
  const mintVout = 0
  const assetFetch = await fetch(`${client.glittrApi}/assets/${mintTxid}/${mintVout}`)
  const asset = await assetFetch.text()

  console.log(`Asset : ${asset}`)
}
