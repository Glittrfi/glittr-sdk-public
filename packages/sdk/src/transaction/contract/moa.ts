import { BlockHeight, U128 } from "../../utils";
import { Commitment, FreeMint, Preallocated, PurchaseBurnSwap } from "../shared";

export type MOAMintMechanism = {
  preallocated?: Preallocated;
  free_mint?: FreeMint;
  purchase?: PurchaseBurnSwap;
};

export type MintOnlyAssetContract = {
  ticker?: string;
  supply_cap?: U128;
  divisibility: number;
  live_time: BlockHeight;
  mint_mechanism: MOAMintMechanism;
  commitment?: Commitment
};
