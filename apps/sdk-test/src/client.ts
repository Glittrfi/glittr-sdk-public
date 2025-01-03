import {
  Account,
  BlockTxTuple,
  GlittrSDK,
  GlittrTransaction,
  txBuilder,
} from "@glittr-sdk/sdk";

async function createFreeMintContract() {
  const NETWORK = "regtest";

  const client = new GlittrSDK({
    network: NETWORK,
    apiKey: '1c4938fb-1a10-48c2-82eb-bd34eeb05b20',
  });
  const account = new Account({
    // wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj", //bcrt1q0wlalygwr40hktazzu33t6m3979txzhykqxqlf
    wif: "cUwTH3TtUhwyEe2Cewce7iMafPiZ7sMoakPseBEQNGmyewgPHGKC", //bcrt1qrm52jjtvjpvtqpyzvflvnpnjzc550fqmzat8xw
    network: NETWORK,
  });

  const c = txBuilder.transfer({
    transfers: [
      {
        amount: "150",
        asset: [150368, 1],
        output: 1,
      },
    ],
  });

  const txid = await client.createAndBroadcastTx({
    account: account.p2wpkh(),
    tx: c,
    outputs: [
      {
        value: 546,
        address: 'bcrt1q0wlalygwr40hktazzu33t6m3979txzhykqxqlf'
        // address: 'bcrt1qrm52jjtvjpvtqpyzvflvnpnjzc550fqmzat8xw'
      },
    ],
  });
  console.log("TXID : ", txid);
}

async function transfer() {
  const NETWORK = "regtest";

  const client = new GlittrSDK({
    network: NETWORK,
    apiKey: '1c4938fb-1a10-48c2-82eb-bd34eeb05b20',
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

async function autoTransaction() {
  const NETWORK = 'regtest'

  const client = new GlittrSDK({
    network: NETWORK,
    apiKey: '1c4938fb-1a10-48c2-82eb-bd34eeb05b20',
  });
  const creatorAccount = new Account({
    // mroHGEtVBLxKoo34HSHbHdmKz1ooJdA3ew
    wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
    network: NETWORK,
  });
  const transaction = new GlittrTransaction({
    account: creatorAccount,
    client: client
  })

  const txid = await transaction.contractDeployment.freeMint("PONDS", 18, "100", "100000000") 
  console.log(txid)
}

autoTransaction();
