"use client";

import { PointerEvent, useState } from "react";

type FrontViewProps = {
  lens: string;
  angle: string;
};

export default function FrontView({ lens, angle }: FrontViewProps) {
  const initialAngle = Number.parseInt(angle, 10) || 54;
  const [angleValue, setAngleValue] = useState(initialAngle);
  const [draggingAngle, setDraggingAngle] = useState(false);
  const fovHalfWidth = 12 + ((angleValue - 20) / 70) * 32;

  function updateAngle(event: PointerEvent<HTMLDivElement>) {
    if (!draggingAngle) return;
    const rail = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rail.left) / rail.width));
    setAngleValue(Math.round(20 + ratio * 70));
  }

  function startAngleDrag(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingAngle(true);
  }

  return (
    <div className="interactive-front">
      <div
        className="front-frame interactive-frame"
      >
        <span className="frame-corner top-left" /><span className="frame-corner top-right" /><span className="frame-corner bottom-left" /><span className="frame-corner bottom-right" />
        <div className="front-window" />
        <div className="light-sweep" />
        <div className="front-subject subject-a"><span>SUBJECT A</span></div>
        <div className="front-subject subject-b"><span>SUBJECT B</span></div>
        <svg className="front-fov-overlay" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label={`Camera field of view ${angleValue} degrees`}>
          <polygon points={`50,100 ${50 - fovHalfWidth},0 ${50 + fovHalfWidth},0`} />
          <line x1="50" y1="100" x2={50 - fovHalfWidth} y2="0" />
          <line x1="50" y1="100" x2={50 + fovHalfWidth} y2="0" />
        </svg>
        <div className="eyeline" />
        <div className="front-frame-label">{lens} · {angleValue}°</div>
        <div className="frame-live-label"><span className="live-dot" /> LIVE BLOCKING</div>
      </div>
      <div className="angle-control"><div><small>CAMERA ANGLE</small><strong>{angleValue}°</strong></div><div className="angle-rail" onPointerDown={startAngleDrag} onPointerMove={updateAngle} onPointerUp={() => setDraggingAngle(false)} onPointerLeave={() => setDraggingAngle(false)}><span className="angle-track" /><span className="angle-handle" style={{ left: `${((angleValue - 20) / 70) * 100}%` }} /></div><span className="angle-range">20° <i>wide</i><b>90° <i>tight</i></b></span></div>
      <div className="front-drag-hint"><span>⌁</span> Drag the camera angle control to change the view</div>
    </div>
  );
}
