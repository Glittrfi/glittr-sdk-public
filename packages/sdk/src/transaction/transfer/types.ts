import { BlockTxTuple, U128, Varuint } from "../../utils";

export type TxTypeTransfer = {
  asset: BlockTxTuple;
  output: Varuint | number;
  amount: Varuint | U128;
};
