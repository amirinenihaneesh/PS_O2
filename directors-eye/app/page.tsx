"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const lenses = ["24mm", "35mm", "50mm", "85mm"];
const lensAngles: Record<string, string> = { "24mm": "74°", "35mm": "54°", "50mm": "40°", "85mm": "24°" };
const STORAGE_KEY = "directors-eye-scene-draft";

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function CompassMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span>+</span>
    </span>
  );
}

function getViewScaleForLens(lens: string) {
  const scales: Record<string, number> = { "24mm": 0.92, "35mm": 1, "50mm": 1.06, "85mm": 1.14 };
  return scales[lens] ?? 1;
}

function getRecommendationPosition(lens: string, height: string) {
  const lensPosition: Record<string, number> = { "24mm": 31, "35mm": 22, "50mm": 18, "85mm": 14 };
  const heightPosition: Record<string, number> = { "Eye level": 18, "Low angle": 12, "High angle": 23, "Ground level": 30 };

  return {
    left: lensPosition[lens] ?? 22,
    bottom: heightPosition[height] ?? 18,
  };
}

function getCameraTilt(height: string, shotType: string, brief: string, mood: string) {
  if (height === "Ground level") return "+30°";
  if (height === "Low angle") return "+15°";
  if (height === "High angle") return /overhead|top[- ]?down|bird's[- ]eye/.test(brief) ? "-90°" : "-20°";
  if (/overhead|top[- ]?down|bird's[- ]eye/.test(brief)) return "-90°";
  if (/looking down/.test(brief) || shotType === "Insert / detail") return "-25°";
  if (/looking up/.test(brief)) return "+15°";
  if (shotType === "Wide establishing") return "-8°";
  if (mood === "Tense") return "+8°";
  if (mood === "Suspenseful") return "-12°";
  return "0°";
}

function getSuggestionFromBrief({
  scene,
  location,
  shotType,
  mood,
  movement,
  coverage,
  blockingModel,
  preferredLens,
  preferredHeight,
}: {
  scene: string;
  location: string;
  shotType: string;
  mood: string;
  movement: string;
  coverage: string;
  blockingModel: string;
  preferredLens?: string;
  preferredHeight?: string;
}) {
  const brief = scene.trim().toLowerCase();
  const personMatches = brief.match(/\b(?:one|two|three|four|five|six|1|2|3|4|5|6)\b/g) ?? [];
  const explicitPeople = brief.match(/\b\d+\s+(?:people|persons|characters|actors|subjects)\b/);
  const subjectCount = explicitPeople
    ? Number.parseInt(explicitPeople[0], 10)
    : personMatches.some((word) => ["two", "2"].includes(word))
      ? 2
      : personMatches.some((word) => ["three", "3"].includes(word))
        ? 3
        : personMatches.some((word) => ["four", "4"].includes(word))
          ? 4
          : /group|crowd|team|family/.test(brief)
            ? 4
            : /single|one person|solo|portrait|hero/.test(brief)
              ? 1
              : shotType === "Single subject"
                ? 1
                : shotType === "Wide establishing"
                  ? 4
                  : 2;

  const isCloseup = /close[- ]?up|insert|detail|portrait|face|eyes/.test(brief) || shotType === "Insert / detail";
  const isIntimate = /intimate|conversation|quiet|emotional|romantic/.test(brief);
  const isDramatic = /dramatic|powerful|threat|hero|intense|action|tense|suspense/.test(brief) || mood === "Tense" || mood === "Suspenseful";
  const isWide = /wide|group|landscape|establishing|street|crowd|panorama/.test(brief) || shotType === "Wide establishing";
  const autoLens = isCloseup
    ? "85mm"
    : isWide
      ? "24mm"
      : shotType === "Single subject" || isIntimate || shotType === "Over-the-shoulder"
        ? "50mm"
        : "35mm";
  const suggestedLens = preferredLens ?? autoLens;
  const autoHeight = /overhead|top[- ]?down|bird's[- ]eye|looking down/.test(brief)
    ? "High angle"
    : /ground[- ]level|floor level|looking up|low angle/.test(brief) || isDramatic
      ? "Low angle"
      : "Eye level";
  const suggestedHeight = preferredHeight ?? autoHeight;
  const suggestedFieldOfView = lensAngles[suggestedLens] ?? "54°";
  const suggestedAngle = getCameraTilt(suggestedHeight, shotType, brief, mood);
  const lensReason = suggestedLens === "24mm"
    ? "The wide field of view keeps the environment and blocking readable."
    : suggestedLens === "85mm"
      ? "The tight field of view isolates detail and draws attention to expression."
      : suggestedLens === "50mm"
        ? "The natural perspective keeps faces and eyelines intimate without crowding the frame."
        : "The balanced field of view keeps the subjects clear while retaining useful context.";
  const heightReason = suggestedHeight === "Low angle"
    ? "A lower camera position adds weight and tension."
    : suggestedHeight === "High angle"
      ? "A higher camera position reveals the layout and makes the subjects feel more exposed."
      : suggestedHeight === "Ground level"
        ? "A ground-level position brings the camera into the action."
        : "Eye level keeps the emotional point of view grounded.";
  const suggestedReason = `${subjectCount} ${subjectCount === 1 ? "person" : "people"} in ${location.toLowerCase()} with a ${shotType.toLowerCase()}: ${suggestedLens} lens (${suggestedFieldOfView} horizontal field of view), ${suggestedAngle} camera tilt at ${suggestedHeight.toLowerCase()}. ${lensReason} ${heightReason}`;

  return {
    lens: suggestedLens,
    height: suggestedHeight,
    angle: suggestedAngle,
    fieldOfView: suggestedFieldOfView,
    reason: suggestedReason,
    cameraLeft: getRecommendationPosition(suggestedLens, suggestedHeight).left,
    cameraBottom: getRecommendationPosition(suggestedLens, suggestedHeight).bottom,
    subjectCount,
    shotType,
    mood,
    movement,
    coverage,
    blockingModel,
  };
}

export default function Home() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [scene, setScene] = useState("A quiet conversation in a small kitchen at golden hour");
  const [lens, setLens] = useState("35mm");
  const [height, setHeight] = useState("Eye level");
  const [mood, setMood] = useState("Naturalistic");
  const [location, setLocation] = useState("Interior · practical location");
  const [shotType, setShotType] = useState("Two shot");
  const [movement, setMovement] = useState("Locked off");
  const [coverage, setCoverage] = useState("Master + coverage");
  const [referenceType, setReferenceType] = useState("Location & blocking");
  const [activeTool, setActiveTool] = useState("plan");
  const [blockingModel, setBlockingModel] = useState("Two people");
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [recommendation, setRecommendation] = useState("Describe the scene and select Suggest a camera setup to calculate the best height and angle.");
  const [userLabel, setUserLabel] = useState("Sign in");
  const [zoom, setZoom] = useState(1);
  const [cameraLeft, setCameraLeft] = useState(22);
  const [cameraBottom, setCameraBottom] = useState(18);
  const [isHydrated, setIsHydrated] = useState(false);
  const fieldOfView = useMemo(() => lensAngles[lens] ?? "54°", [lens]);
  const cameraTilt = useMemo(() => getCameraTilt(height, shotType, scene.toLowerCase(), mood), [height, shotType, scene, mood]);
  const fieldSpread: Record<string, number> = { "24mm": 150, "35mm": 112, "50mm": 82, "85mm": 48 };
  const cameraFovSpread = fieldSpread[lens] ?? 112;
  const canContinueScene = scene.trim().length > 0 && Boolean(location) && Boolean(shotType) && Boolean(mood);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved) as Partial<{
          scene: string;
          lens: string;
          height: string;
          mood: string;
          location: string;
          shotType: string;
          movement: string;
          coverage: string;
          referenceType: string;
          activeTool: string;
          blockingModel: string;
          currentStep: number;
          zoom: number;
          cameraLeft: number;
          cameraBottom: number;
          recommendation: string;
          hasAnalysis: boolean;
        }>;

        if (draft.scene) setScene(draft.scene);
        if (draft.lens) setLens(draft.lens);
        if (draft.height) setHeight(draft.height);
        if (draft.mood) setMood(draft.mood);
        if (draft.location) setLocation(draft.location);
        if (draft.shotType) setShotType(draft.shotType);
        if (draft.movement) setMovement(draft.movement);
        if (draft.coverage) setCoverage(draft.coverage);
        if (draft.referenceType) setReferenceType(draft.referenceType);
        if (draft.activeTool) setActiveTool(draft.activeTool);
        if (draft.blockingModel) setBlockingModel(draft.blockingModel);
        if (typeof draft.currentStep === "number") setCurrentStep(draft.currentStep);
        if (typeof draft.zoom === "number") setZoom(clampNumber(draft.zoom, 0.7, 1.5));
        if (typeof draft.cameraLeft === "number") setCameraLeft(draft.cameraLeft);
        if (typeof draft.cameraBottom === "number") setCameraBottom(draft.cameraBottom);
        if (draft.recommendation) setRecommendation(draft.recommendation);
        if (typeof draft.hasAnalysis === "boolean") setHasAnalysis(draft.hasAnalysis);
      }
    } catch {
      // Ignore malformed draft data.
    }

    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    const draft = {
      scene,
      lens,
      height,
      mood,
      location,
      shotType,
      movement,
      coverage,
      referenceType,
      activeTool,
      blockingModel,
      currentStep,
      zoom,
      cameraLeft,
      cameraBottom,
      recommendation,
      hasAnalysis,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [isHydrated, scene, lens, height, mood, location, shotType, movement, coverage, referenceType, activeTool, blockingModel, currentStep, zoom, cameraLeft, cameraBottom, recommendation, hasAnalysis]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email;
      if (email) setUserLabel(email.slice(0, 2).toUpperCase());
    });
  }, []);

  function handleReferenceFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 6);
    setReferenceFiles(files);

    Promise.all(
      files.map(
        (file) =>
          new Promise<{ brightness: number; hue: number; aspect: number }>((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = 32;
              canvas.height = 32;
              const context = canvas.getContext("2d");
              if (!context) return reject(new Error("Canvas unavailable"));
              context.drawImage(image, 0, 0, 32, 32);
              const pixels = context.getImageData(0, 0, 32, 32).data;
              let red = 0;
              let green = 0;
              let blue = 0;
              let brightness = 0;

              for (let index = 0; index < pixels.length; index += 4) {
                red += pixels[index];
                green += pixels[index + 1];
                blue += pixels[index + 2];
                brightness += (pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3;
              }

              const averageRed = red / 1024;
              const averageGreen = green / 1024;
              const averageBlue = blue / 1024;
              resolve({
                brightness: Math.round(brightness / 1024),
                hue: Math.round((averageRed * 0.5 + averageGreen * 1.2 + averageBlue * 2) % 360),
                aspect: image.width / image.height,
              });
            };

            image.onerror = () => reject(new Error("Image could not be read"));
            image.src = URL.createObjectURL(file);
          }),
      ),
    )
      .then((analysis) => {
        sessionStorage.setItem("directors-eye-image-analysis", JSON.stringify(analysis));
        sessionStorage.setItem("directors-eye-reference-count", String(analysis.length));
      })
      .catch(() => {
        sessionStorage.removeItem("directors-eye-image-analysis");
        sessionStorage.removeItem("directors-eye-reference-count");
      });
  }

  function applySuggestedSetup(next = getSuggestionFromBrief({ scene, location, shotType, mood, movement, coverage, blockingModel })) {
    if (!next) return;

    const placement = getRecommendationPosition(next.lens, next.height);
    setLens(next.lens);
    setHeight(next.height);
    setRecommendation(next.reason);
    setHasAnalysis(true);
    setCurrentStep(3);
    setCameraLeft(placement.left);
    setCameraBottom(placement.bottom);
    setZoom(1);
    setActiveTool("plan");
  }

  function analyzeScene() {
    setAnalyzing(true);
    const next = getSuggestionFromBrief({ scene, location, shotType, mood, movement, coverage, blockingModel, preferredLens: lens, preferredHeight: height });

    window.setTimeout(() => {
      applySuggestedSetup(next);
      const planParams = new URLSearchParams({
        lens: next.lens,
        angle: next.angle,
        fieldOfView: next.fieldOfView,
        height: next.height,
        reason: next.reason,
        scene,
        location,
        shotType,
        shotSize: shotType === "Wide establishing" ? "Wide shot" : shotType === "Insert / detail" ? "Detail shot" : next.subjectCount === 1 ? "Medium close-up" : "Two shot",
        mood,
        movement,
        coverage,
        referenceType,
        blockingModel,
        subjectCount: String(next.subjectCount),
      });

      setAnalyzing(false);
      router.push(`/plan?${planParams.toString()}`);
    }, 550);
  }

  return (
    <main className={isFullscreen ? "app-shell is-fullscreen setup-page" : "app-shell setup-page"}>
      <header className="topbar">
        <div className="brand">
          <CompassMark />
          <span>Director&apos;s Eye</span>
          <small>STUDIO</small>
        </div>
        <div className="project-name">
          <span className="status-dot" /> Untitled scene <span className="saved">Saved just now</span>
        </div>
        <div className="top-actions">
          <button className="icon-button" aria-label="Undo">↶</button>
          <button className="icon-button" aria-label="Redo">↷</button>
          <Link className="avatar" href="/login">{userLabel}</Link>
        </div>
      </header>

      <div className="workspace">
        <aside className="sidebar">
          <div className="side-intro">
            <p className="eyebrow">NEW PROJECT</p>
            <h1>Build your shot.</h1>
            <p>Describe the moment. Director&apos;s Eye will help you find the frame.</p>
          </div>

          <div className="step-list">
            <button className={currentStep === 1 ? "step active" : "step"} onClick={() => setCurrentStep(1)}>
              <span>01</span>
              <div>
                <strong>Scene brief</strong>
                <small>Tell us what&apos;s happening</small>
              </div>
            </button>
            <button className={currentStep === 2 ? "step active" : "step"} onClick={() => setCurrentStep(2)}>
              <span>02</span>
              <div>
                <strong>References &amp; blocking</strong>
                <small>Set the visual language</small>
              </div>
            </button>
            <button className={currentStep === 3 ? "step active" : "step"} onClick={() => setCurrentStep(3)}>
              <span>03</span>
              <div>
                <strong>Camera plan</strong>
                <small>Shape the final composition</small>
              </div>
            </button>
          </div>

          <div className="side-bottom">
            <div className="help">
              <span>?</span>
              <div>
                <strong>Need a hand?</strong>
                <small>Read the shot planning guide</small>
              </div>
            </div>
            <Link href="/login" className="account-link">
              Sign in to save projects <span>↗</span>
            </Link>
          </div>
        </aside>

        <section className="control-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">SCENE BRIEF</p>
              <h2>What are we looking at?</h2>
            </div>
            <span className="progress">
              {currentStep} <i>/</i> 3
            </span>
          </div>

          {currentStep === 1 ? (
            <>
              <label className="field-label" htmlFor="scene">Describe the scene</label>
              <textarea id="scene" value={scene} onChange={(event) => setScene(event.target.value)} className="scene-input" />
              <p className="field-hint">Mention the mood, subjects, movement, and what must stay in frame.</p>

              <div className="form-grid">
                <div>
                  <label className="field-label" htmlFor="location">Location &amp; light</label>
                  <select id="location" value={location} onChange={(event) => setLocation(event.target.value)}>
                    <option>Interior · practical location</option>
                    <option>Interior · studio build</option>
                    <option>Exterior · daylight</option>
                    <option>Exterior · night</option>
                    <option>Moving vehicle</option>
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="shot-type">Primary shot</label>
                  <select id="shot-type" value={shotType} onChange={(event) => setShotType(event.target.value)}>
                    <option>Two shot</option>
                    <option>Single subject</option>
                    <option>Over-the-shoulder</option>
                    <option>Wide establishing</option>
                    <option>Insert / detail</option>
                  </select>
                </div>
              </div>

              <label className="field-label">Directorial tone <span className="field-meta">(choose one)</span></label>
              <div className="choice-grid">
                {["Naturalistic", "Tense", "Romantic", "Comedic", "Suspenseful", "Observational"].map((option) => (
                  <button key={option} className={mood === option ? "choice selected" : "choice"} onClick={() => setMood(option)}>
                    {option}
                  </button>
                ))}
              </div>

              <div className="step-actions">
                <span>Scene brief ready</span>
                <button className="next-button" disabled={!canContinueScene} onClick={() => setCurrentStep(2)}>
                  Continue to references <span>→</span>
                </button>
              </div>
            </>
          ) : null}

          {currentStep === 2 ? (
            <>
              <div className="step-intro">
                <div>
                  <p className="eyebrow">REFERENCE BOARD</p>
                  <h3>Block the scene in motion.</h3>
                  <p>Use simple moving models to explain space, eyelines, and the rhythm of the shot.</p>
                </div>
                <span className="step-count">LIVE</span>
              </div>

              <div className="upload-zone upload-zone-large">
                <div className="upload-icon">⌁</div>
                <div>
                  <strong>{referenceFiles.length ? `${referenceFiles.length} image${referenceFiles.length === 1 ? "" : "s"} selected` : "Add optional reference images"}</strong>
                  <small>{referenceFiles.length ? referenceFiles.map((file) => file.name).join(" · ") : "Use images for location, lighting, wardrobe, or texture · up to 6"}</small>
                </div>
                <label className="browse-button">
                  {referenceFiles.length ? "Change" : "Choose images"}
                  <input type="file" accept="image/*" multiple onChange={handleReferenceFiles} />
                </label>
              </div>

              {referenceFiles.length ? (
                <div className="selected-reference-strip">
                  {referenceFiles.map((file) => (
                    <div className="selected-reference" key={`${file.name}-${file.lastModified}`}>
                      <span>{file.name.slice(0, 16)}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="blocking-board" aria-label="Animated blocking model preview">
                <div className="blocking-grid" />
                <div className="blocking-window" />
                <div className="blocking-subject blocking-subject-one"><span>SUBJECT A</span></div>
                <div className="blocking-subject blocking-subject-two"><span>SUBJECT B</span></div>
                <div className="blocking-camera"><i /><span>CAMERA</span></div>
                <div className="blocking-path path-one" />
                <div className="blocking-path path-two" />
                <div className="blocking-board-label">
                  <span className="live-dot" /> LIVE BLOCKING <small>{blockingModel}</small>
                </div>
              </div>

              <label className="field-label">Blocking model</label>
              <div className="choice-grid model-grid">
                {["Two people", "Single subject", "Over-the-shoulder", "Wide group", "Moving subject", "Detail study"].map((option) => (
                  <button key={option} className={blockingModel === option ? "choice selected" : "choice"} onClick={() => setBlockingModel(option)}>
                    {option}
                  </button>
                ))}
              </div>

              <label className="field-label">What should the references inform?</label>
              <div className="choice-grid">
                {["Location & blocking", "Lighting direction", "Composition", "Wardrobe & texture", "Production design", "Movement reference"].map((option) => (
                  <button key={option} className={referenceType === option ? "choice selected" : "choice"} onClick={() => setReferenceType(option)}>
                    {option}
                  </button>
                ))}
              </div>

              <div className="step-actions">
                <button className="back-button" onClick={() => setCurrentStep(1)}>← Scene brief</button>
                <button className="next-button" onClick={() => setCurrentStep(3)}>Continue to camera plan <span>→</span></button>
              </div>
            </>
          ) : null}

          {currentStep === 3 ? (
            <>
              <div className="step-intro">
                <div>
                  <p className="eyebrow">CAMERA PLAN</p>
                  <h3>Make the shot intentional.</h3>
                  <p>These preferences guide the recommended angle, height, and front-frame composition.</p>
                </div>
                <span className="ai-tag">✦ READY</span>
              </div>

              <div className="control-row">
                <label className="field-label">Lens family</label>
                <div className="segmented">
                  {lenses.map((option) => (
                    <button key={option} className={lens === option ? "selected" : ""} onClick={() => setLens(option)}>
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-grid">
                <div>
                  <label className="field-label" htmlFor="height">Camera height preference</label>
                  <select id="height" value={height} onChange={(event) => setHeight(event.target.value)}>
                    <option>Eye level</option>
                    <option>Low angle</option>
                    <option>High angle</option>
                    <option>Ground level</option>
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="movement">Camera movement</label>
                  <select id="movement" value={movement} onChange={(event) => setMovement(event.target.value)}>
                    <option>Locked off</option>
                    <option>Handheld</option>
                    <option>Slow push in</option>
                    <option>Pan with action</option>
                    <option>Tracking move</option>
                  </select>
                </div>
              </div>

              <label className="field-label">Coverage plan</label>
              <div className="choice-grid">
                {["Master + coverage", "Single continuous take", "Shot / reverse shot", "Subjective POV", "Detail-led sequence", "Improvised blocking"].map((option) => (
                  <button key={option} className={coverage === option ? "choice selected" : "choice"} onClick={() => setCoverage(option)}>
                    {option}
                  </button>
                ))}
              </div>

              <div className="step-actions">
                <button className="back-button" onClick={() => setCurrentStep(2)}>← References</button>
                <div className="final-actions">
                  <button className="ai-ask-button" onClick={analyzeScene}>✦ Ask AI for angle &amp; position</button>
                  <button className="analyze-button" onClick={analyzeScene}>
                    {analyzing ? "Analyzing scene..." : "Calculate camera angle & height"}
                    <span>→</span>
                  </button>
                </div>
              </div>

              {hasAnalysis ? (
                <div className="analysis-result" aria-live="polite">
                  <div className="analysis-result-heading">
                    <span className="sparkle">✦</span>
                    <div>
                      <small>SCENE ANALYSIS COMPLETE</small>
                      <strong>Recommended camera setup</strong>
                    </div>
                  </div>
                  <div className="analysis-values">
                    <div>
                      <small>CAMERA TILT</small>
                      <strong>{cameraTilt}</strong>
                      <span>vertical aim</span>
                    </div>
                    <div>
                      <small>LENS FOV</small>
                      <strong>{fieldOfView}</strong>
                      <span>horizontal view</span>
                    </div>
                    <div>
                      <small>HEIGHT</small>
                      <strong>{height}</strong>
                      <span>camera position</span>
                    </div>
                  </div>
                  <p>{recommendation}</p>
                </div>
              ) : (
                <p className="analysis-prompt">The angle and height will be calculated from your full brief.</p>
              )}
            </>
          ) : null}
        </section>

        <section className="canvas-area">
          <div className="canvas-toolbar">
            <div className="tool-tabs">
              <button className={activeTool === "plan" ? "tool active" : "tool"} onClick={() => setActiveTool("plan")}>
                ⊞ <span>Floor plan</span>
              </button>
              <button className={activeTool === "frame" ? "tool active" : "tool"} onClick={() => setActiveTool("frame")}>
                ◫ <span>Frame view</span>
              </button>
            </div>
            <div className="canvas-actions">
              <button onClick={() => setIsFullscreen(!isFullscreen)} className="tool" title="Toggle fullscreen">
                ⛶ <span>{isFullscreen ? "Exit" : "Fullscreen"}</span>
              </button>
              <button className="tool">⋯</button>
            </div>
          </div>

          <div className="canvas-stage">
            <div className="canvas-zoom-controls" aria-label="Canvas zoom controls">
              <button type="button" onClick={() => setZoom((value) => Number(clampNumber(value - 0.1, 0.7, 1.5).toFixed(1)))} aria-label="Zoom out">
                −
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((value) => Number(clampNumber(value + 0.1, 0.7, 1.5).toFixed(1)))} aria-label="Zoom in">
                +
              </button>
            </div>

            <div className="stage-label">
              <span className="live-dot" /> EDITING VIEW <span>·</span> {activeTool === "plan" ? "FLOOR PLAN" : "FRONT VIEW"}
            </div>

            {activeTool === "plan" ? (
              <div className="floor-plan-wrapper" style={{ transform: `scale(${zoom})` }}>
                <div className="floor-plan">
                  <div className="room kitchen">
                    <span>KITCHEN</span>
                    <div className="counter" />
                    <div className="island" />
                  </div>
                  <div className="room dining">
                    <span>DINING</span>
                    <div className="table" />
                    <div className="chair c1" />
                    <div className="chair c2" />
                    <div className="chair c3" />
                  </div>
                  <div className="window-line" />
                  <div className="light-source" aria-hidden="true" />
                  <div className="subject subject-one"><span>SUBJECT A</span></div>
                  <div className="subject subject-two"><span>SUBJECT B</span></div>
                  <svg className="camera-lines" viewBox="0 0 600 440" preserveAspectRatio="none" aria-label="Camera field of view">
                    <defs>
                      <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                        <path d="M0,0 L6,3 L0,6" fill="none" stroke="#c79553" />
                      </marker>
                    </defs>
                    <line x1="90" y1="350" x2={340 - cameraFovSpread / 2} y2="230" strokeDasharray="5 7" markerEnd="url(#arrow)" />
                    <line x1="90" y1="350" x2={340 + cameraFovSpread / 2} y2="230" strokeDasharray="5 7" markerEnd="url(#arrow)" />
                    <line x1="90" y1="350" x2="340" y2="230" strokeDasharray="5 7" />
                  </svg>
                  <div className="operator-connection" aria-hidden="true" />
                  <div className="operator-marker" title="Person holding the camera">
                    <span className="person-head" />
                    <span className="person-body" />
                    <small>OPERATOR</small>
                  </div>

                  <div className="camera-marker" title="Camera position" style={{ left: `${cameraLeft}%`, bottom: `${cameraBottom}%` }}>
                    <span>CAM 01</span>
                    <b className="camera-icon"><i /></b>
                  </div>

                  <div className={`motion-path ${movement.toLowerCase().replace(/\s+/g, "-")}`} aria-hidden="true" />
                  <div className="angle-badge">
                    {lens} <span>·</span> {cameraTilt} tilt
                  </div>
                </div>
              </div>
            ) : (
              <div className="front-view">
                <div className="front-frame" style={{ transform: `scale(${getViewScaleForLens(lens)})`, transformOrigin: "center center" }}>
                  <span className="frame-corner top-left" />
                  <span className="frame-corner top-right" />
                  <span className="frame-corner bottom-left" />
                  <span className="frame-corner bottom-right" />
                  <div className="front-window" />
                  <div className="front-subject subject-a"><span>SUBJECT A</span></div>
                  <div className="front-subject subject-b"><span>SUBJECT B</span></div>
                  <div className="eyeline" />
                  <div className="front-frame-label">{fieldOfView} FOV · {cameraTilt}</div>
                </div>
                <div className="front-view-meta">
                  <div>
                    <small>CAMERA TILT</small>
                    <strong>{cameraTilt}</strong>
                  </div>
                  <div>
                    <small>LENS FIELD OF VIEW</small>
                    <strong>{fieldOfView}</strong>
                  </div>
                  <div>
                    <small>CAMERA HEIGHT</small>
                    <strong>{height}</strong>
                  </div>
                  <p>{hasAnalysis ? recommendation : "Run scene analysis to calculate the recommended front view."}</p>
                </div>
              </div>
            )}

            <div className="canvas-legend">
              <span><i className="legend-camera" /> Camera</span>
              <span><i className="legend-subject" /> Subject</span>
              <span><i className="legend-line" /> Camera view</span>
              <span><i className="legend-operator" /> Operator</span>
            </div>
          </div>

          <div className="canvas-footer">
            <div>
              <span className="sparkle">✦</span>
              <div>
                <strong>Suggested setup · {lens}, {cameraTilt} tilt · {fieldOfView} FOV</strong>
                <small>Camera 01 gives the cleanest eyeline while keeping the window and the subject in frame.</small>
              </div>
            </div>
            <button
              className="apply-button"
              onClick={() => {
                const suggested = getSuggestionFromBrief({ scene, location, shotType, mood, movement, coverage, blockingModel });
                if (!suggested) return;
                applySuggestedSetup(suggested);
              }}
            >
              Apply suggestion
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
