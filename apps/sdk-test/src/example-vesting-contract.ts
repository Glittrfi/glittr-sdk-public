import { Account, GlittrSDK, Ratio, TransactionBuilder } from "@glittr-sdk/sdk";

async function main() {
  const NETWORK = "regtest";

  const client = new GlittrSDK({
    network: NETWORK,
    glittrApi: "https://devnet-core-api.glittr.fi",
    electrumApi: "https://devnet-electrum.glittr.fi",
  });

  const account = new Account({
    wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
    network: NETWORK,
  });

  const reserveAccount = new Account({
    wif: "cMqUkLHLtHJ4gSBdxAVtgFjMnHkUi5ZXkrsoBcpECGrE2tcJiNDh",
    network: NETWORK,
  });

  const freeMintAccount = new Account({
    wif: "cTAxMkLUFE9YfQKgycwimpYoFp1KqqmFYZGboD3inKgucoREotpp",
    network: NETWORK,
  });

  console.log(`User account ${account.p2pkh().address}`);
  console.log(`Reserve account ${reserveAccount.p2pkh().address}`);
  console.log(`Freemint account ${freeMintAccount.p2pkh().address}`);

  // Example: pre-allocation with free mint
  // {
  // TxType: Contract,
  // simpleAsset:{
  // 	supplyCap: 1000,
  // 	Divisibility: 100,
  // 	liveTime: 0
  // },
  // Allocation:{
  // {100:pk1}
  // {200:reservePubKey},
  // {700: freemint}
  // vestingSchedule:{
  // 		Fractions: [.25, .25, .25, .25],
  // 		Blocks: [-1, -2, -3, -4] // relative block
  // },
  // FreeMint:{
  // 		mintCap: 1,
  // },
  // },
  // }

  const receiver1PublicKey = new Uint8Array(account.p2pkh().keypair.publicKey);
  const receiver2PublicKey = new Uint8Array(reserveAccount.p2pkh().keypair.publicKey);

  console.log(receiver1PublicKey, receiver2PublicKey)

  const quarterlyVesting: [Ratio, number][] = [
    [[25, 100], -1], // 25% unlocked after 1 blocks
    [[25, 100], -2], // 25% unlocked after 2 blocks
    [[25, 100], -3], // 25% unlocked after 3 blocks
    [[25, 100], -4], // 25% unlocked after 4 blocks
  ];

  const tx = TransactionBuilder.preallocatedContractInstantiate({
    simple_asset: {
      supply_cap: 1000n.toString(),
      divisibility: 100,
      live_time: 0,
    },
    preallocated: {
      allocations: {
        "100": [receiver1PublicKey],
        "200": [receiver2PublicKey],
      },
      vesting_plan: {
        scheduled: quarterlyVesting,
      },
    },
    // free mint
    free_mint: {
      supply_cap: 700n.toString(),
      amount_per_mint: 1n.toString(),
    },
  });

  const txid = await client.createAndBroadcastTx({
    account: account.p2pkh(),
    tx,
    outputs: [{ address: account.p2pkh().address, value: 546 }],
  });

  console.log("TXID : ", txid);
}

main();
