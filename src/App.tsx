import React, { useEffect, useRef, useState } from 'react';
import { Play, Power, Square } from 'lucide-react';

const FlipChipSimulator = () => {
  const [powerOn, setPowerOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [clockRate, setClockRate] = useState(0.25); // Hz
  const [indicators, setIndicators] = useState(Array(12).fill(false));
  const [slots, setSlots] = useState(Array(8).fill(null));
  const [cardStates, setCardStates] = useState(
    Array.from({ length: 8 }, () => ({ q1: false, q2: false }))
  );
  const [wires, setWires] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [hoveredBit, setHoveredBit] = useState(null);
  const canvasRef = useRef(null);
  const maxModules = 6;

  // Clock at selected rate
  useEffect(() => {
    if (!powerOn || !running) return;

    const interval = setInterval(() => {
      setClockTick((prev) => prev + 1);
    }, 1000 / clockRate); // Convert Hz to milliseconds

    return () => clearInterval(interval);
  }, [powerOn, running, clockRate]);

  // Simulate counter behavior based on actual cards present
  useEffect(() => {
    if (!powerOn) return;

    // Backplane connects clock to slot 2 (slotIndex 1) and chains Q2 -> next CLK1
    const slot2Card = slots[1]; // Slot 2 is at index 1
    
    if (!slot2Card) return; // Slot 2 must have a card to function

    const applyJk = (prev, j, k, clockEdge) => {
      if (!clockEdge) return prev;
      if (j && k) return !prev;
      if (j && !k) return true;
      if (!j && k) return false;
      return prev;
    };

    const clockHigh = clockTick % 2 === 1;
    const clockFallingEdge = clockTick > 0 && !clockHigh;

    setCardStates((prevStates) => {
      const nextStates = [...prevStates];
      let prevQ2Falling = clockFallingEdge;

      for (let moduleIndex = 0; moduleIndex < maxModules; moduleIndex += 1) {
        const slotIndex = moduleIndex + 1;
        const card = slots[slotIndex];
        if (!card) {
          prevQ2Falling = false;
          continue;
        }

        const prev = prevStates[slotIndex] ?? { q1: false, q2: false };
        const jk = card.jk ?? { j1: true, k1: true, j2: true, k2: true };

        const nextQ1 = applyJk(prev.q1, jk.j1, jk.k1, prevQ2Falling);
        const q1Falling = prev.q1 === true && nextQ1 === false;
        const nextQ2 = applyJk(prev.q2, jk.j2, jk.k2, q1Falling);
        const q2Falling = prev.q2 === true && nextQ2 === false;

        nextStates[slotIndex] = { q1: nextQ1, q2: nextQ2 };
        prevQ2Falling = q2Falling;
      }

      const newIndicators = Array(12).fill(false);
      for (let moduleIndex = 0; moduleIndex < maxModules; moduleIndex += 1) {
        const slotIndex = moduleIndex + 1;
        const base = moduleIndex * 2;
        newIndicators[base] = nextStates[slotIndex]?.q1 ?? false;
        newIndicators[base + 1] = nextStates[slotIndex]?.q2 ?? false;
      }
      setIndicators(newIndicators);

      return nextStates;
    });
  }, [clockTick]);

  const handlePowerToggle = () => {
    setPowerOn(!powerOn);
    if (powerOn) {
      setRunning(false);
      setIndicators(Array(12).fill(false));
      setCardStates(Array.from({ length: 8 }, () => ({ q1: false, q2: false })));
      setClockTick(0);
    }
  };

  const handleRunHalt = () => {
    if (powerOn) {
      setRunning(!running);
    }
  };

  const handleStep = () => {
    if (!powerOn) return;
    setClockTick((prev) => prev + 1);
  };

  const handleClockReset = () => {
    setClockTick(0);
    setIndicators(Array(12).fill(false));
    setCardStates(Array.from({ length: 8 }, () => ({ q1: false, q2: false })));
  };

  const addCard = (slotIndex) => {
    const newSlots = [...slots];
    newSlots[slotIndex] = {
      type: 'M113',
      id: Date.now(),
      jk: { j1: true, k1: true, j2: true, k2: true },
    };
    setSlots(newSlots);

    const newStates = [...cardStates];
    newStates[slotIndex] = { q1: false, q2: false };
    setCardStates(newStates);
  };

  const removeCard = (slotIndex) => {
    const newSlots = [...slots];
    newSlots[slotIndex] = null;
    setSlots(newSlots);

    const newStates = [...cardStates];
    newStates[slotIndex] = { q1: false, q2: false };
    setCardStates(newStates);

    // Remove wires connected to this card
    setWires(wires.filter((w) => w.fromSlot !== slotIndex && w.toSlot !== slotIndex));
  };

  const handlePinClick = (slotIndex, pinIndex) => {
    if (!slots[slotIndex]) return;

    if (!selectedPin) {
      setSelectedPin({ slot: slotIndex, pin: pinIndex });
    } else {
      // Create wire
      if (selectedPin.slot !== slotIndex || selectedPin.pin !== pinIndex) {
        setWires([
          ...wires,
          {
            fromSlot: selectedPin.slot,
            fromPin: selectedPin.pin,
            toSlot: slotIndex,
            toPin: pinIndex,
          },
        ]);
      }
      setSelectedPin(null);
    }
  };

  const isChainIntactToSlot = (targetSlotIndex) => {
    for (let i = 1; i < targetSlotIndex; i += 1) {
      if (!slots[i]) return false;
    }
    return true;
  };

  const handleJkToggle = (slotIndex, key) => {
    const newSlots = [...slots];
    if (!newSlots[slotIndex]) return;
    newSlots[slotIndex] = {
      ...newSlots[slotIndex],
      jk: {
        ...((newSlots[slotIndex].jk ?? {
          j1: true,
          k1: true,
          j2: true,
          k2: true,
        }) as {
          j1: boolean;
          k1: boolean;
          j2: boolean;
          k2: boolean;
        }),
        [key]: !(newSlots[slotIndex].jk ?? {
          j1: true,
          k1: true,
          j2: true,
          k2: true,
        })[key],
      },
    };
    setSlots(newSlots);
  };

  // Draw wires on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#9b6a1f';
    ctx.lineWidth = 2;

    wires.forEach((wire) => {
      const fromX = 100;
      const fromY = 80 + wire.fromSlot * 70 + wire.fromPin * 15;
      const toX = 100;
      const toY = 80 + wire.toSlot * 70 + wire.toPin * 15;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    });
  }, [wires]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f2e7d3] text-[#3b3325] font-mono">
      {/* Top Panel */}
      <section className="border-b-4 border-[#8b7a5e] bg-gradient-to-b from-[#ead9b8] via-[#dfcca8] to-[#d2bf9a] p-6 shadow-[0_10px_26px_rgba(60,45,20,0.25)]">
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <div className="border-2 border-[#8b7a5e] bg-gradient-to-b from-[#efe2c7] to-[#e1cea8] p-4 shadow-inner">
            <div className="text-[10px] font-bold tracking-[0.3em] text-[#6e5e45] mb-2 uppercase">
              BODGE INDUSTRIAL LTD
            </div>
            <div
              className="text-2xl font-bold tracking-wider text-[#3b3325]"
              style={{ fontFamily: 'serif', textShadow: '0 1px 0 rgba(255,255,255,0.35)' }}
            >
              Flip Chip Trainer
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 4 }, (_, groupIndex) => {
                const groupStart = indicators.length - 1 - groupIndex * 3;
                const groupBg = groupIndex % 2 === 0 ? 'bg-[#e7d5b2]' : 'bg-[#d8c5a1]';
                return (
                  <div
                    key={groupIndex}
                    className={`flex gap-2 rounded border border-[#9b8766] px-2 py-2 ${groupBg}`}
                  >
                    {Array.from({ length: 3 }, (_, offset) => {
                      const bitIndex = groupStart - offset;
                      const state = indicators[bitIndex];
                      const slotIndex = Math.floor(bitIndex / 2) + 1;
                      const isConnected = slotIndex <= maxModules && slots[slotIndex];
                      return (
                        <div
                          key={bitIndex}
                          className="flex flex-col items-center gap-1"
                          onMouseEnter={() => setHoveredBit(bitIndex)}
                          onMouseLeave={() => setHoveredBit(null)}
                        >
                          <div
                            className={`w-3 h-3 rounded-full border ${
                              powerOn && state
                                ? 'bg-[#b14a2b] border-[#9b3c24] shadow-[0_0_8px_rgba(177,74,43,0.6)]'
                                : 'bg-[#c9b898] border-[#8b7a5e]'
                            } ${!isConnected ? 'opacity-50' : ''}`}
                          />
                          <span className="text-[10px] text-[#6e5e45] font-mono">{bitIndex}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-2 border-[#8b7a5e] bg-gradient-to-b from-[#efe2c7] to-[#e1cea8] p-3 shadow-inner">
            <div className="text-[10px] font-bold tracking-[0.35em] text-[#6e5e45] mb-3 uppercase">
              Power / Run
            </div>
            <div className="flex flex-nowrap gap-2 overflow-x-auto">
              <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2 flex-1 min-w-[120px]">
                <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Mains</div>
                <button
                  onClick={handlePowerToggle}
                  className={`flex items-center justify-center gap-1 px-2 py-2 rounded font-bold text-[10px] tracking-wide shadow-lg w-full ${
                    powerOn
                      ? 'bg-[#a53d22] hover:bg-[#8f341d] border border-[#7a2e1a] text-[#f7efe2]'
                      : 'bg-[#c8b695] hover:bg-[#b9a47f] border border-[#8b7a5e] text-[#3b3325]'
                  }`}
                >
                  <Power size={14} />
                  {powerOn ? 'OFF' : 'ON'}
                </button>
              </div>
              <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2 flex-1 min-w-[120px]">
                <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Clock</div>
                <div className="text-lg font-bold text-[#9b6a1f] font-mono">{clockTick}</div>
                <div className="mt-2 text-[10px] text-[#7a6b52] font-mono">
                  {running ? 'RUNNING' : 'HALTED'}
                </div>
              </div>
              <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2 flex-1 min-w-[180px]">
                <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Power</div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-4 h-4 rounded-full border ${
                        powerOn
                          ? 'bg-[#c7862b] border-[#9b6a1f] shadow-[0_0_8px_rgba(199,134,43,0.6)]'
                          : 'bg-[#c9b898] border-[#8b7a5e]'
                      }`}
                    />
                    <span className="text-[10px] text-[#6e5e45] font-mono">{powerOn ? 'LIVE' : 'OFF'}</span>
                    <span className="rounded border border-[#9b8766] px-1 text-[10px] text-[#7a6b52] font-mono">
                      AC OK
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-3 h-3 rounded-full border ${
                        powerOn
                          ? 'bg-[#c7862b] border-[#9b6a1f] shadow-[0_0_8px_rgba(199,134,43,0.5)]'
                          : 'bg-[#c9b898] border-[#8b7a5e]'
                      }`}
                    />
                    <span className="text-[10px] text-[#6e5e45] font-mono">+10V</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-3 h-3 rounded-full border ${
                        powerOn
                          ? 'bg-[#c7862b] border-[#9b6a1f] shadow-[0_0_8px_rgba(199,134,43,0.5)]'
                          : 'bg-[#c9b898] border-[#8b7a5e]'
                      }`}
                    />
                    <span className="text-[10px] text-[#6e5e45] font-mono">-15V</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={`w-3 h-3 rounded-full border ${
                        powerOn
                          ? 'bg-[#c7862b] border-[#9b6a1f] shadow-[0_0_8px_rgba(199,134,43,0.5)]'
                          : 'bg-[#c9b898] border-[#8b7a5e]'
                      }`}
                    />
                    <span className="text-[10px] text-[#6e5e45] font-mono">GND</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="flex-1 overflow-auto bg-gradient-to-br from-[#efe2c7] to-[#dfcca8] p-6 relative">
        <canvas ref={canvasRef} width={1200} height={800} className="absolute top-0 left-0 pointer-events-none" />

        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-6 xl:grid-cols-8 relative z-10">
          {slots.map((card, slotIndex) => (
            <div
              key={slotIndex}
              className="border-2 border-[#8b7a5e] bg-gradient-to-b from-[#efe2c7] to-[#e1cea8] p-3 shadow-inner min-h-[280px] flex flex-col"
            >
              <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em]">
                Slot {slotIndex + 1}
              </div>
              <div className="mt-2 flex-1 flex flex-col gap-3">
                {slotIndex === 0 ? (
                  <div className="border-2 border-[#9b8766] rounded bg-[#ead9b8] p-3 h-full">
                    <div className="text-[10px] font-bold tracking-[0.35em] text-[#6e5e45] mb-3 uppercase">
                      Clock Card
                    </div>
                    <div className="grid gap-2">
                      <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2">
                        <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Rate</div>
                        <div className="flex items-start gap-3">
                          {[
                            { value: 0.25, label: '1/4 Hz' },
                            { value: 2, label: '2 Hz' },
                            { value: 10, label: '10 Hz' },
                          ].map((rate) => (
                            <label
                              key={rate.value}
                              className="flex flex-col items-center gap-1 cursor-pointer text-[#6e5e45] hover:text-[#3b3325]"
                            >
                              <input
                                type="radio"
                                name="clockRate"
                                value={rate.value}
                                checked={clockRate === rate.value}
                                onChange={(e) => setClockRate(parseFloat(e.target.value))}
                                className="h-3 w-3 cursor-pointer appearance-none rounded-full border border-[#8b7a5e] bg-[#f2e7d3] shadow-inner checked:border-[#7a5c2d] checked:bg-[#9b6a1f]"
                              />
                              <span className="text-[10px] font-mono">{rate.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2">
                        <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Mode</div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-[#6e5e45] font-mono">Auto</span>
                          <div
                            className={`w-3 h-3 rounded-full border ${
                              running
                                ? 'bg-[#5e8a4c] border-[#4c733d] shadow-[0_0_8px_rgba(94,138,76,0.55)]'
                                : 'bg-[#c9b898] border-[#8b7a5e]'
                            }`}
                          />
                        </div>
                        <div className="mt-2 text-[10px] text-[#7a6b52] font-mono">
                          {running ? 'RUNNING' : 'HALTED'}
                        </div>
                      </div>
                      <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2">
                        <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Run / Step</div>
                        <button
                          onClick={handleRunHalt}
                          disabled={!powerOn}
                          className={`flex items-center justify-center gap-1 px-2 py-2 rounded font-bold text-[10px] tracking-wide shadow-lg w-full ${
                            !powerOn
                              ? 'bg-[#c8b695] border border-[#8b7a5e] cursor-not-allowed opacity-60 text-[#3b3325]'
                              : running
                                ? 'bg-[#d08a2b] hover:bg-[#b67524] border border-[#8f5f1e] text-[#3b3325]'
                                : 'bg-[#c8b695] hover:bg-[#b9a47f] border border-[#8b7a5e] text-[#3b3325]'
                          }`}
                        >
                          {running ? <Square size={14} /> : <Play size={14} />}
                          {running ? 'HALT' : 'RUN'}
                        </button>
                        <button
                          onClick={handleStep}
                          disabled={!powerOn || running}
                          className={`mt-2 w-full rounded border px-2 py-2 text-[10px] font-bold tracking-wide ${
                            !powerOn || running
                              ? 'bg-[#c8b695] border-[#8b7a5e] cursor-not-allowed opacity-60 text-[#3b3325]'
                              : 'bg-[#e6d5b5] border-[#8b7a5e] hover:bg-[#d8c5a1] text-[#3b3325]'
                          }`}
                        >
                          STEP
                        </button>
                      </div>
                      <div className="border border-[#9b8766] rounded bg-[#ead9b8] p-2">
                        <div className="text-[10px] text-[#6e5e45] uppercase tracking-[0.2em] mb-2">Reset</div>
                        <button
                          onClick={handleClockReset}
                          className="w-full rounded border border-[#8b7a5e] bg-[#c8b695] px-2 py-2 text-[10px] font-bold tracking-wide text-[#3b3325] hover:bg-[#b9a47f]"
                        >
                          CLEAR TICKS
                        </button>
                      </div>
                    </div>
                  </div>
                ) : card ? (
                  <div
                    className={`bg-gradient-to-b from-[#cbb790] to-[#bba278] border-2 rounded p-3 transition-all shadow-lg h-full ${
                      hoveredBit !== null && Math.floor(hoveredBit / 2) + 1 === slotIndex
                        ? 'border-[#c7862b] shadow-[0_0_14px_rgba(199,134,43,0.5)]'
                        : 'border-[#8b7a5e]'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-[#3b3325] text-xs tracking-wide">{card.type}</div>
                        <div className="text-[10px] text-[#6e5e45]">Dual J-K Flip-Flop</div>
                        {hoveredBit !== null && Math.floor(hoveredBit / 2) + 1 === slotIndex && (
                          <div className="text-[10px] text-[#9b6a1f] mt-1 font-mono">
                            ← Bit {hoveredBit} ({hoveredBit % 2 === 0 ? 'FF1' : 'FF2'})
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeCard(slotIndex)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-[#7a2e1a] bg-[#a53d22] text-xs font-bold text-[#f7efe2] shadow-sm hover:bg-[#8f341d]"
                        aria-label="Remove card"
                      >
                        X
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="grid gap-2">
                        <div className="grid gap-2">
                          {(['j1', 'k1'] as const).map((key) => {
                            const jk = card.jk ?? {
                              j1: true,
                              k1: true,
                              j2: true,
                              k2: true,
                            };
                            return (
                              <button
                                key={key}
                                onClick={() => handleJkToggle(slotIndex, key)}
                                className={`w-full text-[10px] px-2 py-1 rounded border font-mono ${
                                  jk[key]
                                    ? 'bg-[#c7862b] border-[#9b6a1f] text-[#3b3325] font-bold'
                                    : 'bg-[#f2e7d3] border-[#8b7a5e] text-[#6e5e45]'
                                }`}
                              >
                                {key.toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                        {['CLK1', 'Q1'].map((pin, pinIndex) => {
                          const mainClockHigh = powerOn && clockTick % 2 === 1;
                          const chainIntact = isChainIntactToSlot(slotIndex);
                          const clk1High =
                            slotIndex === 1
                              ? mainClockHigh
                              : slotIndex <= maxModules && chainIntact
                                ? (cardStates[slotIndex - 1]?.q2 ?? false)
                                : false;
                          return (
                            <button
                            key={pin}
                            onClick={pin === 'Q1' ? undefined : () => handlePinClick(slotIndex, pinIndex + 2)}
                            disabled={pin === 'Q1'}
                            className={`text-[10px] px-2 py-1 rounded border font-mono ${
                              selectedPin?.slot === slotIndex && selectedPin?.pin === pinIndex + 2
                                ? 'bg-[#c7862b] border-[#9b6a1f] text-[#3b3325] font-bold'
                                : pin === 'Q1' && (cardStates[slotIndex]?.q1 ?? false)
                                  ? 'bg-[#b14a2b] border-[#9b3c24] text-[#f7efe2] shadow-[0_0_8px_rgba(177,74,43,0.6)]'
                                  : pin === 'CLK1' && clk1High
                                    ? 'bg-[#c7862b] border-[#9b6a1f] text-[#3b3325] shadow-[0_0_8px_rgba(199,134,43,0.6)]'
                                    : pin === 'Q1'
                                      ? 'bg-[#f2e7d3] border-[#8b7a5e] text-[#3b3325]'
                                      : 'bg-[#f2e7d3] border-[#8b7a5e] hover:bg-[#e6d5b5] text-[#3b3325]'
                            }`}
                          >
                            {pin}
                          </button>
                          );
                        })}
                      </div>
                      <div className="grid gap-2">
                        <div className="grid gap-2">
                          {(['j2', 'k2'] as const).map((key) => {
                            const jk = card.jk ?? {
                              j1: true,
                              k1: true,
                              j2: true,
                              k2: true,
                            };
                            return (
                              <button
                                key={key}
                                onClick={() => handleJkToggle(slotIndex, key)}
                                className={`w-full text-[10px] px-2 py-1 rounded border font-mono ${
                                  jk[key]
                                    ? 'bg-[#c7862b] border-[#9b6a1f] text-[#3b3325] font-bold'
                                    : 'bg-[#f2e7d3] border-[#8b7a5e] text-[#6e5e45]'
                                }`}
                              >
                                {key.toUpperCase()}
                              </button>
                            );
                          })}
                        </div>
                        {['CLK2', 'Q2'].map((pin, columnIndex) => {
                          const pinIndex = columnIndex + 6;
                          const clk2High =
                            slotIndex <= maxModules ? (cardStates[slotIndex]?.q1 ?? false) : false;
                          return (
                            <button
                              key={pin}
                              onClick={pin === 'Q2' ? undefined : () => handlePinClick(slotIndex, pinIndex)}
                              disabled={pin === 'Q2'}
                              className={`text-[10px] px-2 py-1 rounded border font-mono ${
                                selectedPin?.slot === slotIndex && selectedPin?.pin === pinIndex
                                  ? 'bg-[#c7862b] border-[#9b6a1f] text-[#3b3325] font-bold'
                                  : pin === 'Q2' && (cardStates[slotIndex]?.q2 ?? false)
                                    ? 'bg-[#b14a2b] border-[#9b3c24] text-[#f7efe2] shadow-[0_0_8px_rgba(177,74,43,0.6)]'
                                    : pin === 'CLK2' && clk2High
                                      ? 'bg-[#c7862b] border-[#9b6a1f] text-[#3b3325] shadow-[0_0_8px_rgba(199,134,43,0.6)]'
                                      : pin === 'Q2'
                                        ? 'bg-[#f2e7d3] border-[#8b7a5e] text-[#3b3325]'
                                        : 'bg-[#f2e7d3] border-[#8b7a5e] hover:bg-[#e6d5b5] text-[#3b3325]'
                              }`}
                            >
                              {pin}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-3 border border-[#9b8766] rounded bg-[#ead9b8] px-2 py-2">
                      <div className="text-[9px] uppercase tracking-[0.2em] text-[#6e5e45] mb-1">
                        Internal Wiring
                      </div>
                      <svg
                        viewBox="0 0 200 100"
                        className="w-full h-24"
                        aria-label="Clock into flip-flops, outputs to lamps"
                      >
                        <defs>
                          <marker
                            id="arrowHead"
                            markerWidth="6"
                            markerHeight="6"
                            refX="5"
                            refY="3"
                            orient="auto"
                          >
                            <path d="M0,0 L6,3 L0,6 Z" fill="#3b3325" />
                          </marker>
                        </defs>
                        <rect x="6" y="34" width="36" height="26" rx="3" fill="#f2e7d3" stroke="#8b7a5e" />
                        <text x="24" y="51" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
                          CLK
                        </text>

                        <rect x="64" y="12" width="40" height="30" rx="3" fill="#e1cea8" stroke="#8b7a5e" />
                        <text x="84" y="31" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
                          FF1
                        </text>
                        <rect x="64" y="58" width="40" height="30" rx="3" fill="#e1cea8" stroke="#8b7a5e" />
                        <text x="84" y="77" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
                          FF2
                        </text>

                        <rect x="140" y="12" width="36" height="24" rx="3" fill="#f2e7d3" stroke="#8b7a5e" />
                        <text x="158" y="28" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
                          L0
                        </text>
                        <rect x="140" y="64" width="36" height="24" rx="3" fill="#f2e7d3" stroke="#8b7a5e" />
                        <text x="158" y="80" textAnchor="middle" fontSize="10" fill="#3b3325" fontFamily="monospace">
                          L1
                        </text>

                        <line x1="42" y1="47" x2="64" y2="26" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
                        <line x1="104" y1="26" x2="140" y2="24" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
                        <line x1="104" y1="26" x2="64" y2="74" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
                        <line x1="104" y1="74" x2="140" y2="76" stroke="#3b3325" strokeWidth="2" markerEnd="url(#arrowHead)" />
                      </svg>
                    </div>

                    <div className="mt-3 border border-[#9b8766] rounded bg-[#ead9b8] px-2 py-2">
                      <div className="text-[9px] uppercase tracking-[0.2em] text-[#6e5e45] mb-1">
                        State Sequence
                      </div>
                      <svg viewBox="0 0 200 60" className="w-full h-14" aria-label="Q2 Q1 sequence">
                        <defs>
                          <marker
                            id="seqArrow"
                            markerWidth="6"
                            markerHeight="6"
                            refX="5"
                            refY="3"
                            orient="auto"
                          >
                            <path d="M0,0 L6,3 L0,6 Z" fill="#3b3325" />
                          </marker>
                        </defs>
                        {[
                          { label: '00', x: 10 },
                          { label: '01', x: 60 },
                          { label: '10', x: 110 },
                          { label: '11', x: 160 },
                        ].map((node) => (
                          <g key={node.label}>
                            <rect x={node.x} y="18" width="30" height="24" rx="3" fill="#f2e7d3" stroke="#8b7a5e" />
                            <text
                              x={node.x + 15}
                              y="34"
                              textAnchor="middle"
                              fontSize="10"
                              fill="#3b3325"
                              fontFamily="monospace"
                            >
                              {node.label}
                            </text>
                          </g>
                        ))}
                        <line x1="40" y1="30" x2="60" y2="30" stroke="#3b3325" strokeWidth="1.5" markerEnd="url(#seqArrow)" />
                        <line x1="90" y1="30" x2="110" y2="30" stroke="#3b3325" strokeWidth="1.5" markerEnd="url(#seqArrow)" />
                        <line x1="140" y1="30" x2="160" y2="30" stroke="#3b3325" strokeWidth="1.5" markerEnd="url(#seqArrow)" />
                        <line x1="190" y1="48" x2="10" y2="48" stroke="#3b3325" strokeWidth="1.5" markerEnd="url(#seqArrow)" />
                      </svg>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => addCard(slotIndex)}
                    className="border-2 border-dashed border-[#9b8766] rounded p-3 h-full hover:border-[#8b7a5e] hover:bg-[#e6d5b5] text-[#7a6b52] hover:text-[#3b3325] text-xs"
                  >
                    + Add M113 Card
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-[#e6d5b5] rounded border border-[#8b7a5e] max-w-2xl">
          <div className="font-bold mb-2 text-[#6e5e45] text-sm tracking-wide">INSTRUCTIONS</div>
          <div className="text-xs text-[#7a6b52] space-y-1 font-mono">
            <div>• Click "+ Add M113 Card" in Slots 2–7 to insert flip-flop modules</div>
            <div>• The backplane automatically chains clocks across installed modules</div>
            <div>• Turn POWER ON, then RUN to start the counter</div>
            <div>• Select clock rate: 1/4 Hz (slow), 2 Hz (medium), or 10 Hz (fast)</div>
            <div>• One slot remains unused</div>
          </div>
          <div className="mt-3 border-t border-[#9b8766] pt-3">
            <div className="font-bold mb-2 text-[#6e5e45] text-sm tracking-wide">
              BACKPLANE ROUTING
            </div>
            <div className="text-xs text-[#7a6b52] space-y-1 font-mono">
              <div>• CLK → S2:CLK1</div>
              <div>• Each module: Q1 → CLK2 (same slot)</div>
              <div>• Chain: Q2 → next slot CLK1 (S2→S3→S4→S5→S6→S7)</div>
              <div>• Rails: GND, +10 V, -15 V to each slot (assumed)</div>
            </div>
          </div>
        </div>

        <footer className="mt-6 text-xs text-[#7a6b52] font-mono">
          Repo:{" "}
          <a
            className="underline hover:text-[#3b3325]"
            href="https://github.com/rsbohn/flip-chip-trainer"
            rel="noreferrer"
            target="_blank"
          >
            https://github.com/rsbohn/flip-chip-trainer
          </a>
        </footer>
      </section>
    </div>
  );
};

export default FlipChipSimulator;
