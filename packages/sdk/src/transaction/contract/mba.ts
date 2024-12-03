import { BlockHeight, Fraction, U128 } from "../../utils";
import {
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
  fee?: U128;
};

export type MintBurnAssetContract = {
  ticker?: string;
  supply_cap?: U128;
  divisibility: number;
  live_time: BlockHeight;
  mint_mechanism: MBAMintMechanism;
  burn_mechanism: BurnMechanism;
  swap_mechanism: SwapMechanism;
};
