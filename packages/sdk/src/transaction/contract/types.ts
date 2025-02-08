import { MintBurnAssetContract } from "./mba";
import { MintOnlyAssetContract } from "./moa";
import { NftAssetContract } from "./nft";
import { SpecContract } from "./spec";

export type ContractType =
  | { moa: MintOnlyAssetContract }
  | { mba: MintBurnAssetContract }
  | { spec: SpecContract }
  | { nft: NftAssetContract };
