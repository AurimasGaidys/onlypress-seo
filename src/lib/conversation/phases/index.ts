import { ConversationPhase } from '@/types/conversation';
import { PhaseHandler } from '../conversationMachine';
import { handleGreetingPhase } from './greeting';
import { handleArticleTypeSelectionPhase } from './articleTypeSelection';
import { handleInformationGatheringPhase } from './informationGathering';
import { handleDataAuditPhase } from './dataAudit';
import { handleAngleProposalPhase } from './angleProposal';
import { handleStructureProposalPhase } from './structureProposal';
import { handleInteractiveRefinementPhase } from './interactiveRefinement';
import { handlePostDraftToolsPhase } from './postDraftTools';
import { handleCompletedPhase } from './completed';

export const phaseHandlers: Partial<Record<ConversationPhase, PhaseHandler>> = {
  GREETING: handleGreetingPhase,
  ARTICLE_TYPE_SELECTION: handleArticleTypeSelectionPhase,
  INFORMATION_GATHERING: handleInformationGatheringPhase,
  DATA_AUDIT: handleDataAuditPhase,
  ANGLE_PROPOSAL: handleAngleProposalPhase,
  STRUCTURE_PROPOSAL: handleStructureProposalPhase,
  DRAFT_GENERATION: handleStructureProposalPhase,
  INTERACTIVE_REFINEMENT: handleInteractiveRefinementPhase,
  POST_DRAFT_TOOLS: handlePostDraftToolsPhase,
  COMPLETED: handleCompletedPhase,
};
