export type Network = "regtest" | "testnet" | "mainnet";

export type BlockHeight = number;
export type BlockTxTuple = [number, number];
export type Ratio = number;
export type BitcoinAddress = string;
export type OutPoint = string; // Define based on your Rust struct if it's a complex structure

interface AssetContractFreeMint {
    supply_cap?: number;
    amount_per_mint: number;
    divisibility: number;
    live_time: BlockHeight;
}

interface AssetContractPurchaseBurnSwap {
    input_asset: InputAsset;
    transfer_scheme: TransferScheme;
    transfer_ratio_type: TransferRatioType;
}

export type AssetContract =
    | { type: "preallocated"; todo?: null }
    | { type: "free_mint"; supply_cap?: number; amount_per_mint: number; divisibility: number; live_time: BlockHeight }
    | { type: "purchase_burn_swap"; purchaseBurnSwap: AssetContractPurchaseBurnSwap };

export type InputAsset = 
    | { type: "raw_btc" }
    | { type: "glittr_asset"; value: BlockTxTuple }
    | { type: "metaprotocol" };

export type TransferScheme =
    | { type: "purchase"; address: BitcoinAddress }
    | { type: "burn" };

export interface OracleSetting {
    asset_id?: string;
}

export type TransferRatioType =
    | { type: "fixed"; ratio: Ratio }
    | { type: "oracle"; pubkey: Uint8Array; setting: OracleSetting };

export type ContractType = { type: "asset"; assetContract: AssetContract };

export type CallType =
    | { type: "mint"; mintOption: MintOption }
    | { type: "burn" }
    | { type: "swap" };

export interface MintOption {
    pointer: number;
    oracle_message?: OracleMessageSigned;
}

export interface OracleMessageSigned {
    signature: Uint8Array;
    message: OracleMessage;
}

export interface OracleMessage {
    input_outpoint: OutPoint;
    min_in_value: bigint;
    out_value: bigint;
    asset_id?: string;
}

export type TxType = 
    | { type: "transfer"; asset: BlockTxTuple; n_outputs: number; amounts: number[] }
    | { type: "contract_creation"; contractType: ContractType }
    | { type: "contract_call"; contract: BlockTxTuple; callType: CallType };

export interface OpReturnMessage {
    tx_type: TxType;
}