import { BlockHeight, Varuint } from "../../utils";

export type NftAssetContract = {
  asset_image: number[];
  supply_cap?: Varuint;
  live_time: BlockHeight;
  end_time?: BlockHeight;
  pointer?: Varuint;
};
