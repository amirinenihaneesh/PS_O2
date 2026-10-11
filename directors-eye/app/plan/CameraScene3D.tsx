"use client";

import { useEffect, useState } from "react";

type CameraScene3DProps = {
  lens: string;
  angle: string;
  fieldOfView: string;
  height: string;
  shotSize: string;
  subjectCount: number;
  environment: string;
  moving: boolean;
  blockingModel: string;
};

export default function CameraScene3D({ lens, angle, fieldOfView, height, shotSize, subjectCount, environment, moving, blockingModel }: CameraScene3DProps) {
  const visibleSubjects = Math.min(subjectCount, 4);
  const [imageVariant, setImageVariant] = useState(0);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("directors-eye-image-analysis");
      const analysis = saved ? JSON.parse(saved) as Array<{ brightness: number; hue: number; aspect: number }> : [];
      if (analysis.length) {
        const average = analysis.reduce((total, item) => total + item.brightness + item.hue + item.aspect * 10, 0) / analysis.length;
        setImageVariant(Math.floor(average) % 4);
      }
    } catch {
      setImageVariant(0);
    }
  }, []);

  return (
    <div className={`scene-3d scene-3d-variant-${imageVariant} ${moving ? "scene-3d-moving" : ""}`} aria-label={`Camera setup: ${lens}, ${angle} vertical tilt, ${fieldOfView} field of view, ${height}, ${subjectCount} subjects`}>
      <div className="scene-3d-grid" />
      <div className="scene-3d-skyline"><span>{environment}</span></div>
      <div className="scene-3d-beam beam-left" /><div className="scene-3d-beam beam-right" />
      {Array.from({ length: visibleSubjects }, (_, index) => <div className={`scene-3d-subject subject-${index + 1}`} key={index}><i /><b /><span>SUBJECT {String.fromCharCode(65 + index)}</span></div>)}
      <div className="scene-3d-camera"><i /><b /><span>CAMERA 01</span></div>
      <div className="scene-3d-operator"><i /><b /><span>YOU</span></div>
      <div className="scene-3d-distance"><span>{blockingModel} · clean eyeline</span></div>
      <div className="scene-3d-readout"><div><small>SHOT</small><strong>{shotSize}</strong></div><div><small>LENS</small><strong>{lens}</strong></div><div><small>CAMERA TILT</small><strong>{angle}</strong></div><div><small>LENS FOV</small><strong>{fieldOfView}</strong></div><div><small>HEIGHT</small><strong>{height}</strong></div></div>
      <div className="scene-3d-status"><span className="live-dot" /> MOVE THE CAMERA HERE</div>
    </div>
  );
}