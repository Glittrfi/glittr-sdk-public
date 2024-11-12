import {
  BitcoinAddress,
  BlockHeight,
  BlockTxTuple,
  Pubkey,
  Ratio,
  RelativeOrAbsoluteBlockHeight,
  U128,
} from "../../utils";

export type InputAsset =
  | "raw_btc"
  | { glittr_asset: BlockTxTuple }
  | "metaprotocol"

// Update TransferScheme enum
export type TransferScheme = { purchase: BitcoinAddress } | { burn: {} };

// New TransferRatioType enum
export type TransferRatioType =
  | {
      fixed: {
        ratio: Ratio;
      };
    }
  | {
      oracle: {
        pubkey: Pubkey; // compressed public key
        setting: OracleSetting;
      };
    };

// New OracleSetting type
export type OracleSetting = {
  // set asset_id to none to fully trust the oracle, ordinal_number if ordinal, rune's block_tx if rune, etc
  asset_id?: string;
  // delta block_height in which the oracle message still valid
  block_height_slippage: number;
};

export type FreeMint = {
  supply_cap?: U128;
  amount_per_mint: U128;
};

export type NFTMint = {
  supply_cap?: U128;
  amount_per_mint: U128;
  name: String;
  url: String;
  url_hash: String;
};

export type VestingPlan =
  | { timelock: RelativeOrAbsoluteBlockHeight }
  | { scheduled: Array<[Ratio, RelativeOrAbsoluteBlockHeight]> };

export type Preallocated = {
  allocations: Record<U128, Pubkey[]>;
  vesting_plan: VestingPlan;
};

export type PurchaseBurnSwap = {
  input_asset: InputAsset;
  transfer_scheme: TransferScheme;
  transfer_ratio_type: TransferRatioType;
};

export type SimpleAsset = {
  supply_cap?: U128;
  divisibility: number;
  live_time: BlockHeight;
};

export type NFTAsset = {
  supply_cap?: U128;
  divisibility: number;
  live_time: BlockHeight;
  name: String;
  url: String;
  url_hash: String;
};

export type DistributionSchemes = {
  preallocated?: Preallocated;
  free_mint?: FreeMint;
  purchase?: PurchaseBurnSwap;
  nft_mint?: NFTMint;
};

export type AssetContract = {
  asset: SimpleAsset;
  distribution_schemes: DistributionSchemes;
};
