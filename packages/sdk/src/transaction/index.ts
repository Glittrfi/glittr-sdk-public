import {
  ContractCallFormat,
  ContractCallParams,
  ContractInstantiateFormat,
  ContractInstantiateParams,
  CreatePoolContractInstantiateFormat,
  CreatePoolContractParams,
  FreeMintContractInstantiateFormat,
  FreeMintContractParams,
  PaidMintContractInstantiateFormat,
  PaidMintContractParams,
  TransferFormat,
  TransferParams,
} from "./message";
export class txBuilder {
  constructor() {}

  static transfer(params: TransferParams): TransferFormat {
    return {
      transfer: {
        transfers: params.transfers,
      },
    };
  }

  static contractCall(params: ContractCallParams): ContractCallFormat {
    return {
      contract_call: {
        contract: params.contract,
        call_type: params.call_type,
      },
    };
  }

  static contractInstantiate(
    params: ContractInstantiateParams
  ): ContractInstantiateFormat {
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
  ): FreeMintContractInstantiateFormat {
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
  ): PaidMintContractInstantiateFormat {
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
  ): CreatePoolContractInstantiateFormat {
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
}

export * from "./types";
export * from "./message";
