import { BlockTxTuple, U128, Varuint } from "../../utils";

export type TxTypeTransfer = {
  asset: BlockTxTuple;
  output: Varuint;
  amount: Varuint;
};
