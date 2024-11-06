import { BlockTxTuple, U128 } from "../../utils";

export type TxTypeTransfer = {
  asset: BlockTxTuple;
  output: number;
  amount: U128;
};
