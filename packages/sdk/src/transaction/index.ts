import { serialize } from "@glittr-sdk/borsh";
import {
  ContractCallParams,
  ContractInstantiateParams,
  CreatePoolContractParams,
  FreeMintContractParams,
  PaidMintContractParams,
  TransferParams,
} from "./message";
import { OpReturnMessage } from "./types";
import { schema } from "./schema";
import { compress } from 'brotli-compress'
import { script } from "bitcoinjs-lib";
import { encodeBase26, encodeGlittrData, encodeVaruint, Header } from "../utils";
import { transformOpReturnMessage } from "./convert";

interface TxBuilderStatic {
  transfer(params: TransferParams): OpReturnMessage;
  contractCall(params: ContractCallParams): OpReturnMessage;
  contractInstantiate(params: ContractInstantiateParams): OpReturnMessage;
  freeMint(params: FreeMintContractParams): OpReturnMessage;
  paidMint(params: PaidMintContractParams): OpReturnMessage;
  createPool(params: CreatePoolContractParams): OpReturnMessage;
  customMessage(params: OpReturnMessage): OpReturnMessage;
  compile(message: OpReturnMessage): Buffer;
  compress(message: OpReturnMessage): Promise<Buffer>;
}

class TxBuilderClass {
  private constructor() { }

  static transfer(params: TransferParams): OpReturnMessage {
    return {
      transfer: {
        transfers: params.transfers,
      },
    };
  }

  static contractCall(params: ContractCallParams): OpReturnMessage {
    return {
      contract_call: {
        contract: params.contract,
        call_type: params.call_type,
      },
    };
  }

  static contractInstantiate(
    params: ContractInstantiateParams
  ): OpReturnMessage {
    if (params.burn_mechanism) {
      return {
        contract_creation: {
          contract_type: {
            mba: {
              divisibility: params.divisibility,
              live_time: params.live_time,
              supply_cap: params.supply_cap,
              ticker: params.ticker,
              mint_mechanism: params.mint_mechanism,
              burn_mechanism: params.burn_mechanism,
              swap_mechanism: {}, // TODO
            },
          },
        },
      };
    } else {
      return {
        contract_creation: {
          contract_type: {
            moa: {
              divisibility: params.divisibility,
              live_time: params.live_time,
              supply_cap: params.supply_cap,
              ticker: params.ticker,
              mint_mechanism: params.mint_mechanism,
            },
          },
        },
      };
    }
  }

  static freeMint(
    params: FreeMintContractParams
  ): OpReturnMessage {
    return {
      contract_creation: {
        contract_type: {
          moa: {
            divisibility: params.divisibility,
            live_time: params.live_time,
            ticker: params.ticker,
            supply_cap: params.supply_cap,
            mint_mechanism: {
              free_mint: {
                amount_per_mint: params.amount_per_mint,
                supply_cap: params.supply_cap,
              },
            },
          },
        },
      },
    };
  }

  static paidMint(
    params: PaidMintContractParams
  ): OpReturnMessage {
    return {
      contract_creation: {
        contract_type: {
          moa: {
            divisibility: params.divisibility,
            live_time: params.live_time,
            ticker: params.ticker,
            supply_cap: params.supply_cap,
            mint_mechanism: {
              purchase: {
                input_asset: params.payment.input_asset,
                pay_to_key: params.payment.pay_to,
                ratio: params.payment.ratio,
              },
            },
          },
        },
      },
    };
  }

  static createPool(
    params: CreatePoolContractParams
  ): OpReturnMessage {
    return {
      contract_creation: {
        contract_type: {
          mba: {
            divisibility: params.divisibility,
            live_time: params.live_time,
            supply_cap: params.supply_cap,
            mint_mechanism: {
              collateralized: {
                _mutable_assets: true, // TODO
                input_assets: params.assets,
                mint_structure: {
                  proportional: {
                    ratio_model: "constant_product",
                    inital_mint_pointer_to_key: params.initial_mint_restriction, // TODO exclude only if no params
                  },
                },
              },
            },
            burn_mechanism: {
              return_collateral: {}, // TODO
            },
            swap_mechanism: {}, // TODO
          },
        },
      },
    };
  }

  static customMessage(params: OpReturnMessage): OpReturnMessage {
    return params;
  }

  static compile(message: OpReturnMessage): Buffer {
    if (!message || Object.keys(message).length === 0) {
      throw new Error("No message to compile");
    }
    return encodeGlittrData(JSON.stringify(message));
  }

  static async compress(message: OpReturnMessage): Promise<Buffer> {
    const VERSION = 0;

    try {
      if (!message || Object.keys(message).length === 0) {
        throw new Error("No message to compile");
      }

      const encoded = serialize(schema, transformOpReturnMessage(message) as any)
      const compressed = await compress(encoded)

      const useCompressed = encoded.length > compressed.length;
      let data = encoded;
      if(useCompressed){
        data = compressed;
      }
      const header = new Header(VERSION, useCompressed);
      const payload = Buffer.concat([header.toBytes(), data]);

      const glittrFlag = Buffer.from("GLITTR", "utf8"); // Prefix
      const embed = script.compile([106, glittrFlag, payload]);
      return embed
    } catch (error) {
      throw new Error(`Error compiling OP_RETURN message ${error}`)
    }
  }
}

export const txBuilder: TxBuilderStatic = TxBuilderClass;

export * from "./types";
export * from "./message";
export * from './auto'
export * from './schema'
