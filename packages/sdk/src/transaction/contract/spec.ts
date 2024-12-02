import { BlockTxTuple, Pubkey } from "../../utils";
import { InputAsset } from "../shared";

type MintOnlyAssetSpecPegInType = { pub_key: Pubkey } | "burn";
type MintOnlyAssetSpec = {
  input_asset?: InputAsset;
  peg_in_type?: MintOnlyAssetSpecPegInType;
};
type MintBurnAssetSpecMint = "proportional" | "fixed";
type MintBurnAssetSpec = {
  _mutable_assets: boolean;
  input_assets?: InputAsset[];
  mint?: MintBurnAssetSpecMint;
};
type SpecContractType =
  | { mint_only_asset: MintOnlyAssetSpec }
  | { mint_burn_asset: MintBurnAssetSpec };

export type SpecContract = {
  spec: SpecContractType;
  pointer?: number;
  block_tx?: BlockTxTuple;
};
