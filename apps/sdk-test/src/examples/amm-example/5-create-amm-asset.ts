import {
  Account,
  BlockTxTuple,
  GlittrSDK,
  OpReturnMessage,
  Output,
} from "@glittr-sdk/sdk";

const NETWORK = "regtest";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: "",
  glittrApi: "http://127.0.0.1:3001",
  electrumApi: "http://127.0.0.1:3002",
});

const creatorAccount = new Account({
  wif: "cU6mHpUnEn6MB3uwAhUgNvXW3ChsWZBm3AVY7cT3BnK7kVghdrTN",
  network: NETWORK,
});

async function deployContract() {
  const firstContract: BlockTxTuple = [27048, 1];
  const secondContract: BlockTxTuple = [27052, 1];

  // Here, we demonstrate using the new "constant_sum" model.
  // To use the existing model, simply set ratio_model to "constant_product".
  const ammModel: "constant_product" | "constant_sum" = "constant_sum";

  const tx: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        mba: {
          ticker: "AMM",
          divisibility: 18,
          live_time: 0,
          mint_mechanism: {
            collateralized: {
              input_assets: [
                { glittr_asset: firstContract },
                { glittr_asset: secondContract },
              ],
              _mutable_assets: false,
              mint_structure: {
                proportional: {
                  ratio_model: ammModel,
                  // inital_mint_pointer_to_key: 1, // optional
                },
              },
            },
          },
          burn_mechanism: {},
          swap_mechanism: {},
        },
      },
    },
  };

  const address = creatorAccount.p2tr().address;
  const outputs: Output[] = [{ address: address, value: 546 }];

  const txid = await client.createAndBroadcastTx({
    account: creatorAccount.p2tr(),
    outputs: outputs,
    tx: tx,
  });

  console.log(`TXID : ${txid}`);
  console.log("[+] Waiting to be mined");

  // Poll until the transaction is mined
  while (true) {
    try {
      const message = await client.getGlittrMessageByTxId(txid);
      console.log("Mined! Response", JSON.stringify(message));
      break;
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  }
}

deployContract();
