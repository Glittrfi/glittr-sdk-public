import { BlockHeight, BlockTxTuple, Pubkey, U128, Varuint } from "../utils";
import { CallType } from "./calltype/types";
import { BurnMechanism, MBAMintMechanism } from "./contract/mba";
import { ContractType } from "./contract/types";
import { InputAsset, RatioType } from "./shared";
import { TxTypeTransfer } from "./transfer/types";

/**
 * Contract Instantiate
 */
export type ContractInstantiateParams = {
  amount_per_mint?: Varuint;
  divisibility: number;
  live_time: BlockHeight;
  supply_cap?: Varuint;
  ticker?: string;
  mint_mechanism: MBAMintMechanism
  burn_mechanism?: BurnMechanism
};
export type ContractInstantiateFormat = {
  contract_creation: { contract_type: ContractType };
};


/**
 * Free Mint contract init
 */
export type FreeMintContractParams = {
  amount_per_mint: Varuint;
  divisibility: number;
  live_time: BlockHeight;
  supply_cap: Varuint;
  ticker: string;
};
export type FreeMintContractInstantiateFormat = {
  contract_creation: { contract_type: ContractType };
};


/**
 * Paid Mint contract init
 */
export type PaidMintContractParams = {
  divisibility: number;
  live_time: BlockHeight;
  supply_cap: Varuint;
  ticker: string;
  payment: {
    input_asset: InputAsset,
    pay_to: Pubkey,
    ratio: RatioType
  }
};
export type PaidMintContractInstantiateFormat = {
  contract_creation: { contract_type: ContractType };
};


/**
 * Create Pool contract init
 */
export type CreatePoolContractParams = {
  divisibility: number;
  live_time: BlockHeight;
  supply_cap: Varuint;
  assets: [InputAsset, InputAsset],
  invariant: number,
  initial_mint_restriction?: number
};
export type CreatePoolContractInstantiateFormat = {
  contract_creation: { contract_type: ContractType };
};


/**
 * Contract call
 */
export type ContractCallParams = {
  contract: BlockTxTuple;
  call_type: CallType
};
export type ContractCallFormat = {
  contract_call: {
    contract: BlockTxTuple;
    call_type: CallType;
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
  | TransferFormat
  | ContractCallFormat
  | ContractInstantiateFormat
  | FreeMintContractInstantiateFormat
  | PaidMintContractInstantiateFormat
  | CreatePoolContractInstantiateFormat
