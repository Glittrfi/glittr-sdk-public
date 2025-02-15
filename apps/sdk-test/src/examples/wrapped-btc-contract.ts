import {
  Account,
  addFeeToTx,
  BitcoinUTXO,
  BlockTxTuple,
  electrumFetchNonGlittrUtxos,
  encodeVaruint,
  GlittrSDK,
  OpReturnMessage,
  Output,
  txBuilder
} from "@glittr-sdk/sdk";

const NETWORK = "regtest";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: "",
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

console.log(`Creator account ${creatorAccount.p2pkh().address}`);
console.log(`Minter account ${minterAccount.p2pkh().address}`);


async function deployWbtcContract() {
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

  const tx: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        moa: {
          divisibility: 8,
          live_time: 0,
          supply_cap: encodeVaruint(21000000),
          mint_mechanism: {
            purchase: {
              input_asset: { raw_btc: {} },
              ratio: { fixed: { ratio: [encodeVaruint(1), encodeVaruint(1)] } } // 1:1 ratio
            }
          }
        }
      }
    }
  }

  const address = creatorAccount.p2pkh().address
  const utxos = await electrumFetchNonGlittrUtxos(client, address)
  const nonFeeInputs: BitcoinUTXO[] = []
  const nonFeeOutputs: Output[] = [
    { script: txBuilder.compile(tx), value: 0 }, // Output #0 should always be OP_RETURN
    { address: address, value: 546 }
  ]

  const { inputs, outputs } = await addFeeToTx(NETWORK, address, utxos, nonFeeInputs, nonFeeOutputs)

  const txid = await client.createAndBroadcastRawTx({
    account: creatorAccount.p2pkh(),
    inputs,
    outputs
  })

  console.log(`TXID : ${txid}`)
}

async function mint() {
  // Change this to your deployWbtcContract() result
  const contract: BlockTxTuple = [encodeVaruint(101869), encodeVaruint(1)]; // https://explorer.glittr.fi/tx/688cbe5f4c147e46ef3ed2bbf448291c2041a7ab14ee9032ce1153b1ce89ed6e

  const tx: OpReturnMessage = {
    contract_call: {
      contract,
      call_type: {
        mint: {
          pointer: encodeVaruint(1) // Points to the mint receiver's index in Output array 
        }
      }
    }
  }

  const address = minterAccount.p2pkh().address
  const utxos = await electrumFetchNonGlittrUtxos(client, address)
  const nonFeeInputs: BitcoinUTXO[] = []
  const nonFeeOutputs: Output[] = [
    { script: txBuilder.compile(tx), value: 0 }, // Output #0 should always be OP_RETURN
    { address: address, value: 546 },
    { address: creatorAccount.p2pkh().address, value: 1000 } // Mint 1000 sats
  ]

  const { inputs, outputs } = await addFeeToTx(NETWORK, address, utxos, nonFeeInputs, nonFeeOutputs)

  const txid = await client.createAndBroadcastRawTx({
    account: minterAccount.p2pkh(),
    inputs,
    outputs
  })

  console.log(`TXID : ${txid}`)
}

/**
 * Call deployWbtcContract() function first
 * wait for confirmation and indexing
 * then call the mint() function
 */
deployWbtcContract()



/**
 * Function to check asset after mint
 * change the mintTxId and mintVout
 * with your vestedMint() and freeMint() result
 */
async function _checkingAsset() {
  const mintTxid =
    "a320545261eb503ba305ebaf3e7bcaa7534c905b91b03a51759cf8e8128808de";
  const mintVout = 0;
  const result = await fetch(
    `https://devnet-core-api.glittr.fi/assets/${mintTxid}/${mintVout}`
  );

  console.log(await result.text());
}