export type Network = "regtest" | "testnet" | "mainnet";

type BlockHeight = number;
type BlockTxTuple = [number, number];
type Ratio = number;
type BitcoinAddress = string;
type OutPoint = string; // Define based on your Rust struct if it's a complex structure

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

type AssetContract =
    | { type: "preallocated"; todo?: null }
    | { type: "free_mint"; supply_cap?: number; amount_per_mint: number; divisibility: number; live_time: BlockHeight }
    | { type: "purchase_burn_swap"; purchaseBurnSwap: AssetContractPurchaseBurnSwap };

type InputAsset = 
    | { type: "raw_btc" }
    | { type: "glittr_asset"; value: BlockTxTuple }
    | { type: "metaprotocol" };

type TransferScheme =
    | { type: "purchase"; address: BitcoinAddress }
    | { type: "burn" };

interface OracleSetting {
    asset_id?: string;
}

type TransferRatioType =
    | { type: "fixed"; ratio: Ratio }
    | { type: "oracle"; pubkey: Uint8Array; setting: OracleSetting };

type ContractType = { type: "asset"; assetContract: AssetContract };

type CallType =
    | { type: "mint"; mintOption: MintOption }
    | { type: "burn" }
    | { type: "swap" };

interface MintOption {
    pointer: number;
    oracle_message?: OracleMessageSigned;
}

interface OracleMessageSigned {
    signature: Uint8Array;
    message: OracleMessage;
}

interface OracleMessage {
    input_outpoint: OutPoint;
    min_in_value: bigint;
    out_value: bigint;
    asset_id?: string;
}

type TxType = 
    | { type: "transfer"; asset: BlockTxTuple; n_outputs: number; amounts: number[] }
    | { type: "contract_creation"; contractType: ContractType }
    | { type: "contract_call"; contract: BlockTxTuple; callType: CallType };

interface OpReturnMessage {
    tx_type: TxType;
}
