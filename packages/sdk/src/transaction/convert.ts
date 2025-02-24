import {
  BlockTxTuple,
  encodeBase26,
  encodeVaruint,
  Fraction,
  U128,
  Varint,
  Varuint,
} from "../utils";
import { OpReturnMessage } from "./types";
import { encodeVarint } from "../utils/varint";
import { MintOnlyAssetContract } from "./contract/moa";
import { MintBurnAssetContract } from "./contract/mba";
import { SpecContract } from "./contract/spec";
import { ContractType } from "./contract/types";
import { NftAssetContract } from "./contract/nft";
import {
  AllocationType,
  InputAsset,
  Preallocated,
  PurchaseBurnSwap,
  VestingPlan,
} from "./shared";

function convertToVaruint(value: Varuint | U128 | number): Varuint {
  if (value instanceof Uint8Array) return value;
  return encodeVaruint(Number(value));
}

function convertToVarint(value: Varint | number): Varint {
  if (value instanceof Uint8Array) return value;
  return encodeVarint(value);
}

function transformBlockTxTuple(tuple: BlockTxTuple): BlockTxTuple {
  return [
    convertToVaruint(tuple[0]) as Varuint,
    convertToVaruint(tuple[1]) as Varuint,
  ];
}

function transformFraction(fraction: Fraction): Fraction {
  return [
    convertToVaruint(fraction[0]) as Varuint,
    convertToVaruint(fraction[1]) as Varuint,
  ];
}

function transformInputAsset(input_asset: InputAsset): InputAsset {
  if ("glittr_asset" in input_asset) {
    return {
      glittr_asset: transformBlockTxTuple(input_asset.glittr_asset),
    };
  }
  return input_asset;
}

function transformAllocationType(allocation: AllocationType): AllocationType {
  if ("bloom_filter" in allocation) {
    return {
      bloom_filter: {
        ...allocation.bloom_filter,
        filter: allocation.bloom_filter.filter,
      },
    };
  }
  return allocation;
}

function transformVestingPlan(
  vesting_plan?: VestingPlan
): VestingPlan | undefined {
  if (!vesting_plan) return undefined;

  if ("timelock" in vesting_plan) {
    return {
      timelock: convertToVarint(vesting_plan.timelock),
    };
  }
  return {
    scheduled: vesting_plan.scheduled.map((item) => ({
      ratio: item.ratio.map((r) => convertToVaruint(r)),
      tolerance: item.tolerance,
    })),
  };
}

function transformPurchase(
  purchase?: PurchaseBurnSwap
): PurchaseBurnSwap | undefined {
  if (!purchase) return undefined;

  return {
    ...purchase,
    input_asset: transformInputAsset(purchase.input_asset),
    ratio: {
      ...purchase.ratio,
      ...("fixed" in purchase.ratio
        ? {
            fixed: {
              ratio: transformFraction(purchase.ratio.fixed.ratio),
            },
          }
        : {}),
    },
  };
}

function transformPreallocated(
  preallocated?: Preallocated
): Preallocated | undefined {
  if (!preallocated) return undefined;

  return {
    allocations: preallocated.allocations,
    vesting_plan: transformVestingPlan(preallocated.vesting_plan),
  };
}

function transformMOAContract(
  contract: MintOnlyAssetContract
): MintOnlyAssetContract {
  if (!contract) return contract;

  return {
    ...contract,
    ticker:
      typeof contract.ticker === "string"
        ? encodeBase26(contract.ticker)
        : contract.ticker,
    supply_cap: contract.supply_cap && convertToVaruint(contract.supply_cap),
    live_time: convertToVarint(contract.live_time),
    end_time: contract.end_time && convertToVarint(contract.end_time),
    mint_mechanism: contract.mint_mechanism && {
      ...contract.mint_mechanism,
      free_mint: contract.mint_mechanism.free_mint && {
        ...contract.mint_mechanism.free_mint,
        supply_cap:
          contract.mint_mechanism.free_mint.supply_cap &&
          convertToVaruint(contract.mint_mechanism.free_mint.supply_cap),
        amount_per_mint: convertToVaruint(
          contract.mint_mechanism.free_mint.amount_per_mint
        ),
      },
      purchase: transformPurchase(contract.mint_mechanism.purchase),
      preallocated: transformPreallocated(contract.mint_mechanism.preallocated),
    },
    commitment: contract.commitment && {
      ...contract.commitment,
      args: {
        ...contract.commitment.args,
        fixed_string:
          typeof contract.commitment.args.fixed_string === "string"
            ? encodeBase26(contract.commitment.args.fixed_string)
            : contract.commitment.args.fixed_string,
      },
    },
  };
}

