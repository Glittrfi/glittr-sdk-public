import {
  Account,
  GlittrSDK,
  electrumFetchNonGlittrUtxos,
  BitcoinUTXO,
  Output,
  addFeeToTx,
  encodeVaruint,
  txBuilder,
  OpReturnMessage,
  encodeBase26,
  BlockTxTuple,
} from "@glittr-sdk/sdk";

const NETWORK = "testnet";
const client = new GlittrSDK({
  network: NETWORK,
  apiKey: "",
  // glittrApi: "https://devnet2-core-api.glittr.fi", // devnet
  // electrumApi: "https://devnet-electrum.glittr.fi" // devnet
  glittrApi: "https://testnet-core-api.glittr.fi", // testnet
  electrumApi: "https://testnet-electrum.glittr.fi", // testnet
});

const creatorAccount = new Account({
  // wif: "cW84FgWG9U1MpKvdzZMv4JZKLSU7iFAzMmXjkGvGUvh5WvhrEASj",
  wif: "cU6mHpUnEn6MB3uwAhUgNvXW3ChsWZBm3AVY7cT3BnK7kVghdrTN", //unisat
  network: NETWORK,
});

async function deployFreemintCompress() {
  const tx: OpReturnMessage = {
    contract_creation: {
      contract_type: {
        moa: {
          ticker: encodeBase26("FOXY"),
          divisibility: 18,
          live_time: 0,
          supply_cap: encodeVaruint(BigInt(1000)),
          mint_mechanism: {
            free_mint: {
              supply_cap: encodeVaruint(BigInt(400)),
              amount_per_mint: encodeVaruint(BigInt(1)),
            },
          },
        },
      },
    },
  };

  const utxos = await electrumFetchNonGlittrUtxos(
    client,
    creatorAccount.p2tr().address
  );
  const nonFeeInputs: BitcoinUTXO[] = [];
  const nonFeeOutputs: Output[] = [
    { script: await txBuilder.compress(tx), value: 0 },
    { address: creatorAccount.p2tr().address, value: 546 },
  ];

  const { inputs, outputs } = await addFeeToTx(
    NETWORK,
    creatorAccount.p2tr().address,
    utxos,
    nonFeeInputs,
    nonFeeOutputs
  );

  const txid = await client.createAndBroadcastRawTx({
    account: creatorAccount.p2tr(),
    inputs,
    outputs,
  });

  console.log(`TXID : ${txid}`);
}

async function mint() {
  const contract: BlockTxTuple = [encodeVaruint(67225), encodeVaruint(162)]; // https://explorer.glittr.fi/tx/8bb7f3332eb1c50d25ae31c1a06c2af56dc7e2d2f37b03c275cf1d547bbdcc21

  const tx: OpReturnMessage = {
    contract_call: {
      contract,
      call_type: {
        mint: {
          pointer: encodeVaruint(1), // Points to the mint receiver's index in Output array
        },
      },
    },
  };

  const address = creatorAccount.p2tr().address;
  const utxos = await electrumFetchNonGlittrUtxos(client, address);
  const nonFeeInputs: BitcoinUTXO[] = [];
  const nonFeeOutputs: Output[] = [
    { script: await txBuilder.compress(tx), value: 0 }, // Output #0 should alwasy be OP_RETURN
    { address: address, value: 546 },
  ];

  const { inputs, outputs } = await addFeeToTx(
    NETWORK,
    address,
    utxos,
    nonFeeInputs,
    nonFeeOutputs
  );

  const txid = await client.createAndBroadcastRawTx({
    account: creatorAccount.p2tr(),
    inputs,
    outputs,
  });

  console.log(`TXID : ${txid}`);
}

// deployFreemintCompress()
mint();
