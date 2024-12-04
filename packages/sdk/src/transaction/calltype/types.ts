import { OutPoint, Fraction, U128 } from "../../utils";

export type OracleMessage = {
  input_outpoint?: OutPoint;
  min_in_value?: U128;
  out_value?: U128;
  asset_id?: string;
  ratio?: Fraction;
  block_height: number;
};

export type OracleMessageSigned = {
  signature: number[];
  message: OracleMessage;
};

export type MintBurnOption = {
  pointer?: number;
  oracle_message?: OracleMessageSigned;
  pointer_to_key?: number;
};

export type SwapOption = {
  pointer: number;
};

export type OpenAccountOption = {
  pointer_to_key: number;
  share_amount: U128
}

export type CloseAccountOption = {
  pointer: number;
}

export type CallType =
  | { mint: MintBurnOption }
  | { burn: MintBurnOption }
  | { swap: SwapOption }
  | { open_account: OpenAccountOption }
  | { close_account: CloseAccountOption }
