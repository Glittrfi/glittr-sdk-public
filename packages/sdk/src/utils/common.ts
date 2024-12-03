export type BlockHeight = number;
export type BlockTxTuple = [number, number];
export type Fraction = [number, number];
export type BitcoinAddress = string;
export type OutPointStr = string;
export type RelativeOrAbsoluteBlockHeight = number;

export type U128 = string; // Using string to handle large numbers safely
export type Pubkey = number[];
export type OutPoint = {
  txid: string;
  vout: number;
};
