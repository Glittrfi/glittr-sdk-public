import { BlockHeight, BlockTxTuple, OutPoint } from "../../common";
import { TransferRatioType, TransferScheme } from "../transfer";

interface OracleMessage {
  input_outpoint: OutPoint;
  min_in_value: bigint;
  out_value: bigint;
  asset_id?: string;
}

interface OracleMessageSigned {
  signature: Uint8Array;
  message: OracleMessage;
}

interface AssetContractPurchaseBurnSwap {
  input_asset: InputAsset;
  transfer_scheme: TransferScheme;
  transfer_ratio_type: TransferRatioType;
}

type InputAsset =
  | { type: "raw_btc" }
  | { type: "glittr_asset"; value: BlockTxTuple }
  | { type: "metaprotocol" };

export type AssetContract =
  | { type: "preallocated"; todo?: null }
  | {
      type: "free_mint";
      supply_cap?: number;
      amount_per_mint: number;
      divisibility: number;
      live_time: BlockHeight;
    }
  | {
      type: "purchase_burn_swap";
      purchaseBurnSwap: AssetContractPurchaseBurnSwap;
    };

export type ContractType = { type: "asset"; assetContract: AssetContract };

export interface MintOption {
  pointer: number;
  oracle_message?: OracleMessageSigned;
}

export type CallType =
  | { type: "mint"; mintOption: MintOption }
  | { type: "burn" }
  | { type: "swap" };
