export type TransferParams = {
  asset: string;
  nOutput: number;
  amounts: number[];
};

export type FreeMintContractParams = {
  supplyCap: number;
  amountPerMint: number;
  divisibilty: number;
  liveTime: number;
};

export type MintContractCallParams = {
  contractId: [number, number];
  pointer: number;
};
export class TransactionBuilder {
  constructor() {}

  static tranfer(params: TransferParams) {
    return {
      tx_type: {
        transfer: {
          asset: params.asset,
          n_outputs: params.nOutput,
          amounts: params.amounts,
        },
      },
    };
  }

  static freeMintContractInstantiate(params: FreeMintContractParams) {
    return {
      tx_type: {
        contract_creation: {
          contract_type: {
            asset: {
              free_mint: {
                supply_cap: params.supplyCap,
                amount_per_mint: params.amountPerMint,
                divisibility: params.divisibilty,
                live_time: params.liveTime,
              },
            },
          },
        },
      },
    };
  }

  static mint(params: MintContractCallParams) {
    return {
      tx_type: {
        contract_call: {
          contract: params.contractId,
          call_type: {
            mint: {
              pointer: params.pointer,
            },
          },
        },
      },
    };
  }

  static createPurchaseBurnSwapContract() {} // TODO
  static createPreAllocatedContract() {} // TODO
}

export * from './utxo'