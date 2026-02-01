import React, { useEffect, useRef, useState } from 'react';
import { Play, Power, Square } from 'lucide-react';

const FlipChipSimulator = () => {
  const [powerOn, setPowerOn] = useState(false);
  const [running, setRunning] = useState(false);
  const [clockTick, setClockTick] = useState(0);
  const [clockRate, setClockRate] = useState(0.25); // Hz
  const [indicators, setIndicators] = useState(Array(12).fill(false));
  const [slots, setSlots] = useState(Array(8).fill(null));
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
    const installedCards = slots.filter((slot) => slot !== null).length;
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
    <div className="flex flex-col h-screen bg-black text-gray-100 font-mono">
      {/* Title Plate - Full Width */}
      <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 border-b-4 border-black p-6 shadow-2xl">
        <div className="px-4">
          <div className="text-[10px] font-bold tracking-[0.3em] text-gray-400 mb-1 uppercase">
            DIGITAL EQUIPMENT CORPORATION
          </div>
          <div
            className="text-2xl font-bold tracking-wider text-gray-300"
            style={{ fontFamily: 'serif', textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
          >
            Flip Chip Trainer
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Front Panel */}
        <div className="w-80 bg-gradient-to-b from-gray-900 to-black border-r-4 border-black p-6 flex flex-col shadow-inner">
          <h2 className="text-lg font-bold mb-6 text-gray-400 tracking-wide">FRONT PANEL</h2>

          {/* Power Controls */}
          <div className="mb-8">
            <div className="flex gap-2">
              <button
                onClick={handlePowerToggle}
                className={`flex items-center gap-1 px-3 py-2 rounded font-bold text-xs tracking-wide shadow-lg flex-1 ${
                  powerOn
                    ? 'bg-red-800 hover:bg-red-900 border-2 border-red-900'
                    : 'bg-gray-700 hover:bg-gray-600 border-2 border-gray-800'
                }`}
              >
                <Power size={16} />
                {powerOn ? 'OFF' : 'ON'}
              </button>

              <button
                onClick={handleRunHalt}
                disabled={!powerOn}
                className={`flex items-center gap-1 px-3 py-2 rounded font-bold text-xs tracking-wide shadow-lg flex-1 ${
                  !powerOn
                    ? 'bg-gray-700 border-2 border-gray-800 cursor-not-allowed opacity-50'
                    : running
                      ? 'bg-orange-800 hover:bg-orange-900 border-2 border-orange-900'
                      : 'bg-gray-700 hover:bg-gray-600 border-2 border-gray-800'
                }`}
              >
                {running ? <Square size={16} /> : <Play size={16} />}
                {running ? 'HALT' : 'RUN'}
              </button>
            </div>
          </div>

          {/* Power Rail Indicators */}
          <div className="mb-8">
            <h3 className="text-xs font-bold mb-3 text-gray-500 tracking-wider">POWER RAILS</h3>
            <div className="space-y-2 bg-black p-3 rounded border border-gray-800">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full border ${
                    powerOn
                      ? 'bg-amber-600 border-amber-500 shadow-lg shadow-amber-600/50'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                />
                <span className="text-xs text-gray-500 font-mono">+10V</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full border ${
                    powerOn
                      ? 'bg-amber-600 border-amber-500 shadow-lg shadow-amber-600/50'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                />
                <span className="text-xs text-gray-500 font-mono">-15V</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full border ${
                    powerOn
                      ? 'bg-amber-600 border-amber-500 shadow-lg shadow-amber-600/50'
                      : 'bg-gray-800 border-gray-700'
                  }`}
                />
                <span className="text-xs text-gray-500 font-mono">GND</span>
              </div>
            </div>
          </div>

          {/* Logic Indicators */}
          <div>
            <h3 className="text-xs font-bold mb-3 text-gray-500 tracking-wider">LOGIC INDICATORS</h3>
            <div className="flex flex-col gap-0 border border-gray-800 rounded overflow-hidden">
              {indicators.map((state, i) => {
                const installedCards = slots.filter((slot) => slot !== null).length;
                const bitCount = installedCards * 2;
                const isConnected = i < bitCount;

                // Octal grouping: bits 0-2, 3-5, 6-8, 9-11
                const octalGroup = Math.floor(i / 3);
                const bgColor = octalGroup % 2 === 0 ? 'bg-black' : 'bg-gray-900';

                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 p-2 ${bgColor}`}
                    onMouseEnter={() => setHoveredBit(i)}
                    onMouseLeave={() => setHoveredBit(null)}
                  >
                    <span className="text-xs text-gray-600 w-6 font-mono">{i}</span>
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        powerOn && state
                          ? 'bg-red-700 border-red-600 shadow-lg shadow-red-700/80'
                          : 'bg-gray-900 border-gray-700'
                      } ${!isConnected ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clock Info */}
          <div className="mt-8 p-3 bg-black rounded border border-gray-800">
            <div className="text-xs font-bold text-gray-500 mb-3 tracking-wider">CLOCK RATE</div>
            <div className="space-y-2 mb-3">
              <label className="flex items-center gap-2 cursor-pointer text-gray-400 hover:text-gray-300">
                <input
                  type="radio"
                  name="clockRate"
                  value="0.25"
                  checked={clockRate === 0.25}
                  onChange={(e) => setClockRate(parseFloat(e.target.value))}
                  className="cursor-pointer"
                />
                <span className="text-xs font-mono">1/4 Hz (4 sec/tick)</span>
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
                <span className="text-xs font-mono">2 Hz (0.5 sec/tick)</span>
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
                <span className="text-xs font-mono">10 Hz (0.1 sec/tick)</span>
              </label>
            </div>
            <div className="text-xs text-gray-600 font-mono">Ticks: {clockTick}</div>
            <div className="text-xs text-gray-600 mt-1 font-mono">
              Cards: {slots.filter((s) => s !== null).length} ({slots.filter((s) => s !== null).length * 2} bits)
            </div>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 p-6 overflow-auto relative bg-gradient-to-br from-gray-900 to-black">
          <h2 className="text-lg font-bold mb-6 text-gray-400 tracking-wide">BACKPLANE</h2>

          <canvas ref={canvasRef} width={800} height={600} className="absolute top-0 left-0 pointer-events-none" />

          {/* Card Slots */}
          <div className="space-y-4 relative z-10">
            {slots.map((card, slotIndex) => (
              <div key={slotIndex} className="flex items-center gap-4">
                <span className="text-xs text-gray-600 w-12 font-mono">SLOT {slotIndex}</span>

                {card ? (
                  <div
                    className={`bg-gradient-to-b from-blue-950 to-blue-900 border-2 rounded p-4 w-64 transition-all shadow-lg ${
                      hoveredBit !== null && Math.floor(hoveredBit / 2) === slotIndex
                        ? 'border-amber-600 shadow-amber-600/50'
                        : 'border-blue-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-blue-200 text-sm tracking-wide">{card.type}</div>
                        <div className="text-xs text-gray-500">Dual J-K Flip-Flop</div>
                        {hoveredBit !== null && Math.floor(hoveredBit / 2) === slotIndex && (
                          <div className="text-xs text-amber-500 mt-1 font-mono">
                            ← Bit {hoveredBit} ({hoveredBit % 2 === 0 ? 'FF1' : 'FF2'})
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => removeCard(slotIndex)}
                        className="text-xs px-2 py-1 bg-red-900 hover:bg-red-800 rounded border border-red-800"
                      >
                        REMOVE
                      </button>
                    </div>

                    {/* Pins */}
                    <div className="grid grid-cols-4 gap-2">
                      {['J1', 'K1', 'CLK1', 'Q1', 'J2', 'K2', 'CLK2', 'Q2'].map((pin, pinIndex) => (
                        <button
                          key={pinIndex}
                          onClick={() => handlePinClick(slotIndex, pinIndex)}
                          className={`text-xs px-2 py-1 rounded border font-mono ${
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
                    className="border-2 border-dashed border-gray-700 rounded p-4 w-64 hover:border-gray-600 hover:bg-gray-900 text-gray-600 hover:text-gray-500 text-sm"
                  >
                    + Add M113 Card
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-black rounded border border-gray-800 max-w-2xl">
            <h3 className="font-bold mb-2 text-gray-500 text-sm tracking-wide">INSTRUCTIONS</h3>
            <ul className="text-xs text-gray-600 space-y-1 font-mono">
              <li>• Click "+ Add M113 Card" to insert flip-flop modules</li>
              <li>• Click pins to create wire connections (click first pin, then second pin)</li>
              <li>• Turn POWER ON, then RUN to start the counter</li>
              <li>• Select clock rate: 1/4 Hz (slow), 2 Hz (medium), or 10 Hz (fast)</li>
              <li>• For a 12-bit counter, you'll need 6 M113 cards (2 flip-flops each)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlipChipSimulator;
