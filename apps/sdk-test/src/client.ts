import { Account, GlittrSDK, txBuilder } from "@glittr-sdk/sdk";

async function main() {
  const NETWORK = "regtest";

  const client = new GlittrSDK({
    network: NETWORK,
    electrumApi: "https://devnet-electrum.glittr.fi",
    glittrApi: "https://devnet-core-api.glittr.fi",
  });
  const account = new Account({
    wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
    network: NETWORK,
  });

  const tx = txBuilder.freeMintContractInstantiate({
    simple_asset: {
      supply_cap: 2000n.toString(),
      divisibility: 18,
      live_time: 0,
    },
    amount_per_mint: 2n.toString(),
  });

  const txid = await client.createAndBroadcastTx({
    account: account.p2pkh(),
    tx,
    outputs: []
  });
  console.log("TXID : ", txid);
}

main();
