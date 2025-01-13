import { BlockTxTuple } from "../utils/common";
import { CallType } from "./calltype/types";
import { ContractType } from "./contract/types";
import { TxTypeTransfer } from "./transfer/types";

export type Transfer = {
  transfers: TxTypeTransfer[];
};

export type ContractCreation = {
  contract_type: ContractType;
  spec?: BlockTxTuple
};

export type ContractCall = {
  contract: BlockTxTuple | null;
  call_type: CallType;
};

export type OpReturnMessage = {
  transfer?: Transfer;
  contract_creation?: ContractCreation;
  contract_call?: ContractCall;
};