import { BitcoinAddress, BlockTxTuple } from "../../utils";
import {
  ExecutionSettings,
  GovernanceSettings,
  ProposalSettings,
} from "../contract/governance";

type VoteType = {
  simple: { options: string[] };
  ranked: { options: string[]; max_ranks: number };
  weighted: { options: string[]; max_weight_per_option: string };
};

type ProposalAction = {
  transfer: { recipient: BitcoinAddress; amount: string; asset: BlockTxTuple };
  update_governance_settings: GovernanceSettings;
  update_proposal_settings: ProposalSettings;
  update_execution_settings: ExecutionSettings;
  custom: {}; // TODO
};

export type ProposalCreation = {
  title: string;
  description: string;
  vote_type: VoteType;
  actions: ProposalAction[];
};

type VoteCast = {
  simple: { choice: number };
  ranked: { rankings: number[] };
  weighted: { weights: string[] };
};

export type Vote = {
  proposal_id: BlockTxTuple;
  vote_cast: VoteCast;
};
