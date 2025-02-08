import {
  Account,
  GlittrSDK,
  Output,
  OpReturnMessage,
} from "@glittr-sdk/sdk";

const NETWORK = "testnet";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: "",
  // glittrApi: "https://devnet-core-api.glittr.fi", // devnet
  // electrumApi: "https://devnet-electrum.glittr.fi", // devnet
  glittrApi: "https://testnet-core-api.glittr.fi", // testnet
  electrumApi: "https://testnet-electrum.glittr.fi" // testnet
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
          /// cat out.bmp | xxd -p
          // asset_image: Array.from(Buffer.from(
          //   "424d4000000000000000200000000c0000000800080001000100000000ffffff81000000c3000000df000000c9000000c3000000d7000000d7000000ff000000",
          //   "hex"
          // )),
          asset: Array.from(
            Buffer.from(
              "424d4000000000000000200000000c0000000800080001000100000000ffffff81000000c3000000df000000c9000000c3000000d7000000d7000000ff000000",
              "hex"
            )
          ),
          supply_cap: "1",
          live_time: 0,
        },
      },
    },
    contract_call: {
      call_type: {
        mint: {
          pointer: 1,
        },
      },
    },
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
