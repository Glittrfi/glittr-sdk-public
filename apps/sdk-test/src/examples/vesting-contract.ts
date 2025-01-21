import {
  Account,
  GlittrSDK,
  Fraction,
  OpReturnMessage,
  electrumFetchNonGlittrUtxos,
  BitcoinUTXO,
  Output,
  addFeeToTx,
  txBuilder,
  BlockTxTuple,
} from "@glittr-sdk/sdk";

const NETWORK = "regtest";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: '1c4938fb-1a10-48c2-82eb-bd34eeb05b20',
  glittrApi: "https://devnet-core-api.glittr.fi", // devnet
  electrumApi: "https://devnet-electrum.glittr.fi" // devnet
});

const account = new Account({
  wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
  network: NETWORK,
});

const reserveAccount = new Account({
  wif: "cMqUkLHLtHJ4gSBdxAVtgFjMnHkUi5ZXkrsoBcpECGrE2tcJiNDh",
  network: NETWORK,
});

const freeMintAccount = new Account({
  wif: "cTAxMkLUFE9YfQKgycwimpYoFp1KqqmFYZGboD3inKgucoREotpp",
  network: NETWORK,
});

async function deployVestingContract() {
  const receiver1PublicKey = Array.from(account.p2pkh().keypair.publicKey);
  const receiver2PublicKey = Array.from(
    reserveAccount.p2pkh().keypair.publicKey
  );

  const quarterlyVesting: [Fraction, number][] = [
    [[25, 100], -1], // 25% unlocked after 1 blocks
    [[25, 100], -2], // 25% unlocked after 2 blocks
    [[25, 100], -3], // 25% unlocked after 3 blocks
    [[25, 100], -4], // 25% unlocked after 4 blocks
  ];

  const tx: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        moa: {
          divisibility: 100,
          live_time: 0,
          supply_cap: 1000n.toString(),
          mint_mechanism: {
            preallocated: {
              allocations: {
                "100": [receiver1PublicKey],
                "200": [receiver2PublicKey]
              },
              vesting_plan: {
                scheduled: quarterlyVesting
              }
            },
            free_mint: {
              supply_cap: 700n.toString(),
              amount_per_mint: 1n.toString()
            }
          }
        }
      }
    }
  }

  const address = account.p2pkh().address
  const utxos = await electrumFetchNonGlittrUtxos(client, address)
  const nonFeeInputs: BitcoinUTXO[] = []
  const nonFeeOutputs: Output[] = [
    { script: txBuilder.compile(tx), value: 0 }, // Output #0 should always be OP_RETURN
    { address: address, value: 546 }
  ]

  const { inputs, outputs } = await addFeeToTx(NETWORK, address, utxos, nonFeeInputs, nonFeeOutputs)

  const txid = await client.createAndBroadcastRawTx({
    account: account.p2pkh(),
    inputs,
    outputs
  })

  console.log(`TXID : ${txid}`)
}

async function vestedMint() {
  const contract: BlockTxTuple = [101832, 1]; // https://explorer.glittr.fi/tx/8bb7f3332eb1c50d25ae31c1a06c2af56dc7e2d2f37b03c275cf1d547bbdcc21

  const tx: OpReturnMessage = {
    contract_call: {
      contract,
      call_type: {
        mint: {
          pointer: 1 // Points to the mint receiver's index in Output array
        }
      }
    }
  }

  const address = reserveAccount.p2pkh().address
  const utxos = await electrumFetchNonGlittrUtxos(client, address)
  const nonFeeInputs: BitcoinUTXO[] = []
  const nonFeeOutputs: Output[] = [
    { script: txBuilder.compile(tx), value: 0 }, // Output #0 should alwasy be OP_RETURN
    { address: address, value: 546 }
  ]

  const { inputs, outputs } = await addFeeToTx(NETWORK, address, utxos, nonFeeInputs, nonFeeOutputs)

  const txid = await client.createAndBroadcastRawTx({
    account: reserveAccount.p2pkh(),
    inputs,
    outputs
  })

  console.log(`TXID : ${txid}`)
}

async function freeMint() {
  const contract: BlockTxTuple = [101832, 1]; // https://explorer.glittr.fi/tx/8bb7f3332eb1c50d25ae31c1a06c2af56dc7e2d2f37b03c275cf1d547bbdcc21

  const tx: OpReturnMessage = {
    contract_call: {
      contract,
      call_type: {
        mint: {
          pointer: 1 // Points to the mint receiver's index in Output array
        }
      }
    }
  }

  const address = freeMintAccount.p2pkh().address
  const utxos = await electrumFetchNonGlittrUtxos(client, address)
  const nonFeeInputs: BitcoinUTXO[] = []
  const nonFeeOutputs: Output[] = [
    { script: txBuilder.compile(tx), value: 0 }, // Output #0 should alwasy be OP_RETURN
    { address: address, value: 546 }
  ]

  const { inputs, outputs } = await addFeeToTx(NETWORK, address, utxos, nonFeeInputs, nonFeeOutputs)

  const txid = await client.createAndBroadcastRawTx({
    account: freeMintAccount.p2pkh(),
    inputs,
    outputs
  })

  console.log(`TXID : ${txid}`)
}

/**
 * Call deployVestingContract() function first
 * wait for confirmation and indexing
 * then call the vestedMint() and freeMint()
 */
deployVestingContract()



/**
 * Function to check asset after mint
 * change the mintTxId and mintVout
 * with your vestedMint() and freeMint() result
 */
async function _checkingAssetFreeMint() {
  const mintTxid =
    "22acf70357c3adf8c3236e1c230b7c3d6796488825b963edd0d52ff13ba5a822";
  const mintVout = 0;
  const result = await fetch(
    `https://devnet-core-api.glittr.fi/assets/${mintTxid}/${mintVout}`
  );

  console.log(await result.text());
}

async function _checkingAssetVested() {
  const mintTxid =
    "82eda96aa5f9a0941b2b0f00b692aa389f54b210af23977f21e0006259f3282b";
  const mintVout = 0;
  const result = await fetch(
    `https://devnet-core-api.glittr.fi/assets/${mintTxid}/${mintVout}`
  );

  console.log(await result.text());
}
