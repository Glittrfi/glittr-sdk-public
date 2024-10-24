export class TransactionBuilder {
  constructor() {}

  static tranfer(asset: string, nOutput: number, amounts: number[]) {
    return {
      tx_type: {
        transfer: {
          asset: asset,
          n_outputs: nOutput,
          amounts: amounts,
        },
      },
    };
  }

  static createFreeMintContract(
    supplyCap: number,
    amountPerMint: number,
    divisibilty: number,
    liveTime: number
  ) {
    return {
      tx_type: {
        contract_creation: {
          contract_type: {
            asset: {
              free_mint: {
                supply_cap: supplyCap,
                amount_per_mint: amountPerMint,
                divisibilty: divisibilty,
                live_time: liveTime,
              },
            },
          },
        },
      },
    };
  }

  static createPurchaseBurnSwapContract() {}
  static createPreAllocatedContract() {}
  static callContract() {}
}