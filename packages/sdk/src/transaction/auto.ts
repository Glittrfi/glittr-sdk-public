import { BitcoinUTXO, BlockTxTuple, encodeBase26, encodeVaruint, OpReturnMessage, Output, txBuilder, Varuint } from "..";
import { Account } from "../account";
import { GlittrSDK } from "../client";
import { getAssetTickers, getAssetUtxos } from "../helper/asset";
import { addFeeToTx } from "../helper/fee";
import { electrumFetchNonGlittrUtxos } from "../utils/electrum";
import { OracleMessageSigned } from "./calltype/types";
import { MOAMintMechanism } from "./contract/moa";
import { PurchaseBurnSwap } from "./shared";

type TransferParams = {
  contractId: string;
  amount: string;
  receiver: string;
}

class ContractDeployment {
  private client: GlittrSDK;
  private account: Account;

  constructor({ client, account }: { client: GlittrSDK; account: Account }) {
    this.client = client;
    this.account = account;
  }

  async liquidityPoolInitiate(inputAsset: [string, string], inputAmount: [string, string]) {
    const assetTickers = await getAssetTickers(this.client, inputAsset);
    const asset1Utxos = await getAssetUtxos(this.client, this.account.p2wpkh().address, inputAsset[0]);
    const asset2Utxos = await getAssetUtxos(this.client, this.account.p2wpkh().address, inputAsset[1]);
    const utxos = await electrumFetchNonGlittrUtxos(this.client, this.account.p2wpkh().address)

    // Accumulate UTXOs and track excess
    let asset1Total = BigInt(0);
    let asset2Total = BigInt(0);
    const asset1Required = BigInt(inputAmount[0]);
    const asset2Required = BigInt(inputAmount[1]);

    const usedUtxos1: BitcoinUTXO[] = [];
    const usedUtxos2: BitcoinUTXO[] = [];

    for (const utxo of asset1Utxos) {
      if (asset1Total >= asset1Required) break;
      asset1Total += BigInt(utxo?.assetAmount);
      usedUtxos1.push({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        status: utxo.status
      });
    }

    for (const utxo of asset2Utxos) {
      if (asset2Total >= asset2Required) break;
      asset2Total += BigInt(utxo?.assetAmount);
      usedUtxos2.push({
        txid: utxo.txid,
        vout: utxo.vout,
        value: utxo.value,
        status: utxo.status
      });
    }

    if (asset1Total < asset1Required || asset2Total < asset2Required) {
      throw new Error("Insufficient balance for liquidity pool");
    }

    const [block1, txIndex1] = inputAsset[0].split(':').map(Number);
    const [block2, txIndex2] = inputAsset[1].split(':').map(Number);

    const tx: OpReturnMessage = {
      contract_call: {
        contract: null,
        call_type: {
          mint: {
            pointer: encodeVaruint(3)
          }
        }
      },
      contract_creation: {
        contract_type: {
          mba: {
            divisibility: 18,
            live_time: 0,
            mint_mechanism: {
              collateralized: {
                _mutable_assets: false,
                input_assets: [
                  { glittr_asset: [encodeVaruint(block1!), encodeVaruint(txIndex1!)] },
                  { glittr_asset: [encodeVaruint(block2!), encodeVaruint(txIndex2!)] }
                ],
                mint_structure: {
                  proportional: {
                    ratio_model: "constant_product"
                  }
                }
              }
            },
            burn_mechanism: {},
            swap_mechanism: {},
            ticker: encodeBase26(assetTickers.join('-'))
          }
        }
      },
      transfer: {
        transfers: [
          {
            amount: encodeVaruint(asset1Total - asset1Required),
            asset: [encodeVaruint(block1!), encodeVaruint(txIndex1!)],
            output: encodeVaruint(1)
          },
          {
            amount: encodeVaruint(asset2Total - asset2Required),
            asset: [encodeVaruint(block2!), encodeVaruint(txIndex2!)],
            output: encodeVaruint(2)
          }
        ]
      }
    };

    const nonFeeInputs = [...usedUtxos1, ...usedUtxos2];
    const nonFeeOutputs: Output[] = [
      { script: txBuilder.compile(tx), value: 0 },
      { address: this.account.p2wpkh().address, value: 600 },
      { address: this.account.p2wpkh().address, value: 600 },
      { address: this.account.p2wpkh().address, value: 600 },
    ]

    const { inputs, outputs } = await addFeeToTx(
      this.client.network,
      this.account.p2wpkh().address,
      utxos,
      nonFeeInputs,
      nonFeeOutputs
    )

    return await this.client.createAndBroadcastRawTx({
      account: this.account.p2wpkh(),
      inputs,
      outputs,
    });
  }

