import { BlockTxTuple, OutPoint, Ratio, U128 } from "../../utils";
import { ProposalCreation, Vote } from "./governance";

export type OracleMessage = {
  input_outpoint?: OutPoint;
  min_in_value?: U128;
  out_value?: U128;
  asset_id?: string;
  ratio?: Ratio;
  block_height: number;
};

export type OracleMessageSigned = {
  signature: number[];
  message: OracleMessage;
};

export type MintOption = {
  pointer: number;
  oracle_message?: OracleMessageSigned;
};

export type CallType =
  | { mint: MintOption }
  | { burn: {} }
  | { swap: {} }
  | { create_proposal: ProposalCreation }
  | { vote: Vote }
  | { execute_proposal: BlockTxTuple }
  | { VetoProposal: BlockTxTuple };
