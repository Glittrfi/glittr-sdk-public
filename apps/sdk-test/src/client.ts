import { Account, BlockTxTuple, GlittrSDK, txBuilder } from "@glittr-sdk/sdk";

async function createFreeMintContract() {
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

  const c = txBuilder.freeMintContractInstantiate({
    amount_per_mint: 2n.toString(),
    divisibility: 18,
    live_time: 0,
    supply_cap: 2000n.toString(),
  });

  const txid = await client.createAndBroadcastTx({
    account: account.p2pkh(),
    tx: c,
    outputs: [],
  });
  console.log("TXID : ", txid);
}

async function transfer() {
  const NETWORK = "regtest";

  const client = new GlittrSDK({
    network: NETWORK,
    electrumApi: "https://devnet-electrum.glittr.fi",
    glittrApi: "https://devnet-core-api.glittr.fi",
  });
  const creatorAccount = new Account({
    // mroHGEtVBLxKoo34HSHbHdmKz1ooJdA3ew
    wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
    network: NETWORK,
  });
  const minterAccount = new Account({
    // n3jM14MNfn1EEe1P8azEsmcPSP2BvykGLM
    wif: "cMqUkLHLtHJ4gSBdxAVtgFjMnHkUi5ZXkrsoBcpECGrE2tcJiNDh",
    network: NETWORK,
  });

  const contract: BlockTxTuple = [101869, 1];
  const tx = txBuilder.transfer({
    transfers: [
      {
        amount: "100",
        asset: contract,
        output: 1,
      },
    ],
  });
  const txid = await client.createAndBroadcastTx({
    account: minterAccount.p2pkh(),
    tx: tx,
    outputs: [{ address: creatorAccount.p2pkh().address, value: 1000 }],
  });
  console.log("TXID : ", txid);
}


createFreeMintContract()