function transformMBAContract(
  contract: MintBurnAssetContract
): MintBurnAssetContract {
  if (!contract) return contract;

  return {
    ...contract,
    ticker:
      typeof contract.ticker === "string"
        ? encodeBase26(contract.ticker)
        : contract.ticker,
    supply_cap: contract.supply_cap && convertToVaruint(contract.supply_cap),
    live_time: convertToVarint(contract.live_time),
    end_time: contract.end_time && convertToVarint(contract.end_time),
    swap_mechanism: contract.swap_mechanism && {
      ...contract.swap_mechanism,
      fee:
        contract.swap_mechanism.fee &&
        convertToVaruint(contract.swap_mechanism.fee),
    },
    burn_mechanism: contract.burn_mechanism && {
      ...contract.burn_mechanism,
      return_collateral: contract.burn_mechanism.return_collateral && {
        ...contract.burn_mechanism.return_collateral,
        fee:
          contract.burn_mechanism.return_collateral.fee &&
          transformFraction(contract.burn_mechanism.return_collateral.fee),
      },
    },
    mint_mechanism: contract.mint_mechanism && {
      ...contract.mint_mechanism,
      free_mint: contract.mint_mechanism.free_mint && {
        ...contract.mint_mechanism.free_mint,
        supply_cap:
          contract.mint_mechanism.free_mint.supply_cap &&
          convertToVaruint(contract.mint_mechanism.free_mint.supply_cap),
        amount_per_mint: convertToVaruint(
          contract.mint_mechanism.free_mint.amount_per_mint
        ),
      },
      purchase: transformPurchase(contract.mint_mechanism.purchase),
      preallocated: transformPreallocated(contract.mint_mechanism.preallocated),
      collateralized: contract.mint_mechanism.collateralized && {
        ...contract.mint_mechanism.collateralized,
        input_assets:
          contract.mint_mechanism.collateralized.input_assets.map(
            transformInputAsset
          ),
        mint_structure:
          "ratio" in contract.mint_mechanism.collateralized.mint_structure &&
          "fixed" in contract.mint_mechanism.collateralized.mint_structure.ratio
            ? {
                ratio: {
                  fixed: {
                    ratio: transformFraction(
                      contract.mint_mechanism.collateralized.mint_structure
                        .ratio.fixed.ratio
                    ),
                  },
                },
              }
            : contract.mint_mechanism.collateralized.mint_structure,
      },
    },
    commitment: contract.commitment && {
      ...contract.commitment,
      args: {
        ...contract.commitment.args,
        fixed_string:
          typeof contract.commitment.args.fixed_string === "string"
            ? encodeBase26(contract.commitment.args.fixed_string)
            : contract.commitment.args.fixed_string,
      },
    },
  };
}

function transformNFTContract(contract: NftAssetContract): NftAssetContract {
  if (!contract) return contract;

  return {
    ...contract,
    supply_cap:
      contract.supply_cap !== undefined
        ? convertToVaruint(contract.supply_cap)
        : undefined,
    live_time: convertToVarint(contract.live_time),
    end_time: contract.end_time && convertToVarint(contract.end_time),
    pointer:
      contract.pointer !== undefined
        ? convertToVaruint(contract.pointer)
        : undefined,
  };
}

function transformSpecContract(contract: SpecContract): SpecContract {
  if (!contract) return contract;

  return {
    ...contract,
    pointer:
      contract.pointer !== undefined
        ? convertToVaruint(contract.pointer)
        : undefined,
    block_tx: contract.block_tx && transformBlockTxTuple(contract.block_tx),
  };
}

function transformContractType(contractType: ContractType): ContractType {
  if (!contractType) return contractType;

  if ("moa" in contractType) {
    return {
      moa: transformMOAContract(contractType.moa),
    };
  } else if ("mba" in contractType) {
    return {
      mba: transformMBAContract(contractType.mba),
    };
  } else if ("spec" in contractType) {
    return {
      spec: transformSpecContract(contractType.spec),
    };
  } else {
    return {
      nft: transformNFTContract(contractType.nft),
    };
  }
}

