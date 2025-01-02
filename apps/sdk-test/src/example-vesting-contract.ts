import {
  Account,
  BlockTxTuple,
  GlittrSDK,
  Fraction,
  txBuilder,
} from "@glittr-sdk/sdk";

const NETWORK = "regtest";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: '1c4938fb-1a10-48c2-82eb-bd34eeb05b20',
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

async function createContract() {
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

  const receiver1PublicKey = Array.from(account.p2pkh().keypair.publicKey);
  const receiver2PublicKey = Array.from(
    reserveAccount.p2pkh().keypair.publicKey
  );

  console.log(receiver1PublicKey, receiver2PublicKey);

  const quarterlyVesting: [Fraction, number][] = [
    [[25, 100], -1], // 25% unlocked after 1 blocks
    [[25, 100], -2], // 25% unlocked after 2 blocks
    [[25, 100], -3], // 25% unlocked after 3 blocks
    [[25, 100], -4], // 25% unlocked after 4 blocks
  ];

  const tx = txBuilder.contractInstantiate({
    divisibility: 100,
    live_time: 0,
    supply_cap: 1000n.toString(),
    mint_mechanism: {
      preallocated: {
        allocations: {
          "100": [receiver1PublicKey],
          "200": [receiver2PublicKey],
        },
        vesting_plan: {
          scheduled: quarterlyVesting,
        },
      },
    },
  });
  console.log(JSON.stringify(tx));

  const txid = await client.createAndBroadcastTx({
    account: account.p2pkh(),
    tx,
    outputs: [{ address: account.p2pkh().address, value: 546 }],
  });

  console.log(`TX: https://explorer.glittr.fi/tx/${txid}`);
}

async function vestedMint() {
  const contract: BlockTxTuple = [101832, 1]; // https://explorer.glittr.fi/tx/8bb7f3332eb1c50d25ae31c1a06c2af56dc7e2d2f37b03c275cf1d547bbdcc21

  const tx = txBuilder.contractCall({
    contract,
    call_type: {
      mint: {
        pointer: 0, // 1 is op_return, 0 is specified, last is remainder
      },
    },
  });

  const txid = await client.createAndBroadcastTx({
    account: reserveAccount.p2pkh(),
    tx,
    outputs: [{ address: reserveAccount.p2pkh().address, value: 546 }],
  });

  console.log(`TX: https://explorer.glittr.fi/tx/${txid}`);
}

async function freeMint() {
  const contract: BlockTxTuple = [101832, 1]; // https://explorer.glittr.fi/tx/8bb7f3332eb1c50d25ae31c1a06c2af56dc7e2d2f37b03c275cf1d547bbdcc21

  const tx = txBuilder.contractCall({
    contract,
    call_type: {
      mint: {
        pointer: 0, // 1 is op_return, 0 is specified, last is remainder
      },
    },
  });

  const txid = await client.createAndBroadcastTx({
    account: freeMintAccount.p2pkh(),
    tx,
    outputs: [{ address: freeMintAccount.p2pkh().address, value: 546 }],
  });

  console.log(`TX: https://explorer.glittr.fi/tx/${txid}`);
}

async function checkingAssetFreeMint() {
  const assetTxId =
    "22acf70357c3adf8c3236e1c230b7c3d6796488825b963edd0d52ff13ba5a822";
  const vout = 0;
  const result = await fetch(
    `https://devnet-core-api.glittr.fi/assets/${assetTxId}/${vout}`
  );

  console.log(await result.text());
}

async function checkingAssetVested() {
  const assetTxId =
    "82eda96aa5f9a0941b2b0f00b692aa389f54b210af23977f21e0006259f3282b";
  const vout = 0;
  const result = await fetch(
    `https://devnet-core-api.glittr.fi/assets/${assetTxId}/${vout}`
  );

  console.log(await result.text());
}

checkingAssetVested();
