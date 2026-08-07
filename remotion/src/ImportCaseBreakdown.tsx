import {
  AbsoluteFill,
  Composition,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import importCases from "../../src/data/import_cases.json";
import type { ImportCase } from "../../src/data/types";

const SLUG = "importar-paneles-solares-china-chile";

const importCase = (importCases as ImportCase[]).find(
  (c) => c.slug === SLUG,
);

if (!importCase) {
  throw new Error(`No se encontró el caso de importación "${SLUG}"`);
}

const FadeSlideIn: React.FC<{ delay: number; children: React.ReactNode }> = ({
  delay,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const opacity = interpolate(progress, [0, 1], [0, 1]);
  const translateY = interpolate(progress, [0, 1], [30, 0]);

  return (
    <div style={{ opacity, transform: `translateY(${translateY}px)` }}>
      {children}
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string;
  delay: number;
  accent?: string;
}> = ({ label, value, delay, accent = "text-blue-400" }) => (
  <FadeSlideIn delay={delay}>
    <div className="bg-slate-800 rounded-2xl px-12 py-8 flex flex-col items-center gap-2 w-96">
      <div className={`text-6xl font-bold ${accent}`}>{value}</div>
      <div className="text-xl text-slate-300 text-center">{label}</div>
    </div>
  </FadeSlideIn>
);

const IntroScene: React.FC<{ data: ImportCase }> = ({ data }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const progress = spring({ frame, fps, config: { damping: 200 } });
  const opacity = interpolate(progress, [0, 1], [0, 1]);

  return (
    <AbsoluteFill className="bg-slate-900 flex flex-col items-center justify-center gap-8 px-24 text-center">
      <div style={{ opacity }} className="text-6xl font-bold text-white leading-tight">
        {data.producto}
      </div>
      <FadeSlideIn delay={25}>
        <div className="flex items-center gap-6 text-4xl font-semibold text-blue-400">
          <span>{data.origen}</span>
          <span className="text-slate-500">→</span>
          <span>{data.destino}</span>
        </div>
      </FadeSlideIn>
      <FadeSlideIn delay={40}>
        <div className="text-2xl text-slate-400">
          Código arancelario (HS): {data.hs_code}
        </div>
      </FadeSlideIn>
    </AbsoluteFill>
  );
};

const RatesScene: React.FC<{ data: ImportCase }> = ({ data }) => (
  <AbsoluteFill className="bg-slate-900 flex flex-col items-center justify-center gap-10">
    <FadeSlideIn delay={0}>
      <div className="text-3xl text-slate-400">Tasas aplicables</div>
    </FadeSlideIn>
    <div className="flex gap-10">
      <StatCard
        label="Arancel ad valorem"
        value={`${data.arancel_ad_valorem_pct}%`}
        delay={10}
        accent="text-emerald-400"
      />
      <StatCard label="IVA" value={`${data.iva_pct}%`} delay={20} />
    </div>
  </AbsoluteFill>
);

const CostsScene: React.FC<{ data: ImportCase; total: number }> = ({
  data,
  total,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const countProgress = spring({
    frame: frame - 60,
    fps,
    config: { damping: 200 },
  });
  const animatedTotal = Math.round(
    interpolate(countProgress, [0, 1], [0, total], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }),
  );

  return (
    <AbsoluteFill className="bg-slate-900 flex flex-col items-center justify-center gap-8">
      <FadeSlideIn delay={0}>
        <div className="text-3xl text-slate-400">Costos fijos estimados (USD)</div>
      </FadeSlideIn>
      <div className="flex gap-8">
        <StatCard
          label="Gastos de puerto"
          value={`$${data.gastos_puerto_usd}`}
          delay={10}
        />
        <StatCard
          label="Despacho / agente"
          value={`$${data.gastos_despacho_agente_usd}`}
          delay={20}
        />
        <StatCard
          label="Flete estimado / m³"
          value={`$${data.flete_estimado_m3_usd}`}
          delay={30}
        />
      </div>
      <FadeSlideIn delay={65}>
        <div className="mt-6 text-2xl text-slate-300">
          Subtotal costos fijos:{" "}
          <span className="text-emerald-400 font-bold text-4xl">
            ${animatedTotal} USD
          </span>
        </div>
      </FadeSlideIn>
    </AbsoluteFill>
  );
};

const OutroScene: React.FC<{ data: ImportCase }> = ({ data }) => (
  <AbsoluteFill className="bg-slate-900 flex flex-col items-center justify-center gap-4 text-center px-20">
    <FadeSlideIn delay={0}>
      <div className="text-2xl text-slate-400">
        * Arancel e IVA se calculan sobre el valor FOB de tu importación
      </div>
    </FadeSlideIn>
    <FadeSlideIn delay={10}>
      <div className="text-4xl font-bold text-white mt-4">
        calculadoras-importacion
      </div>
    </FadeSlideIn>
    <FadeSlideIn delay={20}>
      <div className="text-lg text-slate-500">/{data.slug}</div>
    </FadeSlideIn>
  </AbsoluteFill>
);

export const ImportCaseBreakdown: React.FC = () => {
  const total =
    importCase.gastos_puerto_usd +
    importCase.gastos_despacho_agente_usd +
    importCase.flete_estimado_m3_usd;

  return (
    <AbsoluteFill className="font-sans">
      <Sequence from={0} durationInFrames={70}>
        <IntroScene data={importCase} />
      </Sequence>
      <Sequence from={70} durationInFrames={90}>
        <RatesScene data={importCase} />
      </Sequence>
      <Sequence from={160} durationInFrames={90}>
        <CostsScene data={importCase} total={total} />
      </Sequence>
      <Sequence from={250} durationInFrames={50}>
        <OutroScene data={importCase} />
      </Sequence>
    </AbsoluteFill>
  );
};

export const ImportCaseBreakdownComposition: React.FC = () => (
  <Composition
    id="ImportCaseBreakdown"
    component={ImportCaseBreakdown}
    durationInFrames={300}
    fps={30}
    width={1280}
    height={720}
  />
);
