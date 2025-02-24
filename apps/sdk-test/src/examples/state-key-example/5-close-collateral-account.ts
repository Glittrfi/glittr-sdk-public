import {
    Account,
    GlittrSDK,
    Output,
    OpReturnMessage,
    BlockTxTuple,
    getStateKeysUtxos,
    electrumFetchNonGlittrUtxos,
    BitcoinUTXO,
    txBuilder,
    addFeeToTx,
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
  
  const creatorAccount = new Account({
    wif: "cU6mHpUnEn6MB3uwAhUgNvXW3ChsWZBm3AVY7cT3BnK7kVghdrTN",
    network: NETWORK,
  });
  
  async function closeAccount() {
    const contract: BlockTxTuple = [27570, 1];
  
    const tx: OpReturnMessage = {
      contract_call: {
        contract,
        call_type: {
          close_account: {
            pointer: 1 // for output assets, if any
          },
        },
      },
    };
  
    const address = creatorAccount.p2tr().address;

    const utxos = await electrumFetchNonGlittrUtxos(client, address);
    const stateKeys = await getStateKeysUtxos(client, address, contract[0] + ":" + contract[1])

    if (stateKeys.length == 0 ) {
      throw new Error(`You do not have state key for ${contract[0] + ":"  + contract[1]}`);
    }

    const nonFeeInputs: BitcoinUTXO[] = [stateKeys[3]!]
    const nonFeeOutputs: Output[] = [
      { script: txBuilder.compile(tx), value: 0 }, // Output #0 should alwasy be OP_RETURN
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
    console.log(txid);
    console.log("[+] Waiting to be mined")

    // eslint-disable-next-line no-constant-condition
    while (true) {
      try {
        const message = await client.getGlittrMessageByTxId(txid);
        console.log("Mined! Response", message);
        break;
      } catch (error) {
          await new Promise(resolve => setTimeout(resolve, 1));
      }
    }

    const stateKey = await getStateKeysUtxos(client, address, contract[0] + ":" + contract[1])
    console.log(`[+] ${stateKey.length} stateKeys found for ${contract}`, stateKey);

  };

  closeAccount();
  