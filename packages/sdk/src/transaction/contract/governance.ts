import { BlockHeight, BlockTxTuple, Pubkey, Ratio } from "../../utils";

type VetoPowers = {
  veto_authorities: Pubkey[];
  required_vetoes: number;
  veto_window: BlockHeight;
};

export type GovernanceSettings = {
  proposal_threshold: string; // U128 treated as string
  quorum_ratio: Ratio;
  approval_ratio: Ratio;
  allow_delegation: boolean;
};

export type ProposalSettings = {
  voting_period: BlockHeight;
  voting_delay?: BlockHeight;
  allow_vote_changes: boolean;
  allow_early_execution: boolean;
};

export type ExecutionSettings = {
  execution_delay: BlockHeight;
  execution_window: BlockHeight;
  executors?: Pubkey[];
  veto_powers?: VetoPowers;
};

export type GovernanceContract = {
  governance_token: BlockTxTuple;
  governance_settings: GovernanceSettings;
  proposal_settings: ProposalSettings;
  execution_settings: ExecutionSettings;
};
