import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { wipe } from "@remotion/transitions/wipe";
import { z } from "zod";
import { BRAND } from "./brand";
import { Backdrop, BrandFrame, C, CTA_FRAMES, CtaEnd, enter, Pill, pop, SAFE_BOTTOM, Sfx } from "./kit";
import { CANTONS, COUNTRY, GEO_H, GEO_W, LAKES, project } from "./swissGeo";

// -----------------------------------------------------------------------------
// ReelMappa — mappa animata della Svizzera, verticale 1080x1920
// Tre modi: "route" (tragitto che si disegna tra città), "bubbles" (cerchi
// proporzionali a un valore), "cantons" (Cantoni che si accendono uno a uno).
// Real borders (swisstopo / FSO via swiss-maps) in swissGeo.ts.
// -----------------------------------------------------------------------------

const MAP_IN = 60;
const STEP = 54;
const HOLD = 54;
const TRANSITION_FRAMES = 10;

// Coordinate (lon, lat) delle città più usate. Altre si passano con lon/lat.
const CITY: Record<string, [number, number]> = {
  Zurigo: [8.5417, 47.3769],
  Ginevra: [6.1432, 46.2044],
  Basilea: [7.5886, 47.5596],
  Berna: [7.4474, 46.948],
  Losanna: [6.6323, 46.5197],
  Lugano: [8.9511, 46.0037],
  Lucerna: [8.3093, 47.0502],
  "San Gallo": [9.3767, 47.4245],
  Zugo: [8.5156, 47.1662],
  Winterthur: [8.7241, 47.4988],
  "Neuchâtel": [6.9293, 46.9899],
  Sion: [7.3606, 46.2331],
  Coira: [9.532, 46.8499],
  Bellinzona: [9.0244, 46.1946],
  Friburgo: [7.1619, 46.8065],
  Bienne: [7.2467, 47.1368],
  Chiasso: [9.0313, 45.8329],
  Como: [9.0852, 45.8081],
  Varese: [8.8251, 45.8206],
  Milano: [9.19, 45.4642],
  Torino: [7.6869, 45.0703],
  Aosta: [7.3154, 45.7372],
  // English names
  Zurich: [8.5417, 47.3769],
  Geneva: [6.1432, 46.2044],
  Basel: [7.5886, 47.5596],
  Bern: [7.4474, 46.948],
  Lausanne: [6.6323, 46.5197],
  Lucerne: [8.3093, 47.0502],
  "St. Gallen": [9.3767, 47.4245],
  Zug: [8.5156, 47.1662],
  Chur: [9.532, 46.8499],
  Fribourg: [7.1619, 46.8065],
  Milan: [9.19, 45.4642],
  Turin: [7.6869, 45.0703],
};

export const ReelMappaSchema = z.object({
  category: z.string().describe("Etichetta in alto (es. 'Mappa · Italiani in Svizzera')"),
  title: z.string(),
  titleAccent: z.string().optional(),
  mode: z.enum(["route", "bubbles", "cantons"]),
  points: z
    .array(
      z.object({
        city: z.string().describe("Nome città (vedi elenco CITY) o codice Cantone (modo 'cantoni', es. 'ZH')"),
        lon: z.number().optional(),
        lat: z.number().optional(),
        label: z.string().describe("Riga mostrata sotto la mappa"),
        value: z.number().optional().describe("Valore per le bolle o i Cantoni"),
        valueText: z.string().optional().describe("Valore già formattato (es. '211.193')"),
      }),
    )
    .min(1)
    .max(8),
  source: z.string().optional(),
  step: z.number().optional().describe("Frame per ogni punto (default 54)"),
  mapLabels: z.boolean().optional().describe("false = niente etichette sulla mappa (Cantoni vicini), restano nella scheda sotto"),
  ctaTitle: z.string(),
  ctaAccent: z.string(),
  ctaButton: z.string(),
});

export type ReelMappaProps = z.infer<typeof ReelMappaSchema>;

// Durata della sola scena della mappa (riusata anche da ReelNotizia).
export const mapSceneFrames = (p: Pick<ReelMappaProps, "points" | "step">) =>
  MAP_IN + p.points.length * (p.step ?? STEP) + HOLD;

export const calculateReelMappaDuration = (p: ReelMappaProps) =>
  mapSceneFrames(p) + CTA_FRAMES - TRANSITION_FRAMES;

const xy = (p: ReelMappaProps["points"][number], mode: ReelMappaProps["mode"]): [number, number] => {
  if (mode === "cantons") return CANTONS[p.city]?.c ?? [GEO_W / 2, GEO_H / 2];
  if (p.lon !== undefined && p.lat !== undefined) return project(p.lon, p.lat);
  const c = CITY[p.city];
  return c ? project(c[0], c[1]) : [GEO_W / 2, GEO_H / 2];
};

