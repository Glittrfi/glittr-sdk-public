import { serialize } from "@glittr-sdk/borsh";
import {
  Account,
  GlittrSDK,
  electrumFetchNonGlittrUtxos,
  BitcoinUTXO,
  Output,
  addFeeToTx,
  encodeVaruint,
  txBuilder,
  OpReturnMessage,
  schema,
  encodeBase26,
} from "@glittr-sdk/sdk";

const NETWORK = "regtest";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: '1c4938fb-1a10-48c2-82eb-bd34eeb05b20',
  glittrApi: "https://devnet2-core-api.glittr.fi", // devnet
  electrumApi: "https://devnet-electrum.glittr.fi" // devnet
});

const creatorAccount = new Account({
  wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
  network: NETWORK,
});

async function deployFreemintCompress() {
  const tx: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        moa: {
          ticker: encodeBase26("FOXY"),
          divisibility: 18,
          live_time: 0,
          supply_cap: encodeVaruint(BigInt(1000)),
          mint_mechanism: {
            free_mint: {
              supply_cap: encodeVaruint(BigInt(400)),
              amount_per_mint: encodeVaruint(BigInt(1))
            },
          },
        }
      }
    }
  }

  const utxos = await electrumFetchNonGlittrUtxos(client.electrumApi, client.apiKey, creatorAccount.p2pkh().address)
  const nonFeeInputs: BitcoinUTXO[] = []
  const nonFeeOutputs: Output[] = [
    { script: await txBuilder.compress(tx), value: 0 },
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

deployFreemintCompress()