export function transformOpReturnMessage(
  message: OpReturnMessage
): OpReturnMessage {
  const transformed: OpReturnMessage = { ...message };
  console.log(JSON.stringify(transformed))

  if (transformed.transfer?.transfers) {
    transformed.transfer.transfers = transformed.transfer.transfers.map(
      (item) => ({
        asset: transformBlockTxTuple(item.asset)!,
        output: convertToVaruint(item.output),
        amount: convertToVaruint(item.amount),
      })
    );
  }

  if (transformed.contract_creation) {
    transformed.contract_creation = {
      contract_type: transformContractType(
        transformed.contract_creation.contract_type
      ),
      spec:
        transformed.contract_creation.spec &&
        transformBlockTxTuple(transformed.contract_creation.spec),
    };
  }

  if (transformed.contract_call) {
    transformed.contract_call = {
      contract:
        transformed.contract_call.contract &&
        transformBlockTxTuple(transformed.contract_call.contract),
      call_type: transformed.contract_call.call_type && {
        ...transformed.contract_call.call_type,
        ...("mint" in transformed.contract_call.call_type
          ? {
              mint: {
                ...transformed.contract_call.call_type.mint,
                pointer:
                  transformed.contract_call.call_type.mint.pointer !== undefined
                    ? convertToVaruint(
                        transformed.contract_call.call_type.mint.pointer
                      )
                    : undefined,
                pointer_to_key:
                  transformed.contract_call.call_type.mint.pointer_to_key !==
                  undefined
                    ? convertToVaruint(
                        transformed.contract_call.call_type.mint.pointer_to_key
                      )
                    : undefined,
                assert_values: transformed.contract_call.call_type.mint
                  .assert_values && {
                  ...transformed.contract_call.call_type.mint.assert_values,
                  input_values:
                    transformed.contract_call.call_type.mint.assert_values.input_values?.map(
                      convertToVaruint
                    ),
                  total_collateralized:
                    transformed.contract_call.call_type.mint.assert_values.total_collateralized?.map(
                      convertToVaruint
                    ),
                  min_out_value:
                    transformed.contract_call.call_type.mint.assert_values
                      .min_out_value &&
                    convertToVaruint(
                      transformed.contract_call.call_type.mint.assert_values
                        .min_out_value
                    ),
                },
              },
            }
          : {}),
        ...("burn" in transformed.contract_call.call_type
          ? {
              burn: {
                ...transformed.contract_call.call_type.burn,
                pointer:
                  transformed.contract_call.call_type.burn.pointer !== undefined
                    ? convertToVaruint(
                        transformed.contract_call.call_type.burn.pointer
                      )
                    : undefined,
                pointer_to_key:
                  transformed.contract_call.call_type.burn.pointer_to_key !==
                  undefined
                    ? convertToVaruint(
                        transformed.contract_call.call_type.burn.pointer_to_key
                      )
                    : undefined,
                assert_values: transformed.contract_call.call_type.burn
                  .assert_values && {
                  ...transformed.contract_call.call_type.burn.assert_values,
                  input_values:
                    transformed.contract_call.call_type.burn.assert_values.input_values?.map(
                      convertToVaruint
                    ),
                  total_collateralized:
                    transformed.contract_call.call_type.burn.assert_values.total_collateralized?.map(
                      convertToVaruint
                    ),
                  min_out_value:
                    transformed.contract_call.call_type.burn.assert_values
                      .min_out_value &&
                    convertToVaruint(
                      transformed.contract_call.call_type.burn.assert_values
                        .min_out_value
                    ),
                },
              },
            }
          : {}),
        ...("swap" in transformed.contract_call.call_type
          ? {
              swap: {
                ...transformed.contract_call.call_type.swap,
                pointer: convertToVaruint(
                  transformed.contract_call.call_type.swap.pointer
                ),
                assert_values: transformed.contract_call.call_type.swap
                  .assert_values && {
                  ...transformed.contract_call.call_type.swap.assert_values,
                  input_values:
                    transformed.contract_call.call_type.swap.assert_values.input_values?.map(
                      convertToVaruint
                    ),
                  total_collateralized:
                    transformed.contract_call.call_type.swap.assert_values.total_collateralized?.map(
                      convertToVaruint
                    ),
                  min_out_value:
                    transformed.contract_call.call_type.swap.assert_values
                      .min_out_value &&
                    convertToVaruint(
                      transformed.contract_call.call_type.swap.assert_values
                        .min_out_value
                    ),
                },
              },
            }
          : {}),
        ...("open_account" in transformed.contract_call.call_type
          ? {
              open_account: {
                ...transformed.contract_call.call_type.open_account,
                pointer_to_key: convertToVaruint(
                  transformed.contract_call.call_type.open_account
                    .pointer_to_key
                ),
                share_amount: convertToVaruint(
                  transformed.contract_call.call_type.open_account.share_amount
                ),
              },
            }
          : {}),
        ...("close_account" in transformed.contract_call.call_type
          ? {
              close_account: {
                ...transformed.contract_call.call_type.close_account,
                pointer: convertToVaruint(
                  transformed.contract_call.call_type.close_account.pointer
                ),
              },
            }
          : {}),
      },
    };
  }

  console.log(JSON.stringify(transformed))
  return transformed;
}
