import Link from "next/link";
import CameraScene3D from "./CameraScene3D";
import ReferenceAnalysis from "./ReferenceAnalysis";

type PlanPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function valueOf(value: string | string[] | undefined, fallback: string) {
  return typeof value === "string" && value ? value : fallback;
}

function numberOf(value: string | string[] | undefined, fallback: number) {
  const parsed = Number.parseInt(valueOf(value, ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 6) : fallback;
}

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const params = await searchParams;
  const lens = valueOf(params.lens, "35mm");
  const lensTip = Number.parseInt(lens, 10) <= 35
    ? "A wider lens keeps more of the location and blocking in view."
    : Number.parseInt(lens, 10) >= 85
      ? "A tighter lens isolates expression and compresses the background."
      : "A 50mm perspective keeps faces natural while retaining scene context.";
  const angle = valueOf(params.angle, "0°");
  const fieldOfViewByLens: Record<string, string> = { "24mm": "74°", "35mm": "54°", "50mm": "40°", "85mm": "24°" };
  const fieldOfView = valueOf(params.fieldOfView, fieldOfViewByLens[lens] ?? "54°");
  const height = valueOf(params.height, "Eye level");
  const reason = valueOf(params.reason, "Eye level preserves a natural eyeline and balanced perspective.");
  const scene = valueOf(params.scene, "A quiet conversation");
  const location = valueOf(params.location, "Interior · practical location");
  const shotType = valueOf(params.shotType, "Two shot");
  const shotSize = valueOf(params.shotSize, shotType);
  const mood = valueOf(params.mood, "Naturalistic");
  const movement = valueOf(params.movement, "Locked off");
  const blockingModel = valueOf(params.blockingModel, "Two people");
  const subjectCount = numberOf(params.subjectCount, shotType === "Single subject" ? 1 : shotType === "Wide establishing" ? 4 : 2);
  const isExterior = /Exterior|Moving vehicle/i.test(location);
  const isMoving = movement !== "Locked off" || /action|running|walking|chase|moving|drive/i.test(scene);
  const environment = isExterior ? "EXTERIOR SPACE" : /studio/i.test(location) ? "STUDIO SPACE" : /vehicle/i.test(location) ? "MOVING VEHICLE" : "INTERIOR SPACE";

  return (
    <main className="plan-shell">
      <header className="plan-header">
        <Link href="/" className="plan-back">← Back to setup</Link>
        <div className="brand"><span className="brand-mark"><span>+</span></span><span>Director&apos;s Eye</span><small>CAMERA PLAN</small></div>
        <div className="plan-status"><span className="status-dot" /> Plan ready</div>
      </header>
      <section className="plan-heading">
        <div><p className="eyebrow">DIRECTOR&apos;S CALL</p><h1>Your recommended setup</h1><p className="plan-scene-name">{scene}</p><p>{reason}</p></div>
        <div className="plan-summary"><div><small>CAMERA TILT</small><strong>{angle}</strong></div><div><small>HEIGHT</small><strong>{height}</strong></div><div><small>LENS</small><strong>{lens}</strong></div><div><small>LENS FOV</small><strong>{fieldOfView}</strong></div></div>
      </section>
      <section className="scene-3d-section"><div className="scene-3d-heading"><div><p className="eyebrow">DIRECTOR&apos;S BLOCKING</p><h2>{shotSize} · {subjectCount} {subjectCount === 1 ? "person" : "people"}</h2><p>{environment} · {mood} · {isMoving ? "moving camera or action" : "stable camera"}</p></div><span className="view-badge">LIVE MODEL</span></div><CameraScene3D lens={lens} angle={angle} fieldOfView={fieldOfView} height={height} shotSize={shotSize} subjectCount={subjectCount} environment={environment} moving={isMoving} blockingModel={blockingModel} /></section>
      <ReferenceAnalysis lens={lens} angle={angle} fieldOfView={fieldOfView} height={height} subjectCount={subjectCount} location={location} shotType={shotSize} movement={movement} />
      <section className="plan-guide">
        <div className="guide-heading"><div><p className="eyebrow">READ THE PLAN</p><h2>Four things to check before you shoot</h2></div><p>Use these moving diagrams as a quick on-set reference.</p></div>
        <div className="guide-grid">
          <article className="guide-card"><div className="guide-card-title"><span>01</span><div><h3>Place the camera</h3><p>Start behind the operator and aim toward the action.</p></div></div><div className="guide-diagram placement-diagram" aria-label="Top view showing camera position and field of view"><div className="guide-room-line" /><div className="guide-subject model-a"><i /><b /></div><div className="guide-subject model-b"><i /><b /></div><div className="guide-camera"><i /></div><div className="guide-beam beam-one" /><div className="guide-beam beam-two" /><span className="diagram-label label-camera">CAMERA</span><span className="diagram-label label-subject">{subjectCount} SUBJECT{subjectCount === 1 ? "" : "S"}</span></div><div className="guide-tip"><span className="live-dot" /> Keep the camera on this side of the eyeline.</div></article>
          <article className="guide-card"><div className="guide-card-title"><span>02</span><div><h3>Set the camera height</h3><p>{height} changes how much presence the subject carries.</p></div></div><div className="guide-diagram height-diagram" aria-label={`Side view showing ${height}`}><div className="horizon-line" /><div className="height-ground" /><div className="height-camera"><i /></div><div className="height-subject"><i /><b /></div><div className="height-ray ray-one" /><div className="height-ray ray-two" /><span className="diagram-label label-horizon">EYELINE</span><span className="height-readout">{height}</span></div><div className="guide-tip"><span className="legend-line" /> Eye level feels natural; low and high angles add power or vulnerability.</div></article>
          <article className="guide-card"><div className="guide-card-title"><span>03</span><div><h3>Understand the lens</h3><p>{lens} controls how wide the room feels and how quickly the background falls away.</p></div></div><div className="guide-diagram lens-diagram" aria-label={`Lens and focus plane for ${lens}`}><div className="lens-camera"><i /></div><div className="lens-ray ray-one" /><div className="lens-ray ray-two" /><div className="focus-plane near-plane"><span>NEAR</span></div><div className="focus-plane far-plane"><span>FOCUS PLANE</span></div><div className="lens-subject"><i /><b /></div><span className="diagram-label label-lens">{lens}</span></div><div className="guide-tip"><span className="legend-line" /> {lensTip}</div></article>
          <article className="guide-card"><div className="guide-card-title"><span>04</span><div><h3>Check the frame</h3><p>Make sure the important faces and the window stay inside the edges.</p></div></div><div className="guide-diagram frame-diagram" aria-label={`${fieldOfView} degree field of view frame`}><div className="frame-guide-corner corner-one" /><div className="frame-guide-corner corner-two" /><div className="frame-guide-corner corner-three" /><div className="frame-guide-corner corner-four" /><div className="frame-window" /><div className="frame-subject subject-left"><i /><b /></div><div className="frame-subject subject-right"><i /><b /></div><div className="frame-fov" /><span className="diagram-label label-fov">{fieldOfView} FOV</span></div><div className="guide-tip"><span className="live-dot" /> Leave a little breathing room above the heads.</div></article>
        </div>
      </section>
      <footer className="plan-footer"><Link href="/" className="secondary-action">← Adjust scene</Link><button className="primary-action" type="button">Print camera plan <span>↗</span></button></footer>
    </main>
  );
}
