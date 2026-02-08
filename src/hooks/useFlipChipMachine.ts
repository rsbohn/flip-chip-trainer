import { useEffect, useReducer } from 'react';
import {
  createCard,
  createEmptyCardStates,
  createIndicators,
  getIndicatorCount,
  getInitialCardState,
  getJkConfig,
  stepMachine,
} from '../sim/flipChip';
import type { CardState, Slot } from '../types';

type FlipChipMachineState = {
  powerOn: boolean;
  running: boolean;
  clockTick: number;
  clockRate: number;
  indicators: boolean[];
  slots: Slot[];
  cardStates: CardState[];
};

type FlipChipMachineActions = {
  togglePower: () => void;
  toggleRun: () => void;
  step: () => void;
  reset: () => void;
  setClockRate: (rate: number) => void;
  addCard: (slotIndex: number, type?: string) => void;
  removeCard: (slotIndex: number) => void;
  toggleJk: (slotIndex: number, key: keyof ReturnType<typeof getJkConfig>) => void;
};

type UseFlipChipMachineArgs = {
  maxModules: number;
  slotCount: number;
  defaultClockRate?: number;
};

const createInitialIndicators = (maxModules: number) =>
  createIndicators(getIndicatorCount(maxModules));

type Action =
  | { type: 'TOGGLE_POWER'; maxModules: number; slotCount: number }
  | { type: 'TOGGLE_RUN' }
  | { type: 'TICK'; maxModules: number }
  | { type: 'RESET'; maxModules: number; slotCount: number }
  | { type: 'SET_CLOCK_RATE'; rate: number }
  | { type: 'ADD_CARD'; slotIndex: number; cardType: string }
  | { type: 'REMOVE_CARD'; slotIndex: number }
  | { type: 'TOGGLE_JK'; slotIndex: number; key: keyof ReturnType<typeof getJkConfig> };

const initializeState = ({
  maxModules,
  slotCount,
  defaultClockRate,
}: {
  maxModules: number;
  slotCount: number;
  defaultClockRate: number;
}): FlipChipMachineState => ({
  powerOn: false,
  running: false,
  clockTick: 0,
  clockRate: defaultClockRate,
  indicators: createInitialIndicators(maxModules),
  slots: Array(slotCount).fill(null),
  cardStates: createEmptyCardStates(slotCount),
});

const stepIfReady = (
  state: FlipChipMachineState,
  maxModules: number,
  nextClockTick: number
) => {
  const slot2Card = state.slots[1];
  if (!state.powerOn || !slot2Card) {
    return { cardStates: state.cardStates, indicators: state.indicators };
  }
  return stepMachine({
    prevStates: state.cardStates,
    slots: state.slots,
    maxModules,
    clockTick: nextClockTick,
  });
};

const reducer = (state: FlipChipMachineState, action: Action): FlipChipMachineState => {
  switch (action.type) {
    case 'TOGGLE_POWER': {
      const nextPower = !state.powerOn;
      if (!nextPower) {
        return {
          ...state,
          powerOn: false,
          running: false,
          clockTick: 0,
          indicators: createInitialIndicators(action.maxModules),
          cardStates: createEmptyCardStates(action.slotCount),
        };
      }
      return { ...state, powerOn: true };
    }
    case 'TOGGLE_RUN':
      if (!state.powerOn) return state;
      return { ...state, running: !state.running };
    case 'TICK': {
      const nextClockTick = state.clockTick + 1;
      const { cardStates, indicators } = stepIfReady(state, action.maxModules, nextClockTick);
      return { ...state, clockTick: nextClockTick, cardStates, indicators };
    }
    case 'RESET':
      return {
        ...state,
        clockTick: 0,
        indicators: createInitialIndicators(action.maxModules),
        cardStates: createEmptyCardStates(action.slotCount),
      };
    case 'SET_CLOCK_RATE':
      return { ...state, clockRate: action.rate };
    case 'ADD_CARD': {
      const newSlots = [...state.slots];
      newSlots[action.slotIndex] = createCard(action.cardType, Date.now());
      const newStates = [...state.cardStates];
      newStates[action.slotIndex] = getInitialCardState(newSlots[action.slotIndex]);
      return { ...state, slots: newSlots, cardStates: newStates };
    }
    case 'REMOVE_CARD': {
      const newSlots = [...state.slots];
      newSlots[action.slotIndex] = null;
      const newStates = [...state.cardStates];
      newStates[action.slotIndex] = getInitialCardState(null);
      return { ...state, slots: newSlots, cardStates: newStates };
    }
    case 'TOGGLE_JK': {
      const newSlots = [...state.slots];
      if (!newSlots[action.slotIndex]) return state;
      const currentJk = getJkConfig(newSlots[action.slotIndex]);
      newSlots[action.slotIndex] = {
        ...newSlots[action.slotIndex],
        jk: {
          ...currentJk,
          [action.key]: !currentJk[action.key],
        },
      };
      return { ...state, slots: newSlots };
    }
    default:
      return state;
  }
};

export const useFlipChipMachine = ({
  maxModules,
  slotCount,
  defaultClockRate = 0.25,
}: UseFlipChipMachineArgs): {
  state: FlipChipMachineState;
  actions: FlipChipMachineActions;
} => {
  const [state, dispatch] = useReducer(
    reducer,
    { maxModules, slotCount, defaultClockRate },
    initializeState
  );

  useEffect(() => {
    if (!state.powerOn || !state.running) return undefined;

    const interval = setInterval(() => {
      dispatch({ type: 'TICK', maxModules });
    }, 1000 / state.clockRate);

    return () => clearInterval(interval);
  }, [maxModules, state.clockRate, state.powerOn, state.running]);

  const togglePower = () => {
    dispatch({ type: 'TOGGLE_POWER', maxModules, slotCount });
  };

  const toggleRun = () => {
    dispatch({ type: 'TOGGLE_RUN' });
  };

  const step = () => {
    if (!state.powerOn) return;
    dispatch({ type: 'TICK', maxModules });
  };

  const reset = () => {
    dispatch({ type: 'RESET', maxModules, slotCount });
  };

  const addCard = (slotIndex: number, type = 'M113') => {
    dispatch({ type: 'ADD_CARD', slotIndex, cardType: type });
  };

  const removeCard = (slotIndex: number) => {
    dispatch({ type: 'REMOVE_CARD', slotIndex });
  };

  const toggleJk = (slotIndex: number, key: keyof ReturnType<typeof getJkConfig>) => {
    dispatch({ type: 'TOGGLE_JK', slotIndex, key });
  };

  return {
    state,
    actions: {
      togglePower,
      toggleRun,
      step,
      reset,
      setClockRate: (rate: number) => dispatch({ type: 'SET_CLOCK_RATE', rate }),
      addCard,
      removeCard,
      toggleJk,
    },
  };
};
