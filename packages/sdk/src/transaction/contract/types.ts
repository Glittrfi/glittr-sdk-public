import { OutPoint } from "../../utils/common";
import { AssetContractFreeMint, AssetContractPurchaseBurnSwap } from "./asset";

type OracleMessage = {
  input_outpoint: OutPoint;
  min_in_value: bigint;
  out_value: bigint;
  asset_id?: string;
};

type OracleMessageSigned = {
  signature: Uint8Array;
  message: OracleMessage;
};

type MintOption = {
  pointer: number;
  oracle_message?: OracleMessageSigned;
};

export type ContractType =
  | { type: "preallocated"; asset: {} }
  | { type: "free_mint"; asset: AssetContractFreeMint }
  | { type: "purchase_burn_swap"; asset: AssetContractPurchaseBurnSwap };

export type CallType = { mint: MintOption } | { burn: {} } | { swap: {} };

// export type CallType =
//   | { type: "mint"; mintOption: MintOption }
//   | { type: "burn" }
//   | { type: "swap" };
