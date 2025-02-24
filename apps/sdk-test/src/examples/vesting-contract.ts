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
  Varuint,
} from "@glittr-sdk/sdk";
import { AllocationType } from "@glittr-sdk/sdk/dist/transaction/shared";

const NETWORK = "regtest";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: "",
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

  const allocations = new Map<Varuint, AllocationType>()
  allocations.set(encodeVaruint(200), {vec_pubkey: [receiver1PublicKey]})
  allocations.set(encodeVaruint(400), {vec_pubkey: [receiver2PublicKey]})

  const quarterlyVesting = [
    { ratio: [encodeVaruint(1), encodeVaruint(4)], tolerance: -4 },
    { ratio: [encodeVaruint(1), encodeVaruint(4)], tolerance: -3 },
    { ratio: [encodeVaruint(1), encodeVaruint(4)], tolerance: -2 },
    { ratio: [encodeVaruint(1), encodeVaruint(4)], tolerance: -1 },
  ]

  const tx: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        moa: {
          divisibility: 18,
          live_time: 0,
          supply_cap: encodeVaruint(1000),
          mint_mechanism: {
            preallocated: {
              allocations,
              vesting_plan: {
                scheduled: quarterlyVesting
              }
            },
            free_mint: {
              supply_cap: encodeVaruint(400),
              amount_per_mint: encodeVaruint(1),
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
    { script: await txBuilder.compress(tx), value: 0 }, // Output #0 should always be OP_RETURN
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
  const contract: BlockTxTuple = [encodeVaruint(101832), encodeVaruint(1)]; // https://explorer.glittr.fi/tx/8bb7f3332eb1c50d25ae31c1a06c2af56dc7e2d2f37b03c275cf1d547bbdcc21

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
  const contract: BlockTxTuple = [encodeVaruint(101832), encodeVaruint(1)]; // https://explorer.glittr.fi/tx/8bb7f3332eb1c50d25ae31c1a06c2af56dc7e2d2f37b03c275cf1d547bbdcc21

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
