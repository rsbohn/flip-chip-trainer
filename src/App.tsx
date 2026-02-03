import React, { useEffect, useRef, useState } from 'react';
import { Play, Power, Square } from 'lucide-react';

const FlipChipSimulator = () => {
  const [powerOn, setPowerOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [clockRate, setClockRate] = useState(0.25); // Hz
  const [indicators, setIndicators] = useState(Array(12).fill(false));
  const [slots, setSlots] = useState(Array(12).fill(null));
  const [wires, setWires] = useState([]);
  const [selectedPin, setSelectedPin] = useState(null);
  const [hoveredBit, setHoveredBit] = useState(null);
  const canvasRef = useRef(null);

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
    if (!powerOn || !running) return;

    // Count how many M113 cards are installed
    const installedCards = slots.slice(1).filter((slot) => slot !== null).length;
    const bitCount = installedCards * 2; // 2 flip-flops per M113

    if (bitCount === 0) return; // No cards, no counting

    // Simple ripple counter simulation limited to available bits
    const newIndicators = [...indicators];
    let carry = true;

    for (let i = 0; i < bitCount && i < 12; i += 1) {
      if (carry) {
        newIndicators[i] = !newIndicators[i];
        carry = newIndicators[i] === false; // Carry if we wrapped to 0
      } else {
        break;
      }
    }

    setIndicators(newIndicators);
  }, [clockTick]);

  const handlePowerToggle = () => {
    setPowerOn(!powerOn);
    if (powerOn) {
      setRunning(false);
      setIndicators(Array(12).fill(false));
      setClockTick(0);
    }
  };

  const handleRunHalt = () => {
    if (powerOn) {
      setRunning(!running);
    }
  };

  const handleClockReset = () => {
    setClockTick(0);
    setIndicators(Array(12).fill(false));
  };

  const addCard = (slotIndex) => {
    const newSlots = [...slots];
    newSlots[slotIndex] = { type: 'M113', id: Date.now() };
    setSlots(newSlots);
  };

  const removeCard = (slotIndex) => {
    const newSlots = [...slots];
    newSlots[slotIndex] = null;
    setSlots(newSlots);

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

  // Draw wires on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#d97706';
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
    <div className="flex flex-col min-h-screen bg-black text-gray-100 font-mono">
      {/* Top Panel */}
      <section className="border-b-4 border-black bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 p-6 shadow-2xl">
        <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
          <div className="border-2 border-black bg-gradient-to-b from-gray-900 to-gray-950 p-4 shadow-inner">
            <div className="text-[10px] font-bold tracking-[0.3em] text-gray-400 mb-2 uppercase">
              DIGITAL EQUIPMENT CORPORATION
            </div>
            <div
              className="text-2xl font-bold tracking-wider text-gray-300"
              style={{ fontFamily: 'serif', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              Flip Chip Trainer
            </div>
            <div className="text-[10px] font-bold tracking-[0.35em] text-gray-500 mt-2 uppercase">
              Eurorack layout wireframe
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {indicators.map((state, i) => {
                const installedCards = slots.slice(1).filter((slot) => slot !== null).length;
                const bitCount = installedCards * 2;
                const isConnected = i < bitCount;
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1 border border-gray-800 bg-black/70 px-2 py-2"
                    onMouseEnter={() => setHoveredBit(i)}
                    onMouseLeave={() => setHoveredBit(null)}
                  >
                    <div
                      className={`w-3 h-3 rounded-full border ${
                        powerOn && state
                          ? 'bg-red-700 border-red-600 shadow-lg shadow-red-700/80'
                          : 'bg-gray-900 border-gray-700'
                      } ${!isConnected ? 'opacity-50' : ''}`}
                    />
                    <span className="text-[10px] text-gray-600 font-mono">{i}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {/* Power Card */}
            <div className="border-2 border-black bg-gradient-to-b from-gray-900 to-gray-950 p-3 shadow-inner">
              <div className="text-[10px] font-bold tracking-[0.35em] text-gray-500 mb-3 uppercase">Power</div>
              <div className="flex flex-nowrap gap-2 overflow-x-auto">
                <div className="border border-gray-800 rounded bg-black/60 p-2 flex-1 min-w-[120px]">
                  <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2">Switch</div>
                  <button
                    onClick={handlePowerToggle}
                    className={`flex items-center justify-center gap-1 px-2 py-2 rounded font-bold text-[10px] tracking-wide shadow-lg w-full ${
                      powerOn
                        ? 'bg-red-800 hover:bg-red-900 border border-red-900'
                        : 'bg-gray-700 hover:bg-gray-600 border border-gray-800'
                    }`}
                  >
                    <Power size={14} />
                    {powerOn ? 'OFF' : 'ON'}
                  </button>
                </div>
                <div className="border border-gray-800 rounded bg-black/60 p-2 flex-1 min-w-[120px]">
                  <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2">Lamp</div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border ${
                        powerOn
                          ? 'bg-amber-500 border-amber-400 shadow-lg shadow-amber-500/70'
                          : 'bg-gray-800 border-gray-700'
                      }`}
                    />
                    <span className="text-[10px] text-gray-500 font-mono">{powerOn ? 'LIVE' : 'OFF'}</span>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-600 font-mono">AC OK</div>
                </div>
                <div className="border border-gray-800 rounded bg-black/60 p-2 flex-1 min-w-[120px]">
                  <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2">Rails</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full border ${
                          powerOn
                            ? 'bg-amber-600 border-amber-500 shadow-lg shadow-amber-600/50'
                            : 'bg-gray-800 border-gray-700'
                        }`}
                      />
                      <span className="text-[10px] text-gray-500 font-mono">+10V</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full border ${
                          powerOn
                            ? 'bg-amber-600 border-amber-500 shadow-lg shadow-amber-600/50'
                            : 'bg-gray-800 border-gray-700'
                        }`}
                      />
                      <span className="text-[10px] text-gray-500 font-mono">-15V</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full border ${
                          powerOn
                            ? 'bg-amber-600 border-amber-500 shadow-lg shadow-amber-600/50'
                            : 'bg-gray-800 border-gray-700'
                        }`}
                      />
                      <span className="text-[10px] text-gray-500 font-mono">GND</span>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-800 rounded bg-black/60 p-2 flex-1 min-w-[120px]">
                  <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2">Fuse</div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-mono">F1</span>
                    <div
                      className={`w-3 h-3 rounded-full border ${
                        powerOn
                          ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/60'
                          : 'bg-gray-800 border-gray-700'
                      }`}
                    />
                  </div>
                  <div className="mt-2 text-[10px] text-gray-600 font-mono">{powerOn ? 'OK' : 'STANDBY'}</div>
                </div>
              </div>
            </div>

            {/* Run / Halt Card */}
            <div className="border-2 border-black bg-gradient-to-b from-gray-900 to-gray-950 p-3 shadow-inner">
              <div className="text-[10px] font-bold tracking-[0.35em] text-gray-500 mb-3 uppercase">
                Run / Halt
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="border border-gray-800 rounded bg-black/60 p-2 flex-1 min-w-[140px]">
                  <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2">Run</div>
                  <button
                    onClick={handleRunHalt}
                    disabled={!powerOn}
                    className={`flex items-center justify-center gap-1 px-2 py-2 rounded font-bold text-[10px] tracking-wide shadow-lg w-full ${
                      !powerOn
                        ? 'bg-gray-800 border border-gray-800 cursor-not-allowed opacity-50'
                        : running
                          ? 'bg-orange-800 hover:bg-orange-900 border border-orange-900'
                          : 'bg-gray-700 hover:bg-gray-600 border border-gray-800'
                    }`}
                  >
                    {running ? <Square size={14} /> : <Play size={14} />}
                    {running ? 'HALT' : 'RUN'}
                  </button>
                </div>
                <div className="border border-gray-800 rounded bg-black/60 p-2 flex-1 min-w-[140px]">
                  <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2">Cycle</div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[10px] text-gray-500 font-mono">Status</div>
                    <div
                      className={`w-3 h-3 rounded-full border ${
                        running
                          ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/60'
                          : 'bg-gray-800 border-gray-700'
                      }`}
                    />
                  </div>
                  <div className="mt-2 text-[10px] text-gray-600 font-mono">
                    {running ? 'AUTO' : 'HALT'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Section */}
      <section className="flex-1 overflow-auto bg-gradient-to-br from-gray-900 to-black p-6 relative">
        <canvas ref={canvasRef} width={1200} height={800} className="absolute top-0 left-0 pointer-events-none" />

        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-6 xl:grid-cols-12 relative z-10">
          {slots.map((card, slotIndex) => (
            <div
              key={slotIndex}
              className="border-2 border-black bg-gradient-to-b from-gray-900 to-gray-950 p-3 shadow-inner min-h-[280px] flex flex-col"
            >
              <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
                Slot {slotIndex + 1}
              </div>
              <div className="mt-2 flex-1 flex flex-col gap-3">
                {slotIndex === 0 ? (
                  <div className="border-2 border-gray-800 rounded bg-black/70 p-3 h-full">
                    <div className="text-[10px] font-bold tracking-[0.35em] text-gray-500 mb-3 uppercase">
                      Clock Card
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="border border-gray-800 rounded bg-black/60 p-2">
                        <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2">Rate</div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-gray-300">
                            <input
                              type="radio"
                              name="clockRate"
                              value="0.25"
                              checked={clockRate === 0.25}
                              onChange={(e) => setClockRate(parseFloat(e.target.value))}
                              className="cursor-pointer"
                            />
                            <span className="text-[10px] font-mono">1/4 Hz</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-gray-300">
                            <input
                              type="radio"
                              name="clockRate"
                              value="2"
                              checked={clockRate === 2}
                              onChange={(e) => setClockRate(parseFloat(e.target.value))}
                              className="cursor-pointer"
                            />
                            <span className="text-[10px] font-mono">2 Hz</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-gray-300">
                            <input
                              type="radio"
                              name="clockRate"
                              value="10"
                              checked={clockRate === 10}
                              onChange={(e) => setClockRate(parseFloat(e.target.value))}
                              className="cursor-pointer"
                            />
                            <span className="text-[10px] font-mono">10 Hz</span>
                          </label>
                        </div>
                      </div>
                      <div className="border border-gray-800 rounded bg-black/60 p-2">
                        <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2">Mode</div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-gray-500 font-mono">Auto</span>
                          <div
                            className={`w-3 h-3 rounded-full border ${
                              running
                                ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/60'
                                : 'bg-gray-800 border-gray-700'
                            }`}
                          />
                        </div>
                        <div className="mt-2 text-[10px] text-gray-600 font-mono">
                          {running ? 'RUNNING' : 'HALTED'}
                        </div>
                      </div>
                      <div className="border border-gray-800 rounded bg-black/60 p-2">
                        <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2">Ticks</div>
                        <div className="text-lg font-bold text-amber-400 font-mono">{clockTick}</div>
                        <div className="text-[10px] text-gray-600 font-mono mt-1">
                          Cards: {slots.slice(1).filter((s) => s !== null).length} (
                          {slots.slice(1).filter((s) => s !== null).length * 2}{' '}
                          bits)
                        </div>
                      </div>
                      <div className="border border-gray-800 rounded bg-black/60 p-2">
                        <div className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mb-2">Reset</div>
                        <button
                          onClick={handleClockReset}
                          className="w-full rounded border border-gray-700 bg-gray-800 px-2 py-2 text-[10px] font-bold tracking-wide text-gray-300 hover:bg-gray-700"
                        >
                          CLEAR TICKS
                        </button>
                      </div>
                    </div>
                  </div>
                ) : card ? (
                  <div
                    className={`bg-gradient-to-b from-blue-950 to-blue-900 border-2 rounded p-3 transition-all shadow-lg h-full ${
                      hoveredBit !== null && Math.floor(hoveredBit / 2) === slotIndex
                        ? 'border-amber-600 shadow-amber-600/50'
                        : 'border-blue-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-blue-200 text-xs tracking-wide">{card.type}</div>
                        <div className="text-[10px] text-gray-500">Dual J-K Flip-Flop</div>
                        {hoveredBit !== null && Math.floor(hoveredBit / 2) === slotIndex && (
                          <div className="text-[10px] text-amber-500 mt-1 font-mono">
                            ← Bit {hoveredBit} ({hoveredBit % 2 === 0 ? 'FF1' : 'FF2'})
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeCard(slotIndex)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-red-700 bg-red-600 text-xs font-bold text-white shadow-sm hover:bg-red-500"
                        aria-label="Remove card"
                      >
                        X
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {['J1', 'K1', 'CLK1', 'Q1', 'J2', 'K2', 'CLK2', 'Q2'].map((pin, pinIndex) => (
                        <button
                          key={pinIndex}
                          onClick={() => handlePinClick(slotIndex, pinIndex)}
                          className={`text-[10px] px-2 py-1 rounded border font-mono ${
                            selectedPin?.slot === slotIndex && selectedPin?.pin === pinIndex
                              ? 'bg-amber-600 border-amber-500 text-black font-bold'
                              : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'
                          }`}
                        >
                          {pin}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => addCard(slotIndex)}
                    className="border-2 border-dashed border-gray-700 rounded p-3 h-full hover:border-gray-600 hover:bg-gray-900 text-gray-600 hover:text-gray-500 text-xs"
                  >
                    + Add M113 Card
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-black rounded border border-gray-800 max-w-2xl">
          <div className="font-bold mb-2 text-gray-500 text-sm tracking-wide">INSTRUCTIONS</div>
          <div className="text-xs text-gray-600 space-y-1 font-mono">
            <div>• Click "+ Add M113 Card" to insert flip-flop modules</div>
            <div>• Click pins to create wire connections (click first pin, then second pin)</div>
            <div>• Turn POWER ON, then RUN to start the counter</div>
            <div>• Select clock rate: 1/4 Hz (slow), 2 Hz (medium), or 10 Hz (fast)</div>
            <div>• For a 12-bit counter, you'll need 6 M113 cards (2 flip-flops each)</div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FlipChipSimulator;
