import { useEffect, useRef } from 'react';
import { CANVAS_SIZE, WIRE_LAYOUT } from '../constants';
import type { Wire } from '../types';

type WiringCanvasProps = {
  wires: Wire[];
  width?: number;
  height?: number;
};

export const WiringCanvas = ({
  wires,
  width = CANVAS_SIZE.width,
  height = CANVAS_SIZE.height,
}: WiringCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#9b6a1f';
    ctx.lineWidth = 2;

    wires.forEach((wire) => {
      const fromX = WIRE_LAYOUT.originX;
      const fromY =
        WIRE_LAYOUT.originY +
        wire.fromSlot * WIRE_LAYOUT.slotSpacing +
        wire.fromPin * WIRE_LAYOUT.pinSpacing;
      const toX = WIRE_LAYOUT.originX;
      const toY =
        WIRE_LAYOUT.originY +
        wire.toSlot * WIRE_LAYOUT.slotSpacing +
        wire.toPin * WIRE_LAYOUT.pinSpacing;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    });
  }, [wires]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
    />
  );
};