  async freeMint(ticker: string, divisibility: number, amountPerMint: string, supplyCap?: string) {
    const _supplyCap = supplyCap ? encodeVaruint(supplyCap) : undefined;
    const tx: OpReturnMessage = {
      contract_creation: {
        contract_type: {
          moa: {
            divisibility,
            live_time: 0,
            supply_cap: _supplyCap,
            ticker: encodeBase26(ticker),
            mint_mechanism: { free_mint: { amount_per_mint: encodeVaruint(amountPerMint), supply_cap: _supplyCap } }
          }
        },
      },
    };

    const utxos = await electrumFetchNonGlittrUtxos(this.client, this.account.p2wpkh().address)
    const nonFeeInputs: BitcoinUTXO[] = []
    const nonFeeOutputs: Output[] = [
      { script: txBuilder.compile(tx), value: 0 },
    ]
    const { inputs, outputs } = await addFeeToTx(
      this.client.network,
      this.account.p2wpkh().address,
      utxos,
      nonFeeInputs,
      nonFeeOutputs
    )
    return await this.client.createAndBroadcastRawTx({
      account: this.account.p2wpkh(),
      inputs,
      outputs
    })
  }

  async paidMint(ticker: string, divisibility: number, mechanism: PurchaseBurnSwap, supplyCap?: string) {
    const _supplyCap = supplyCap ? encodeVaruint(supplyCap) : undefined;
    const tx: OpReturnMessage = {
      contract_creation: {
        contract_type: {
          moa: {
            divisibility,
            live_time: 0,
            supply_cap: _supplyCap,
            ticker: encodeBase26(ticker),
            mint_mechanism: {
              purchase: {
                input_asset: mechanism.input_asset,
                pay_to_key: mechanism.pay_to_key,
                ratio: mechanism.ratio,
              }
            }
          }
        },
      },
    };

    const utxos = await electrumFetchNonGlittrUtxos(this.client, this.account.p2wpkh().address)
    const nonFeeInputs: BitcoinUTXO[] = []
    const nonFeeOutputs: Output[] = [
      { script: txBuilder.compile(tx), value: 0 },
    ]
    const { inputs, outputs } = await addFeeToTx(
      this.client.network,
      this.account.p2wpkh().address,
      utxos,
      nonFeeInputs,
      nonFeeOutputs
    )

    return await this.client.createAndBroadcastRawTx({
      account: this.account.p2wpkh(),
      inputs,
      outputs
    })
  }
}

class ContractCall {
  private client: GlittrSDK;
  private account: Account;

  constructor({ client, account }: { client: GlittrSDK; account: Account }) {
    this.client = client;
    this.account = account;
  }

