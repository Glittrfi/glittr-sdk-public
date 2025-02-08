import { RelativeOrAbsoluteBlockHeight, U128, Varuint } from "../../utils";

export type NftAssetContract = {
  asset: number[];
  supply_cap?: Varuint | U128;
  live_time: RelativeOrAbsoluteBlockHeight;
  end_time?: RelativeOrAbsoluteBlockHeight;
  pointer?: Varuint | number;
};
