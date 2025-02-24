import {
  Account,
  GlittrSDK,
  Output,
  OpReturnMessage,
  BlockTxTuple,
} from "@glittr-sdk/sdk";

const NETWORK = "regtest";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: "",
  // glittrApi: "https://devnet-core-api.glittr.fi", // devnet
  // electrumApi: "https://devnet-electrum.glittr.fi" // devnet
  // glittrApi: "https://testnet-core-api.glittr.fi", // testnet
  // electrumApi: "https://testnet-electrum.glittr.fi", // testnet
  glittrApi: "http://127.0.0.1:3001",
  electrumApi: "http://127.0.0.1:3002",
});

const creatorAccount = new Account({
  wif: "cU6mHpUnEn6MB3uwAhUgNvXW3ChsWZBm3AVY7cT3BnK7kVghdrTN",
  network: NETWORK,
});

async function mint() {
  const contract: BlockTxTuple = [27541, 1];

  const tx: OpReturnMessage = {
    contract_call: {
      contract,
      call_type: {
        mint: {
          pointer: 1,
        },
      },
    },
  };

  const address = creatorAccount.p2tr().address;
  const outputs: Output[] = [{ address: address, value: 546 }];

  const txid = await client.createAndBroadcastTx({
    account: creatorAccount.p2tr(),
    tx: tx,
    outputs,
  });

  console.log(`TXID : ${txid}`);
}

mint();
