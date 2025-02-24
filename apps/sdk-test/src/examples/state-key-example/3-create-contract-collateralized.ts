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
  
  async function deployContract() {
    const tx: OpReturnMessage = {
      contract_creation: {
        contract_type: {
          mba: {
            ticker: "USDT",
            divisibility: 18,
            live_time: 0,
            mint_mechanism: {
              collateralized: {
                input_assets: [{ glittr_asset: [27541, 1] }],
                mint_structure: {
                  account: {
                    max_ltv: [7, 10], // 70%
                    ratio: {
                      fixed: {
                        ratio: [10, 1] // change this to oracle type for testing collateral, this is just for state key
                      }
                    }
                  },
                },
                _mutable_assets: false
              },
            },
            burn_mechanism: {
              return_collateral: {} // change this to oracle for testing collateral, this is just for testing state key
            },
            swap_mechanism: {},
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
  