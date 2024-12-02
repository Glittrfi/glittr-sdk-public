import { OpReturnMessage } from "./types";
import {
  FreeMintContractInstantiateFormat,
  FreeMintContractParams,
  MintContractCallFormat,
  MintContractCallParams,
  PreallocatedContractFormat,
  PreallocatedContractParams,
  PurchaseBurnContractFormat,
  PurchaseBurnContractParams,
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

  static freeMintContractInstantiate(
    params: FreeMintContractParams
  ): FreeMintContractInstantiateFormat {
    return {
      contract_creation: {
        contract_type: {
          moa: {
            ticker: params.ticker,
            supply_cap: params.supply_cap,
            divisibility: params.divisibility,
            live_time: params.live_time,
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

  static preallocatedContractInstantiate(
    params: PreallocatedContractParams
  ): PreallocatedContractFormat {
    return {
      contract_creation: {
        contract_type: {
          moa: {
            ticker: params.ticker,
            divisibility: params.divisibility,
            live_time: params.live_time,
            supply_cap: params.supply_cap,
            mint_mechanism: {
              preallocated: params.preallocated,
            },
          },
        },
      },
    };
  }

  static purchaseBurnSwapContractInstantiate(
    params: PurchaseBurnContractParams
  ): PurchaseBurnContractFormat {
    return {
      contract_creation: {
        contract_type: {
          moa: {
            ticker: params.ticker,
            divisibility: params.divisibility,
            live_time: params.live_time,
            supply_cap: params.supply_cap,
            mint_mechanism: { purchase: params.purchase_burn_swap },
          },
        },
      },
    };
  }

  static mint(params: MintContractCallParams): MintContractCallFormat {
    return {
      contract_call: {
        contract: params.contract,
        call_type: {
          mint: {
            pointer: params.pointer,
            oracle_message: params.oracle_message,
            pointer_to_key: params.pointer_to_key,
          },
        },
      },
    };
  }

  static buildMessage(m: OpReturnMessage) {
    return m;
  }
}

export * from "./types";
export * from "./message";
