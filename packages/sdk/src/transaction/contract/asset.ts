import { BlockHeight, BlockTxTuple } from "../../utils";

type OracleSetting = {
  asset_id?: string;
};

type InputAsset =
  | { type: "raw_btc" }
  | { type: "glittr_asset"; value: BlockTxTuple }
  | { type: "metaprotocol" };

type TransferScheme = { type: "purchase"; address: string } | { type: "burn" };

type TransferRatioType =
  | { type: "fixed"; ratio: number }
  | { type: "oracle"; pubkey: Uint8Array; setting: OracleSetting };

export type AssetContractFreeMint = {
  supply_cap?: number;
  amount_per_mint: number;
  divisibility: number;
  live_time: BlockHeight;
};

export type AssetContractPurchaseBurnSwap = {
  input_asset: InputAsset;
  transfer_scheme: TransferScheme;
  transfer_ratio_type: TransferRatioType;
};
