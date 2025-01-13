
export type ContractAsset = {
    contract_id: string;
    divisibility: number;
    ticker: string;
};

export type ContractInfo = {
    divisibility: number;
    supply_cap?: string;
    ticker?: string;
    total_supply: string;
    type: {
        free_mint?: boolean;
        collateralized?: {
            assets: ContractAsset[];
        };
    };
};

export type BalanceData = {
    balance: {
        summarized: {
            [key: string]: string;
        };
        utxos: {
            assets: {
                [key: string]: string;
            };
            txid: string;
            vout: number;
        }[];
    };
    contract_info: {
        [key: string]: ContractInfo;
    };
};
