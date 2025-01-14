import { BlockHeight, U128, Varuint } from "../../utils";
import { Commitment, FreeMint, Preallocated, PurchaseBurnSwap } from "../shared";

export type MOAMintMechanism = {
  preallocated?: Preallocated;
  free_mint?: FreeMint;
  purchase?: PurchaseBurnSwap;
};

export type MintOnlyAssetContract = {
  ticker?: string;
  supply_cap?: Varuint;
  divisibility: number;
  live_time: BlockHeight;
  end_time?: BlockHeight;
  mint_mechanism: MOAMintMechanism;
  commitment?: Commitment
};
