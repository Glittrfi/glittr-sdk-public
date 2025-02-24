import {
    Account,
    GlittrSDK,
    OpReturnMessage,
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
  
  console.log(creatorAccount.p2tr().address);
  
  async function deployContract() {
    const tx: OpReturnMessage = {
      contract_creation: {
        contract_type: {
          moa: {
            ticker: "CHEAP",
            divisibility: 18,
            live_time: 0,
            mint_mechanism: {
              free_mint: {
                amount_per_mint: BigInt(100).toString(),
              },
            },
          },
        },
      },
    };
  
    const txid = await client.createAndBroadcastTx({
      account: creatorAccount.p2tr(),
      tx: tx,
    });
  
    console.log(`TXID : ${txid}`);
  }
  
  deployContract();
  