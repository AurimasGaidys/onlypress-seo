import { PhaseHandler } from '../conversationMachine';

export const handleCompletedPhase: PhaseHandler = async () => {
  return {
    nextPhase: 'COMPLETED',
    response: {
      type: 'message',
      response: 'Šis dokumentas jau pažymėtas kaip baigtas. Pasakykite, jei norėtumėte atlikti papildomų pakeitimų.',
    },
  };
};
