import { RelativeOrAbsoluteBlockHeight, U128, Varuint } from "../../utils";
import {
  Commitment,
  FreeMint,
  Preallocated,
  PurchaseBurnSwap,
} from "../shared";

export type MOAMintMechanism = {
  preallocated?: Preallocated;
  free_mint?: FreeMint;
  purchase?: PurchaseBurnSwap;
};

export type MintOnlyAssetContract = {
  ticker?:
    | {
        number: Uint8Array;
        spacers: Uint8Array;
      }
    | {
        number: Uint8Array;
        spacers?: undefined;
      } | string;
  supply_cap?: Varuint | U128;
  divisibility: number;
  live_time: RelativeOrAbsoluteBlockHeight;
  end_time?: RelativeOrAbsoluteBlockHeight;
  mint_mechanism: MOAMintMechanism;
  commitment?: Commitment;
};
