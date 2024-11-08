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
          asset: {
            asset: params.simple_asset,
            distribution_schemes: {
              free_mint: {
                amount_per_mint: params.amount_per_mint,
                supply_cap: params.simple_asset.supply_cap,
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
          asset: {
            asset: params.simple_asset,
            distribution_schemes: {
              preallocated: params.preallocated,
              free_mint: params.free_mint,
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
          asset: {
            asset: params.simple_asset,
            distribution_schemes: {
              purchase: params.purchase_burn_swap
            },
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
          },
        },
      },
    };
  }

  static buildMessage(m: OpReturnMessage) {
    return m;
  }
}

export * from "../utxo";
export * from "./types";
export * from "./message"
