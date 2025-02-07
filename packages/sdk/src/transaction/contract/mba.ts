import { Fraction, RelativeOrAbsoluteBlockHeight, U128, Varuint } from "../../utils";
import {
  Commitment,
  FreeMint,
  InputAsset,
  OracleSetting,
  Preallocated,
  PurchaseBurnSwap,
  RatioType,
} from "../shared";

// MBA Mint Mechanism
type RatioModel = "constant_product";
type ProportionalType = {
  ratio_model: RatioModel;
  inital_mint_pointer_to_key?: number;
};
type AccountType = {
  max_ltv: Fraction;
  ratio: RatioType;
};
type MintStructure =
  | { ratio: RatioType }
  | { proportional: ProportionalType }
  | { account: AccountType };

export type Collateralized = {
  input_assets: InputAsset[];
  _mutable_assets: boolean;
  mint_structure: MintStructure;
};

export type MBAMintMechanism = {
  preallocated?: Preallocated;
  free_mint?: FreeMint;
  purchase?: PurchaseBurnSwap;
  collateralized?: Collateralized;
};

// Burn Mechanism
type ReturnCollateral = {
  fee?: Fraction;
  oracle_setting?: OracleSetting;
};
export type BurnMechanism = {
  return_collateral?: ReturnCollateral;
};

// Swap Mechanism
export type SwapMechanism = {
  fee?: Varuint | U128;
};

export type MintBurnAssetContract = {
  ticker?: {
    number: Uint8Array;
    spacers: Uint8Array;
  } | {
    number: Uint8Array;
    spacers?: undefined;
  } | string;
  supply_cap?: Varuint | U128;
  divisibility: number;
  live_time: RelativeOrAbsoluteBlockHeight;
  end_time?: RelativeOrAbsoluteBlockHeight;
  mint_mechanism: MBAMintMechanism;
  burn_mechanism: BurnMechanism;
  swap_mechanism: SwapMechanism;
  commitment?: Commitment
};
