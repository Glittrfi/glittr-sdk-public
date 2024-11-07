import { Account, GlittrSDK, TransactionBuilder } from "@glittr-sdk/sdk";

async function main() {
  const NETWORK = "regtest";

  const client = new GlittrSDK({
    network: NETWORK,
    glittrApi: "http://192.145.44.30:3001",
    electrumApi: "http://192.145.44.30:3000",
  });
  const account = new Account({
    wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
    network: NETWORK,
  });

  const tx = TransactionBuilder.freeMintContractInstantiate({
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
    outputs: [{ address: account.p2wpkh().address, value: 0 }],
  });
  console.log("TXID : ", txid);
}

main();
