export type MintFormat = {
  tx_type: {
    contract_call: {
      contract: string;
      call_type: {
        mint: {
          pointer: number;
        };
      };
    };
  };
};

export type FreeMintContractInstantiateFormat = {
  tx_type: {
    contract_creation: {
      contract_type: {
        asset: {
          free_mint: {
            amount_per_mint: number;
            divisibility: number;
            live_time: number;
            supply_cap: number;
          };
        };
      };
    };
  };
};

export type TransferFormat = {
  tx_type: {
    transfer: {
      asset: string;
      n_outputs: number;
      amounts: number[];
    };
  };
};
