import { BitcoinUTXO, OpReturnMessage, Output, txBuilder } from "..";
import { Account } from "../account";
import { GlittrSDK } from "../client";
import { getAssetTickers, getAssetUtxos } from "../helper/asset";
import { addFeeToTx } from "../helper/fee";
import { electrumFetchUtxos } from "../utils/electrum";
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
    const assetTickers = await getAssetTickers(this.client.apiKey, inputAsset);
    const asset1Utxos = await getAssetUtxos(this.client.apiKey, this.account.p2wpkh().address, inputAsset[0]);
    const asset2Utxos = await getAssetUtxos(this.client.apiKey, this.account.p2wpkh().address, inputAsset[1]);
    const utxos = await electrumFetchUtxos(this.client.electrumApi, this.client.apiKey, this.account.p2wpkh().address)

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
            pointer: 3
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
                  { glittr_asset: [block1!, txIndex1!] },
                  { glittr_asset: [block2!, txIndex2!] }
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
            ticker: assetTickers.join('-')
          }
        }
      },
      transfer: {
        transfers: [
          {
            amount: (asset1Total - asset1Required).toString(),
            asset: [block1, txIndex1] as [number, number],
            output: 1
          },
          {
            amount: (asset2Total - asset2Required).toString(),
            asset: [block2, txIndex2] as [number, number],
            output: 2
          }
        ]
      }
    };

    const nonFeeInputs = [...usedUtxos1, ...usedUtxos2];
    const nonFeeOutputs: Output[] = [
      { script: txBuilder.compile(tx), value: 0 },
      { address: this.account.p2wpkh().address, value: 546 },
      { address: this.account.p2wpkh().address, value: 546 },
      { address: this.account.p2wpkh().address, value: 546 },
    ]

    const { inputs, outputs } = await addFeeToTx(
      this.client.network,
      this.account.p2wpkh().address,
      utxos,
      nonFeeInputs,
      nonFeeOutputs
    )

    return this.client.createAndBroadcastRawTx({
      account: this.account.p2wpkh(),
      inputs,
      outputs,
    });
  }

  async freeMint(ticker: string, divisibility: number, amountPerMint: string, supplyCap?: string) {
    const _supplyCap = supplyCap ? supplyCap : undefined;
    const tx: OpReturnMessage = {
      contract_creation: {
        contract_type: {
          moa: {
            divisibility,
            live_time: 0,
            supply_cap: _supplyCap,
            ticker,
            mint_mechanism: { free_mint: { amount_per_mint: amountPerMint, supply_cap: _supplyCap } }
          }
        },
      },
    };

    return this.client.createAndBroadcastTx({
      account: this.account.p2wpkh(),
      tx,
      outputs: [{ address: this.account.p2wpkh().address, value: 546 }],
    });
  }

  async paidMint(ticker: string, divisibility: number, mechanism: PurchaseBurnSwap, supplyCap?: string) {
    const _supplyCap = supplyCap ? supplyCap : undefined;
    const tx: OpReturnMessage = {
      contract_creation: {
        contract_type: {
          moa: {
            divisibility,
            live_time: 0,
            supply_cap: _supplyCap,
            ticker,
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

    return this.client.createAndBroadcastTx({
      account: this.account.p2wpkh(),
      tx,
      outputs: [{ address: this.account.p2wpkh().address, value: 546 }],
    });
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
        contract: contractId.split(':').map(Number) as [number, number],
        call_type: {
          mint: {
            pointer: 1, // 0 is OpReturn
            oracle_message: oracleMessage,
          },
        },
      },
    };

    return this.client.createAndBroadcastTx({
      account: this.account.p2wpkh(),
      tx,
      outputs: [{ address: receiver, value: 546 }],
    });
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
    const tx: OpReturnMessage = {
      transfer: {
        transfers: transfers.map((t, i) => ({
          amount: t.amount,
          asset: t.contractId.split(':').map(Number) as [number, number],
          output: i + 1, // 0 is OpReturn
        })),
      },
    };

    return this.client.createAndBroadcastTx({
      account: this.account.p2wpkh(),
      tx,
      outputs: transfers.map(t => ({
        value: Number(t.amount),
        address: t.receiver,
      })),
    });
  }


}
