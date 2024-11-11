import { AssetContract } from "./asset";
import { GovernanceContract } from "./governance";

export type ContractType = {
  asset?: AssetContract;
  governance?: GovernanceContract
};
