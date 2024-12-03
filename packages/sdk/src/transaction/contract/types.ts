import { MintBurnAssetContract } from "./mba";
import { MintOnlyAssetContract } from "./moa";
import { SpecContract } from "./spec";

export type ContractType =
  | { moa: MintOnlyAssetContract }
  | { mba: MintBurnAssetContract }
  | { spec: SpecContract };
