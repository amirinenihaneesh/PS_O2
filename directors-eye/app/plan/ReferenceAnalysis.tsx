"use client";

import { useEffect, useState } from "react";

type ReferenceAnalysisProps = {
  lens: string;
  angle: string;
  fieldOfView: string;
  height: string;
  subjectCount: number;
  location: string;
  shotType: string;
  movement: string;
};

export default function ReferenceAnalysis({ lens, angle, fieldOfView, height, subjectCount, location, shotType, movement }: ReferenceAnalysisProps) {
  const [referenceCount, setReferenceCount] = useState(0);
  const lensGuidance = Number.parseInt(lens, 10) <= 35
    ? "A wider lens keeps more of the location and blocking in view."
    : Number.parseInt(lens, 10) >= 85
      ? "A tighter lens isolates expression and compresses the background."
      : "A 50mm perspective keeps faces natural while retaining scene context.";

  useEffect(() => {
    try {
      setReferenceCount(Number(sessionStorage.getItem("directors-eye-reference-count") ?? 0));
    } catch {
      setReferenceCount(0);
    }
  }, []);

  return (
    <section className="reference-analysis">
      <div className="analysis-heading"><div><p className="eyebrow">DIRECTOR&apos;S ANALYSIS</p><h2>{shotType} in {location.toLowerCase()}</h2><p>{referenceCount ? `${referenceCount} uploaded image${referenceCount === 1 ? "" : "s"} used as visual context. ` : "Scene brief used as visual context. "}{subjectCount} {subjectCount === 1 ? "person is" : "people are"} placed for a readable eyeline and {movement === "Locked off" ? "a stable frame" : "movement that follows the action"}.</p></div><span className="analysis-count"><span className="live-dot" /> {referenceCount ? `${referenceCount} IMAGES USED` : "BRIEF USED"}</span></div>
      <div className="analysis-views">
        <article className="analysis-2d"><div className="analysis-card-title"><span>2D MAP</span><strong>Place the camera here</strong></div><div className="shot-map-2d" aria-label="Two dimensional shot map"><div className="map-wall wall-top" /><div className="map-wall wall-right" /><div className="map-window" /><div className="map-subject map-subject-a"><i /><span>A</span></div><div className="map-subject map-subject-b"><i /><span>B</span></div><div className="map-camera"><i /><span>CAMERA</span></div><div className="map-fov" /><div className="map-eyeline" /><small className="map-label map-label-fov">{fieldOfView} FIELD OF VIEW</small><small className="map-label map-label-height">{angle} TILT · {height}</small></div><p className="analysis-card-note">The camera stays on one side of the subjects so the eyeline remains consistent.</p></article>
        <article className="analysis-summary"><div className="analysis-card-title"><span>DECISION</span><strong>What the director chose</strong></div><div className="analysis-decision"><div><small>LENS</small><strong>{lens}</strong><span>{fieldOfView} horizontal field of view</span><p>{lensGuidance}</p></div><div><small>CAMERA TILT</small><strong>{angle}</strong><span>vertical aim for {shotType.toLowerCase()}</span></div><div><small>HEIGHT</small><strong>{height}</strong><span>sets the emotional point of view</span></div></div><div className="analysis-checklist"><p><span className="live-dot" /> {subjectCount} {subjectCount === 1 ? "subject stays" : "subjects stay"} inside the frame</p><p><span className="live-dot" /> Camera remains on the clean side</p><p><span className="live-dot" /> {movement === "Locked off" ? "Hold the frame steady" : `Use ${movement.toLowerCase()} to follow the action`}</p></div></article>
      </div>
    </section>
  );
}