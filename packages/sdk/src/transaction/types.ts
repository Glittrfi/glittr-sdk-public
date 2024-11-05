import { BlockTxTuple } from "../utils/common";
import { CallType, ContractType } from "./contract/types";

export type TxType =
  | {
      type: "transfer";
      asset: BlockTxTuple;
      n_outputs: number;
      amounts: number[];
    }
  | { type: "contract_creation"; contractType: ContractType }
  | { type: "contract_call"; contract: BlockTxTuple; callType: CallType };

export interface OpReturnMessage {
  tx_type: TxType;
}

export type FreeMintContractParams = {
  supplyCap: number;
  amountPerMint: number;
  divisibilty: number;
  liveTime: number;
};

export type MintContractCallParams = {
  contractId: [number, number];
  pointer: number;
};

// export type TxTypeNew =
//     | { transfer: { asset: BlockTxTuple, n_outputs: number, amounts: number[] } }
//     | { contract_creation: { contractType: ContractType } }
//     | { contract_call: { contract: BlockTxTuple, callType: CallType } };
