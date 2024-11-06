import { OutPoint, U128 } from "../../utils";

export type OracleMessage = {
  input_outpoint: OutPoint;
  min_in_value: U128;
  out_value: U128;
  asset_id?: string;
  block_height: number;
};

export type OracleMessageSigned = {
  signature: Uint8Array;
  message: OracleMessage;
};

export type MintOption = {
  pointer: number;
  oracle_message?: OracleMessageSigned;
};

export type CallType = { mint: MintOption } | { burn: {} } | { swap: {} };
