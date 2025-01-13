import {
  BlockTxTuple,
  Pubkey,
  Fraction,
  RelativeOrAbsoluteBlockHeight,
  U128,
} from "../utils";

type VestingPlan =
  | { timelock: RelativeOrAbsoluteBlockHeight }
  | { scheduled: Array<[Fraction, RelativeOrAbsoluteBlockHeight]> };

export type OracleSetting = {
  pubkey: Pubkey;
  // set asset_id to none to fully trust the oracle, ordinal_number if ordinal, rune's block_tx if rune, etc
  asset_id?: string;
  // delta block_height in which the oracle message still valid
  block_height_slippage: number;
};

export type RatioType =
  | {
      fixed: {
        ratio: Fraction;
      };
    }
  | {
      oracle: {
        setting: OracleSetting;
      };
    };

export type InputAsset =
  | "raw_btc"
  | { glittr_asset: BlockTxTuple }
  | "rune"
  | "ordinal";

export type Preallocated = {
  allocations: Record<U128, Pubkey[]>;
  vesting_plan?: VestingPlan;
};
export type FreeMint = {
  supply_cap?: U128;
  amount_per_mint: U128;
};

export type PurchaseBurnSwap = {
  input_asset: InputAsset;
  pay_to_key?: Pubkey;
  ratio: RatioType;
};

export type ArgsCommitment = {
  fixed_string: string;
  string: string
}

export type Commitment = {
  public_key: Pubkey;
  args: ArgsCommitment 
}