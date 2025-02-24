import { OutPoint, Fraction, U128, Pubkey, Varuint } from "../../utils";

type AssertValues = {
  input_values?: Varuint[] | U128[]
  total_collateralized?: Varuint[] | U128[]
  min_out_value?: Varuint | U128
}

export type OracleMessage = {
  input_outpoint?: OutPoint;
  min_in_value?: Varuint | U128;
  out_value?: Varuint | U128;
  asset_id?: string;
  ratio?: Fraction;
  ltv?: Fraction;
  outstanding?: Varuint | number;
  block_height: Varuint | number;
};

export type OracleMessageSigned = {
  signature: number[];
  message: OracleMessage;
};

export type MintBurnOption = {
  pointer?: Varuint | number;
  oracle_message?: OracleMessageSigned;
  pointer_to_key?: Varuint | number;
  assert_values?: AssertValues;
  commitment_message?: CommitmentMessage;
};

export type SwapOption = {
  pointer: Varuint | number;
  assert_values?: AssertValues;
};

export type OpenAccountOption = {
  pointer_to_key: Varuint | number;
  share_amount: Varuint | U128
}

export type CloseAccountOption = {
  pointer: Varuint | number;
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