  async mint(contractId: string, receiver: string, oracleMessage?: OracleMessageSigned): Promise<string> {
    // TODO detect if the contract is paid mint or free mint
    const tx: OpReturnMessage = {
      contract_call: {
        contract: [encodeVaruint(contractId.split(":")[0]!), encodeVaruint(contractId.split(":")[1]!)],
        call_type: {
          mint: {
            pointer: encodeVaruint(1), // 0 is OpReturn
            oracle_message: oracleMessage,
          },
        },
      },
    };

    const utxos = await electrumFetchNonGlittrUtxos(this.client, this.account.p2wpkh().address)
    const nonFeeInputs: BitcoinUTXO[] = []
    const nonFeeOutputs: Output[] = [
      { script: txBuilder.compile(tx), value: 0 },
      { address: receiver, value: 1000 }
    ]
    const { inputs, outputs } = await addFeeToTx(
      this.client.network,
      this.account.p2wpkh().address,
      utxos,
      nonFeeInputs,
      nonFeeOutputs
    )

    return await this.client.createAndBroadcastRawTx({
      account: this.account.p2wpkh(),
      inputs,
      outputs
    })
  }
}

export class GlittrTransaction {
  private client: GlittrSDK;
  private account: Account;
  public readonly contractDeployment: ContractDeployment;
  public readonly contractCall: ContractCall;

  constructor({ client, account }: { client: GlittrSDK; account: Account }) {
    this.client = client;
    this.account = account;
    this.contractDeployment = new ContractDeployment({ client, account });
    this.contractCall = new ContractCall({ client, account });
  }

  async transfer(transfers: TransferParams[]): Promise<string> {
    const allTransfers: {amount: Varuint, asset: BlockTxTuple, output: Varuint}[] = [];
    const excessOutputs: {address: string, value: number}[] = [];

    transfers.forEach((t, i) => {
      allTransfers.push({
        amount: encodeVaruint(t.amount),
        asset: [encodeVaruint(t.contractId.split(":")[0]!), encodeVaruint(t.contractId.split(":")[1]!)],
        output: encodeVaruint(i + 1), // 0 is OpReturn
      });
    });

    const utxos = await electrumFetchNonGlittrUtxos(this.client, this.account.p2wpkh().address)

    const nonFeeInputs: BitcoinUTXO[] = []
    for (const transfer of transfers) {
      const assetRequired = BigInt(transfer.amount)
      const assetUtxos = await getAssetUtxos(this.client, this.account.p2wpkh().address, transfer.contractId)
      let assetTotal = BigInt(0)

      for (const utxo of assetUtxos) {
        if (assetTotal >= assetRequired) break
        assetTotal += BigInt(utxo.assetAmount)
        nonFeeInputs.push({
          txid: utxo.txid,
          vout: utxo.vout,
          value: utxo.value,
          status: utxo.status
        })
      }

      if (assetTotal < assetRequired) {
        throw new Error(`Insufficient balance for asset ${transfer.contractId}. Required: ${assetRequired}, balance: ${assetTotal}`)
      }

      const excessAssetValue = assetTotal - assetRequired
      if (excessAssetValue > 0) {
        // Add excess transfer to allTransfers array
        allTransfers.push({
          asset: [encodeVaruint(transfer.contractId.split(":")[0]!), encodeVaruint(transfer.contractId.split(":")[1]!)],
          amount: encodeVaruint(excessAssetValue),
          output: encodeVaruint(transfers.length + excessOutputs.length + 1)
        });
        // Add excess asset output to sender
        excessOutputs.push({
          address: this.account.p2wpkh().address,
          value: 600
        });
      }
    }

    const tx: OpReturnMessage = {
      transfer: {
        transfers: allTransfers
      }
    };

    const nonFeeOutputs: Output[] = [
      { script: txBuilder.compile(tx), value: 0 },
      ...transfers.map(t => ({
        address: t.receiver,
        value: 600
      })),
      ...excessOutputs
    ];

    const { inputs, outputs } = await addFeeToTx(
      this.client.network,
      this.account.p2wpkh().address,
      utxos,
      nonFeeInputs,
      nonFeeOutputs
    )

    return await this.client.createAndBroadcastRawTx({
      account: this.account.p2wpkh(),
      inputs,
      outputs
    });
  }
}
