import { Account, GlittrSDK, OpReturnMessage } from "@glittr-sdk/sdk";

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
          ticker: "YAY",
          divisibility: 18,
          live_time: 0,
          mint_mechanism: {
            purchase: {
              input_asset: { glittr_asset: [26695, 1] },
              ratio: { fixed: { ratio: [1, 500] } }, // 1 of FOXY will give you 500 YAY
              pay_to_key: Array.from(creatorAccount.p2pkh().keypair.publicKey),
            },
          },
          burn_mechanism: {},
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

  // eslint-disable-next-line no-constant-condition
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
