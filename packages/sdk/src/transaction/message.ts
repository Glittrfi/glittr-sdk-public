import { BlockHeight, BlockTxTuple, Pubkey, U128 } from "../utils";
import { MintBurnOption, OracleMessageSigned } from "./calltype/types";
// import { MintOption, OracleMessageSigned } from "./calltype/types";
import { MintOnlyAssetContract } from "./contract/moa";
import { Preallocated, PurchaseBurnSwap } from "./shared";
import { TxTypeTransfer } from "./transfer/types";


/**
 * Free Mint contract init
 */
export type FreeMintContractParams = {
  amount_per_mint: U128;
  divisibility: number;
  live_time: BlockHeight;
  supply_cap?: U128;
  ticker?: string;
};
export type FreeMintContractInstantiateFormat = {
  contract_creation: {
    contract_type: { moa: MintOnlyAssetContract };
  };
};


/**
 * Preallocated contract
 */
export type PreallocatedContractParams = {
  preallocated: Preallocated;
  divisibility: number;
  live_time: BlockHeight;
  supply_cap?: U128;
  ticker?: string;
};
export type PreallocatedContractFormat = {
  contract_creation: {
    contract_type: { moa: MintOnlyAssetContract };
  };
};


/**
 * Purchaseburnswap contract
 */
export type PurchaseBurnContractParams = {
  purchase_burn_swap: PurchaseBurnSwap;
  divisibility: number;
  live_time: BlockHeight;
  supply_cap?: U128;
  ticker?: string;
};
export type PurchaseBurnContractFormat = {
  contract_creation: {
    contract_type: { moa: MintOnlyAssetContract };
  };
};


/**
 * Mint contract call
 */
export type MintContractCallParams = {
  contract: BlockTxTuple;
  pointer: number;
  oracle_message?: OracleMessageSigned;
  pointer_to_key?: number;
};
export type MintContractCallFormat = {
  contract_call: {
    contract: BlockTxTuple;
    call_type: {
      mint: MintBurnOption;
    };
  };
};


/**
 * Transfer
 */
export type TransferParams = {
  transfers: TxTypeTransfer[];
};
export type TransferFormat = {
  transfer: {
    transfers: TxTypeTransfer[];
  };
};


export type TransactionFormat =
  | MintContractCallFormat
  | TransferFormat
  | PreallocatedContractFormat
  | PurchaseBurnContractFormat
  | FreeMintContractInstantiateFormat;
