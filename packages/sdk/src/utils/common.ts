export type Varuint = Uint8Array
export type BlockHeight = number;
export type BlockTxTuple = [Varuint, Varuint];
export type Fraction = [Varuint, Varuint];
export type BitcoinAddress = string;
export type OutPointStr = string;
export type RelativeOrAbsoluteBlockHeight = number;

export type U128 = string; // Using string to handle large numbers safely
export type Pubkey = number[];
export type OutPoint = {
  txid: string;
  vout: number;
};