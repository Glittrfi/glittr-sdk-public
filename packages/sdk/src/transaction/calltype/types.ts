import { OutPoint, Fraction, U128, Pubkey, Varuint } from "../../utils";

type AssertValues = {
  input_values?: Varuint[]
  total_collateralized?: Varuint[]
  min_out_value?: Varuint[]
}

export type OracleMessage = {
  input_outpoint?: OutPoint;
  min_in_value?: Varuint;
  out_value?: Varuint;
  asset_id?: string;
  ratio?: Fraction;
  ltv?: Fraction;
  outstanding?: Varuint;
  block_height: Varuint;
};

export type OracleMessageSigned = {
  signature: number[];
  message: OracleMessage;
};

export type MintBurnOption = {
  pointer?: Varuint;
  oracle_message?: OracleMessageSigned;
  pointer_to_key?: Varuint;
  assert_values?: AssertValues;
  commitment_message?: CommitmentMessage;
};

export type SwapOption = {
  pointer: Varuint;
  assert_values?: AssertValues;
};

export type OpenAccountOption = {
  pointer_to_key: Varuint;
  share_amount: Varuint
}

export type CloseAccountOption = {
  pointer: Varuint;
}

export type CommitmentMessage = {
  public_key: Pubkey;
  args: number[];
}

export type CallType =
  | { mint: MintBurnOption }
  | { burn: MintBurnOption }
  | { swap: SwapOption }
  | { open_account: OpenAccountOption }
  | { close_account: CloseAccountOption }
