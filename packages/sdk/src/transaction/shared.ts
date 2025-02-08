import {
  BlockTxTuple,
  Pubkey,
  Fraction,
  RelativeOrAbsoluteBlockHeight,
  Varuint,
  U128,
} from "../utils";

type VestingPlan =
  | { timelock: RelativeOrAbsoluteBlockHeight }
  | { scheduled: Array<{ ratio: Varuint[], tolerance: number }> };

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
  | { raw_btc: {} }
  | { glittr_asset: BlockTxTuple }
  | { rune: {} }
  | { ordinal: {} };

export type AllocationType =
  | { vec_pubkey: Pubkey[] }
  | {
    bloom_filter: {
      filter: number[],
      arg: { tx_id: {} }
    }
  }

export type Preallocated = {
  allocations: Map<Varuint, AllocationType> | Map<U128, AllocationType>;
  vesting_plan?: VestingPlan;
};
export type FreeMint = {
  supply_cap?: Varuint | U128;
  amount_per_mint: Varuint | U128;
};

export type PurchaseBurnSwap = {
  input_asset: InputAsset;
  pay_to_key?: Pubkey;
  ratio: RatioType;
};

export type ArgsCommitment = {
  fixed_string: {
    number: Uint8Array;
    spacers: Uint8Array;
  } | {
    number: Uint8Array;
    spacers?: undefined;
  } | string;
  string: string
}

export type Commitment = {
  public_key: Pubkey;
  args: ArgsCommitment
}
