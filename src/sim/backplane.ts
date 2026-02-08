import type { CardState, Slot } from '../types';

export const isChainIntactToSlot = (slots: Slot[], targetSlotIndex: number) => {
  for (let i = 1; i < targetSlotIndex; i += 1) {
    if (!slots[i]) return false;
  }
  return true;
};

export const getChainOutputHigh = (
  slots: Slot[],
  cardStates: CardState[],
  slotIndex: number
) => {
  const prevCard = slots[slotIndex - 1];
  if (!prevCard) return false;
  if (prevCard.type === 'M202') {
    return cardStates[slotIndex - 1]?.q3 ?? false;
  }
  return cardStates[slotIndex - 1]?.q2 ?? false;
};

export const getClk1High = ({
  slotIndex,
  mainClockHigh,
  slots,
  cardStates,
  maxModules,
}: {
  slotIndex: number;
  mainClockHigh: boolean;
  slots: Slot[];
  cardStates: CardState[];
  maxModules: number;
}) => {
  if (slotIndex === 1) return mainClockHigh;
  if (slotIndex > maxModules) return false;
  const chainIntact = isChainIntactToSlot(slots, slotIndex);
  if (!chainIntact) return false;
  return getChainOutputHigh(slots, cardStates, slotIndex);
};
