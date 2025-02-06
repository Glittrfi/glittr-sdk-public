import { RelativeOrAbsoluteBlockHeight, Varuint } from "../../utils";

export type NftAssetContract = {
  asset_image: number[];
  supply_cap?: Varuint;
  live_time: RelativeOrAbsoluteBlockHeight;
  end_time?: RelativeOrAbsoluteBlockHeight;
  pointer?: Varuint;
};
