export type CardType = 'M113' | 'M202';

export type JkConfig = {
  j1: boolean;
  k1: boolean;
  j2: boolean;
  k2: boolean;
  j3: boolean;
  k3: boolean;
};

export type CardState = {
  q1: boolean;
  q2: boolean;
  q3: boolean;
};

export type Card = {
  type: CardType | string;
  id: number;
  jk?: JkConfig;
};

export type Slot = Card | null;

export type Wire = {
  fromSlot: number;
  fromPin: number;
  toSlot: number;
  toPin: number;
};

export type SelectedPin = {
  slot: number;
  pin: number;
};
