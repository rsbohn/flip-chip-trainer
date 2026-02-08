import type { Card, CardState, JkConfig, Slot } from '../types';

type IndicatorPair = {
  q1: boolean;
  q2: boolean;
  q3?: boolean;
};

type StepArgs = {
  prevState: CardState;
  card: Card;
  clockFallingEdge: boolean;
  prevQ2Falling: boolean;
};

type StepResult = {
  nextState: CardState;
  q2Falling: boolean;
  indicators: IndicatorPair;
};

type CardBehavior = {
  type: string;
  initState: () => CardState;
  indicatorCount: number;
  step: (args: StepArgs) => StepResult;
};

const DEFAULT_JK_CONFIG: JkConfig = {
  j1: true,
  k1: true,
  j2: true,
  k2: true,
  j3: true,
  k3: true,
};

const applyJk = (prev: boolean, j: boolean, k: boolean, clockEdge: boolean) => {
  if (!clockEdge) return prev;
  if (j && k) return !prev;
  if (j && !k) return true;
  if (!j && k) return false;
  return prev;
};

const m113Behavior: CardBehavior = {
  type: 'M113',
  initState: () => ({ q1: false, q2: false, q3: false }),
  indicatorCount: 2,
  step: ({ prevState, card, prevQ2Falling }) => {
    const jk = getJkConfig(card);
    const nextQ1 = applyJk(prevState.q1, jk.j1, jk.k1, prevQ2Falling);
    const q1Falling = prevState.q1 === true && nextQ1 === false;
    const nextQ2 = applyJk(prevState.q2, jk.j2, jk.k2, q1Falling);
    const q2Falling = prevState.q2 === true && nextQ2 === false;
    return {
      nextState: { q1: nextQ1, q2: nextQ2, q3: false },
      q2Falling,
      indicators: { q1: nextQ1, q2: nextQ2 },
    };
  },
};

const m202Behavior: CardBehavior = {
  type: 'M202',
  initState: () => ({ q1: false, q2: false, q3: false }),
  indicatorCount: 3,
  step: ({ prevState, card, prevQ2Falling }) => {
    const jk = getJkConfig(card);
    const nextQ1 = applyJk(prevState.q1, jk.j1, jk.k1, prevQ2Falling);
    const q1Falling = prevState.q1 === true && nextQ1 === false;
    const nextQ2 = applyJk(prevState.q2, jk.j2, jk.k2, q1Falling);
    const q2Falling = prevState.q2 === true && nextQ2 === false;
    const nextQ3 = applyJk(prevState.q3, jk.j3, jk.k3, q2Falling);
    const q3Falling = prevState.q3 === true && nextQ3 === false;
    return {
      nextState: { q1: nextQ1, q2: nextQ2, q3: nextQ3 },
      q2Falling: q3Falling,
      indicators: { q1: nextQ1, q2: nextQ2, q3: nextQ3 },
    };
  },
};

const CARD_BEHAVIORS: Record<string, CardBehavior> = {
  M113: m113Behavior,
  M202: m202Behavior,
};

export const MAX_INDICATORS_PER_MODULE = 3;

export const getIndicatorCount = (maxModules: number) =>
  maxModules * MAX_INDICATORS_PER_MODULE;

export const createIndicators = (count: number) => Array(count).fill(false);

export const createEmptyCardStates = (slotCount: number) =>
  Array.from({ length: slotCount }, () => ({ q1: false, q2: false, q3: false }));

export const getJkConfig = (card: Card | null): JkConfig => {
  if (card?.jk) return { ...DEFAULT_JK_CONFIG, ...card.jk };
  return { ...DEFAULT_JK_CONFIG };
};

export const createCard = (type: Card['type'], id: number): Card => {
  if (type === 'M113') {
    return { type, id, jk: { ...DEFAULT_JK_CONFIG } };
  }
  return { type, id };
};

const getBehavior = (card: Card): CardBehavior | null => {
  return CARD_BEHAVIORS[card.type] ?? null;
};

export const getInitialCardState = (card: Card | null): CardState => {
  if (!card) return { q1: false, q2: false, q3: false };
  const behavior = getBehavior(card);
  return behavior ? behavior.initState() : { q1: false, q2: false, q3: false };
};

export const stepMachine = ({
  prevStates,
  slots,
  maxModules,
  clockTick,
}: {
  prevStates: CardState[];
  slots: Slot[];
  maxModules: number;
  clockTick: number;
}) => {
  const clockHigh = clockTick % 2 === 1;
  const clockFallingEdge = clockTick > 0 && !clockHigh;

  const nextStates = [...prevStates];
  const indicators = createIndicators(getIndicatorCount(maxModules));
  let prevQ2Falling = clockFallingEdge;

  for (let moduleIndex = 0; moduleIndex < maxModules; moduleIndex += 1) {
    const slotIndex = moduleIndex + 1;
    const card = slots[slotIndex];
    if (!card) {
      prevQ2Falling = false;
      continue;
    }

    const behavior = getBehavior(card);
    if (!behavior) {
      prevQ2Falling = false;
      continue;
    }

    const prevState = prevStates[slotIndex] ?? behavior.initState();
    const result = behavior.step({
      prevState,
      card,
      clockFallingEdge,
      prevQ2Falling,
    });

    nextStates[slotIndex] = result.nextState;
    prevQ2Falling = result.q2Falling;

    const base = moduleIndex * MAX_INDICATORS_PER_MODULE;
    indicators[base] = result.indicators.q1;
    indicators[base + 1] = result.indicators.q2;
    if (result.indicators.q3 !== undefined) {
      indicators[base + 2] = result.indicators.q3;
    }
  }

  return { cardStates: nextStates, indicators };
};
