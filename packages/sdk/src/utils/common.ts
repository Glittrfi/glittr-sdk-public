export type Varuint = Uint8Array
export type Varint = Uint8Array
export type BlockTxTuple = [Varuint, Varuint] | [number, number];
export type Fraction = [Varuint, Varuint] | [number, number];
export type BitcoinAddress = string;
export type OutPointStr = string;
export type RelativeOrAbsoluteBlockHeight = Varint | number;

export type U128 = string; // Using string to handle large numbers safely
export type Pubkey = number[];
export type OutPoint = {
  txid: string;
  vout: number;
};
