import { useState } from 'react';
import type { SelectedPin, Slot, Wire } from '../types';

export const useWireEditor = (slots: Slot[]) => {
  const [wires, setWires] = useState<Wire[]>([]);
  const [selectedPin, setSelectedPin] = useState<SelectedPin | null>(null);
  const [hoveredBit, setHoveredBit] = useState<number | null>(null);

  const handlePinClick = (slotIndex: number, pinIndex: number) => {
    if (!slots[slotIndex]) return;

    if (!selectedPin) {
      setSelectedPin({ slot: slotIndex, pin: pinIndex });
      return;
    }

    if (selectedPin.slot !== slotIndex || selectedPin.pin !== pinIndex) {
      setWires((prev) => [
        ...prev,
        {
          fromSlot: selectedPin.slot,
          fromPin: selectedPin.pin,
          toSlot: slotIndex,
          toPin: pinIndex,
        },
      ]);
    }
    setSelectedPin(null);
  };

  const clearSelectedPin = () => setSelectedPin(null);

  const removeWiresForSlot = (slotIndex: number) => {
    setWires((prev) => prev.filter((w) => w.fromSlot !== slotIndex && w.toSlot !== slotIndex));
  };

  return {
    wires,
    selectedPin,
    hoveredBit,
    setHoveredBit,
    handlePinClick,
    clearSelectedPin,
    removeWiresForSlot,
  };
};