export type MapSceneProps = Omit<ReelMappaProps, "ctaTitle" | "ctaAccent" | "ctaButton">;

export const MapScene: React.FC<MapSceneProps> = (props) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const STEP = props.step ?? 54;
  const pts = props.points.map((p) => xy(p, props.mode));

  // Riquadro: la Svizzera più eventuali città fuori confine (es. Milano).
  const pad = 46;
  const minX = Math.min(0, ...pts.map((p) => p[0])) - pad;
  const minY = Math.min(0, ...pts.map((p) => p[1])) - pad;
  const maxX = Math.max(GEO_W, ...pts.map((p) => p[0])) + pad;
  const maxY = Math.max(GEO_H, ...pts.map((p) => p[1])) + pad;
  const vw = maxX - minX;
  const vh = maxY - minY;
  const boxW = 980;
  const boxH = Math.min(820, (boxW * vh) / vw);
  const k = vw / boxW; // unità della mappa per pixel: testi e tratti a misura di telefono

  const draw = interpolate(frame, [4, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const fill = enter(frame, 26, 26);
  const inner = enter(frame, 40, 20);
  const titleIn = enter(frame, 0, 18);
  const accentIn = enter(frame, 14, 18);

  const current = Math.max(-1, Math.min(props.points.length - 1, Math.floor((frame - MAP_IN) / STEP)));
  const cur = current >= 0 ? props.points[current] : null;
  const curIn = current >= 0 ? enter(frame, MAP_IN + current * STEP, 14) : 0;
  const maxVal = Math.max(1, ...props.points.map((p) => p.value ?? 0));

  return (
    <AbsoluteFill>
      <Backdrop tone="paper" />
      <Sfx at={4} s="whoosh" v={0.35} />
      {props.points.map((_, i) => (
        <Sfx key={i} at={MAP_IN + i * STEP} s="pop" v={0.45} />
      ))}
      <div style={{ position: "absolute", top: 190, left: 80, right: 80 }}>
        <div style={{ opacity: titleIn }}>
          <Pill size={24}>{props.category}</Pill>
        </div>
        <div
          style={{
            fontFamily: BRAND.fonts.serif,
            fontWeight: 900,
            fontSize: 88,
            lineHeight: 1.04,
            letterSpacing: -2,
            color: C.ink,
            marginTop: 28,
            opacity: titleIn,
            transform: `translateY(${(1 - titleIn) * 30}px)`,
          }}
        >
          {props.title}
        </div>
        {props.titleAccent ? (
          <div
            style={{
              fontFamily: BRAND.fonts.serifItalic,
              fontStyle: "italic",
              fontWeight: 700,
              fontSize: 70,
              lineHeight: 1.1,
              color: C.accent,
              marginTop: 6,
              opacity: accentIn,
            }}
          >
            {props.titleAccent}
          </div>
        ) : null}
      </div>

      <svg
        viewBox={`${minX} ${minY} ${vw} ${vh}`}
        width={boxW}
        height={boxH}
        style={{ position: "absolute", left: 50, top: 530 + (680 - boxH) / 2 }}
      >
        <defs>
          <clipPath id="ch">
            <path d={COUNTRY} />
          </clipPath>
        </defs>
        <path d={COUNTRY} fill="#fff" fillOpacity={fill} stroke="none" />
        {Object.entries(CANTONS).map(([code, cn]) => {
          const idx = props.mode === "cantons" ? props.points.findIndex((p) => p.city === code) : -1;
          const on = idx >= 0 ? enter(frame, MAP_IN + idx * STEP, 16) : 0;
          const strength = idx >= 0 && props.points[idx].value !== undefined ? 0.35 + 0.65 * ((props.points[idx].value ?? 0) / maxVal) : 1;
          return (
            <path
              key={code}
              d={cn.d}
              fill={C.accent}
              fillOpacity={on * strength}
              stroke={C.line}
              strokeWidth={1.4 * k}
              strokeOpacity={inner}
            />
          );
        })}
        <g clipPath="url(#ch)" opacity={inner}>
          {LAKES.map((d, i) => (
            <path key={i} d={d} fill="#CFE2EE" />
          ))}
        </g>
        <path
          d={COUNTRY}
          fill="none"
          stroke={C.ink}
          strokeWidth={3.2 * k}
          strokeLinejoin="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
        />

        {/* Tragitto tra le città: curva che si disegna verso la tappa successiva */}
        {props.mode === "route"
          ? pts.slice(1).map((b, i) => {
              const a = pts[i];
              const cx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * 0.25;
              const cy = (a[1] + b[1]) / 2 + (b[0] - a[0]) * 0.25;
              const start = MAP_IN + (i + 1) * STEP - 6;
              const prog = interpolate(frame, [start, start + 26], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
              return (
                <path
                  key={i}
                  d={`M${a[0]},${a[1]} Q${cx},${cy} ${b[0]},${b[1]}`}
                  fill="none"
                  stroke={C.accent}
                  strokeWidth={5 * k}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - prog}
                  opacity={prog > 0 ? 1 : 0}
                />
              );
            })
          : null}

        {/* Punti, bolle ed etichette */}
        {props.points.map((p, i) => {
          const [x, y] = pts[i];
          const start = MAP_IN + i * STEP;
          const s = pop(frame, fps, start, 10);
          if (frame < start) return null;
          const ring = ((frame - start) % 40) / 40;
          const isCur = i === current;
          const r =
            props.mode === "bubbles"
              ? Math.max(12, Math.sqrt((p.value ?? 0) / maxVal) * 78) * k
              : 11 * k;
          const label = props.mode === "cantons" ? (p.valueText ?? p.city) : p.city;
          return (
            <g key={i}>
              {props.mode !== "cantons" ? (
                <>
                  <circle cx={x} cy={y} r={r + ring * 26 * k} fill="none" stroke={C.accent} strokeWidth={3 * k} opacity={isCur ? (1 - ring) * 0.6 : 0} />
                  <circle
                    cx={x}
                    cy={y}
                    r={r * s}
                    fill={C.accent}
                    fillOpacity={props.mode === "bubbles" ? 0.62 : 1}
                    stroke="#fff"
                    strokeWidth={3 * k}
                  />
                </>
              ) : null}
              <g transform={`translate(${x}, ${y - (props.mode === "bubbles" ? r + 14 * k : props.mode === "cantons" ? 0 : 26 * k)})`} opacity={props.mapLabels === false ? 0 : s}>
                <text
                  textAnchor="middle"
                  fontFamily={BRAND.fonts.sans}
                  fontWeight={800}
                  fontSize={30 * k}
                  fill={props.mode === "cantons" ? "#fff" : C.ink}
                  stroke={props.mode === "cantons" ? C.accentDark : C.paper}
                  strokeWidth={props.mode === "cantons" ? 7 * k : 8 * k}
                  paintOrder="stroke"
                  dominantBaseline={props.mode === "cantons" ? "middle" : "auto"}
                >
                  {props.mode === "bubbles" && p.valueText ? p.valueText : label}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* Scheda del punto corrente sotto la mappa */}
      {cur ? (
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            top: 1190,
            background: "#fff",
            borderRadius: 30,
            borderLeft: `14px solid ${C.accent}`,
            padding: "30px 40px",
            boxShadow: "0 24px 60px rgba(17,17,17,0.10)",
            opacity: curIn,
            transform: `translateY(${(1 - curIn) * 30}px)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 22, flexWrap: "wrap" }}>
            <div style={{ fontFamily: BRAND.fonts.serif, fontWeight: 900, fontSize: 60, color: C.ink, letterSpacing: -1 }}>
              {props.mode === "cantons" ? cur.label.split(" · ")[0] : cur.city}
            </div>
            {cur.valueText ? (
              <div style={{ fontFamily: BRAND.fonts.serif, fontWeight: 900, fontSize: 60, color: C.accent }}>{cur.valueText}</div>
            ) : null}
          </div>
          <div style={{ fontFamily: BRAND.fonts.sans, fontWeight: 500, fontSize: 34, lineHeight: 1.3, color: "#444", marginTop: 8 }}>
            {props.mode === "cantons" ? cur.label.split(" · ").slice(1).join(" · ") : cur.label}
          </div>
        </div>
      ) : null}
      {props.source ? (
        <div
          style={{
            position: "absolute",
            left: 80,
            right: 80,
            bottom: SAFE_BOTTOM + 90,
            fontFamily: BRAND.fonts.sans,
            fontSize: 24,
            color: C.grey,
            opacity: enter(frame, MAP_IN, 20),
          }}
        >
          {BRAND.labels.source}: {props.source}
        </div>
      ) : null}
      <BrandFrame segments={props.points.length} active={current} />
    </AbsoluteFill>
  );
};

export const ReelMappa: React.FC<ReelMappaProps> = (props) => {
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={mapSceneFrames(props)}>
          <MapScene {...props} />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={wipe({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: TRANSITION_FRAMES })}
        />
        <TransitionSeries.Sequence durationInFrames={CTA_FRAMES}>
          <CtaEnd title={props.ctaTitle} accent={props.ctaAccent} button={props.ctaButton} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
