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
  encryptMessage,
  encodeVaruint,
} from "@glittr-sdk/sdk";

const NETWORK = "regtest";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: '',
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

async function deployCommitmentFreeMintContract() {
  const tx: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        moa: {
          divisibility: 18,
          live_time: 0,
          mint_mechanism: {
            free_mint: {
              amount_per_mint: "1"
            }
          },
          commitment: {
            public_key: Array.from(creatorAccount.p2pkh().keypair.publicKey),
            args: {
              fixed_string: "GLITTRAIRDROP",
              string: "username"
            }
          }
        }
      }
    }
  }

  const utxos = await electrumFetchNonGlittrUtxos(client, creatorAccount.p2pkh().address)
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
  // Contract from deployCommitmentFreeMintContract() result
  const contract: BlockTxTuple = [encodeVaruint(187143), encodeVaruint(1)]

  const creatorPubkey = new Uint8Array(creatorAccount.p2pkh().keypair.publicKey)

  const username = "alice123"
  const commitmentString = `GLITTRAIRDROP:${username}`
  const encryptedCommitment = await encryptMessage(creatorPubkey, commitmentString)

  const tx: OpReturnMessage = {
    contract_call: {
      contract,
      call_type: {
        mint: {
          pointer: encodeVaruint(1),
          commitment_message: {
            public_key: Array.from(creatorAccount.p2pkh().keypair.publicKey),
            args: Array.from(encryptedCommitment)
          }
        },
      },
    }
  }

  const utxos = await electrumFetchNonGlittrUtxos(client, minterAccount.p2pkh().address)
  const nonFeeInputs: BitcoinUTXO[] = []
  const nonFeeOutputs: Output[] = [
    { script: txBuilder.compile(tx), value: 0 },
    { address: minterAccount.p2pkh().address, value: 546 }
  ]

  const { inputs, outputs } = await addFeeToTx(NETWORK, minterAccount.p2pkh().address, utxos, nonFeeInputs, nonFeeOutputs)

  console.log(inputs, outputs)

  const txid = await client.createAndBroadcastRawTx({
    account: minterAccount.p2pkh(),
    inputs,
    outputs
  })

  console.log(`TXID : ${txid}`)
}

deployCommitmentFreeMintContract()
// mint()