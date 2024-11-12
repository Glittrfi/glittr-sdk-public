import { BlockHeight, BlockTxTuple, Pubkey, U128 } from "../utils";
import { MintOption, OracleMessageSigned } from "./calltype/types";
import {
  FreeMint,
  NFTMint,
  NFTAsset,
  Preallocated,
  PurchaseBurnSwap,
  SimpleAsset,
  VestingPlan,
} from "./contract/asset";
import { TxTypeTransfer } from "./transfer/types";

export type MintContractCallFormat = {
  contract_call: {
    contract: BlockTxTuple;
    call_type: {
      mint: MintOption;
    };
  };
};

export type MintContractCallParams = {
  contract: BlockTxTuple;
  pointer: number;
  oracle_message?: OracleMessageSigned;
};

export type FreeMintContractInstantiateFormat = {
  contract_creation: {
    contract_type: {
      asset: {
        asset: NFTAsset;
        distribution_schemes: {
          nft_mint: NFTMint;
        };
      };
    };
  };
};

export type FreeMintContractParams = {
  simple_asset: SimpleAsset;
  amount_per_mint: U128;
};

export type NFTMintContractParams = {
  nft_asset: NFTAsset;
  amount_per_mint: U128;
  name: String;
  url: String;
  url_hash: String;
};

export type TransferFormat = {
  transfer: {
    transfers: TxTypeTransfer[];
  };
};

export type TransferParams = {
  transfers: TxTypeTransfer[];
};

export type PreallocatedContractFormat = {
  contract_creation: {
    contract_type: {
      asset: {
        asset: SimpleAsset;
        distribution_schemes: {
          preallocated: Preallocated;
          free_mint?: FreeMint;
        };
      };
    };
  };
};

export type PreallocatedContractParams = {
  simple_asset: SimpleAsset;
  preallocated: Preallocated;

  // free mint
  free_mint?: {
    supply_cap?: U128;
    amount_per_mint: U128;
  };
};

export type PurchaseBurnContractFormat = {
  contract_creation: {
    contract_type: {
      asset: {
        asset: SimpleAsset;
        distribution_schemes: {
          purchase: PurchaseBurnSwap
        };
      };
    };
  };
};

export type PurchaseBurnContractParams = {
  simple_asset: SimpleAsset;
  purchase_burn_swap: PurchaseBurnSwap
};
export type TransactionFormat =
  | MintContractCallFormat
  | TransferFormat
  | PreallocatedContractFormat
  | PurchaseBurnContractFormat
  | FreeMintContractInstantiateFormat;
