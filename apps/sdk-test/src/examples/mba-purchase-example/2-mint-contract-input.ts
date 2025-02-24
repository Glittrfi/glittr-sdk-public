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

  const minterAccount = new Account({
    wif: "cMqUkLHLtHJ4gSBdxAVtgFjMnHkUi5ZXkrsoBcpECGrE2tcJiNDh",
    network: NETWORK,
  });
  
  async function mint() {
    const contract: BlockTxTuple = [26695, 1]; 
  
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
  
    const address = minterAccount.p2tr().address;
    const outputs: Output[] = [
      { address: address, value: 546 },
    ];
  
    const txid = await client.createAndBroadcastTx({
      account: minterAccount.p2tr(),
      tx: tx,
      outputs,
    });
  
    console.log(`TXID : ${txid}`);

      // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const message = await client.getGlittrMessageByTxId(txid);
      console.log("Mined! Response", JSON.stringify(message));
      break;
    } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  }
  
  mint();
  