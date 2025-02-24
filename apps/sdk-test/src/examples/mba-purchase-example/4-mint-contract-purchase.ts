import {
    Account,
    GlittrSDK,
    Output,
    OpReturnMessage,
    BlockTxTuple,
    electrumFetchNonGlittrUtxos,
    BitcoinUTXO,
    txBuilder,
    addFeeToTx,
  } from "@glittr-sdk/sdk";
import { networks } from "bitcoinjs-lib";
import { p2pkh } from "bitcoinjs-lib/src/payments";
  
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
  
  const minterAccount = new Account({
    wif: "cMqUkLHLtHJ4gSBdxAVtgFjMnHkUi5ZXkrsoBcpECGrE2tcJiNDh",
    network: NETWORK,
  });
  
  async function mint() {
    const inputContract: BlockTxTuple = [26695, 1];

    const contract: BlockTxTuple = [26730, 1]; 

    // get asset
    const contractMessage = await client.getGlittrMessage(contract[0], contract[1]);

    const paytoPubkey = contractMessage.message.message.contract_creation.contract_type.mba.mint_mechanism.purchase.pay_to_key;

    const p2pkhTargetAddress = p2pkh({pubkey: Buffer.from(paytoPubkey), network: networks.regtest}).address;
  
    const tx: OpReturnMessage = {
      contract_call: {
        contract,
        call_type: {
          mint: {
            pointer: 1, 
          },
        },
      },
      transfer: {
          transfers: [{
              asset: inputContract,
              output: 2,
              amount: "1"
          }]
      }
    };

    const address = minterAccount.p2tr().address;

    const utxos = await electrumFetchNonGlittrUtxos(client, address);
    const inputAssets = await client.getAssetUtxos(address, inputContract[0] + ":" + inputContract[1]);

    if (inputAssets.length == 0 ) {
      throw new Error(`You do not have assets for ${inputContract[0] + ":"  + inputContract[1]}`);
    }

    const nonFeeInputs: BitcoinUTXO[] = inputAssets;
    const nonFeeOutputs: Output[] = [
      { script: txBuilder.compile(tx), value: 0 }, // Output #0 should alwasy be OP_RETURN
      { address: address, value: 546 },
      { address: p2pkhTargetAddress, value: 546 },
    ];
  
    const { inputs, outputs } = await addFeeToTx(
      NETWORK,
      address,
      utxos,
      nonFeeInputs,
      nonFeeOutputs
    );

  
    const txid = await client.createAndBroadcastRawTx({
      account: minterAccount.p2tr(),
      inputs,
      outputs,
    });
  
    console.log(`TXID : ${txid}`);

      // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const message = await client.getGlittrMessageByTxId(txid);
      console.log("Mined! Response", JSON.stringify(message));
      break;
    } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 1));
    }
  }
  }
  
  mint();
  