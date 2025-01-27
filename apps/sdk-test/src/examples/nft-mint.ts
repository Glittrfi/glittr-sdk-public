import {
  Account,
  GlittrSDK,
  electrumFetchNonGlittrUtxos,
  BitcoinUTXO,
  Output,
  addFeeToTx,
  txBuilder,
  OpReturnMessage,
  encodeVaruint,
} from "@glittr-sdk/sdk";

const NETWORK = "regtest";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: "1c4938fb-1a10-48c2-82eb-bd34eeb05b20",
  // glittrApi: "https://devnet2-core-api.glittr.fi", // devnet
  // electrumApi: "https://devnet-electrum.glittr.fi" // devnet
  // glittrApi: "https://testnet-core-api.glittr.fi", // testnet
  // electrumApi: "https://testnet-electrum.glittr.fi" // testnet
  glittrApi: "http://localhost:3000",
  electrumApi: "http://localhost:3002",
});

const creatorAccount = new Account({
  wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
  network: NETWORK,
});

async function deployNftCompress() {
  const tx: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        nft: {
          /// convert b49b3f179d64a468ce49a761c54dd768f885e902b9d3b5e1bddf0a27c9fbdfc0i0.png -sample 30% out.pgm
          /// cat out.pgm | xxd -p
          // asset_image: Array.from(Buffer.from(
          //   "50350a3820380a3235350affffffffffffffffffff13ff13ffffffffff13ff13ffffffffff13343434ffffffff1300fc0000ffffff139e9e9e9effffff13131313ffffff131334343434ff",
          //   "hex"
          // )),
          asset_image: Array.from(Buffer.from(
            "55",
            "hex"
          )),
          supply_cap: encodeVaruint(1),
          live_time: 0,
        },
      },
    },
    contract_call: {
        contract: null,
        call_type: {
            mint: {
                pointer: encodeVaruint(0),
            }
        }
    }
  };

  console.log(`[+] Creator Account ${creatorAccount.p2pkh().address}`);

  const outputs: Output[] = [
    { address: creatorAccount.p2pkh().address, value: 546 },
  ];

  const txid = await client.createAndBroadcastTx({
    account: creatorAccount.p2pkh(),
    tx,
    outputs,
  });

  console.log(`TXID : ${txid}`);
}

deployNftCompress();
