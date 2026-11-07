
"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import type { BoardData, Marker, Point } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import {
  Download,
  MousePointer2,
  Pencil,
  Save,
  Trash2,
} from "lucide-react";

const blank: BoardData = {
  markers: [],
  paths: [],
  notes: "",
  map_image: "",
};

const mapOptions = [
  "Abyss",
  "Ascent",
  "Bind",
  "Breeze",
  "Corrode",
  "Fracture",
  "Haven",
  "Icebox",
  "Lotus",
  "Pearl",
  "Split",
  "Sunset",
  "Summit",
];

function validLocalMapPath(value: string) {
  return /^\/maps\/[a-z0-9_-]+\.(png|jpe?g|webp)$/i.test(value.trim());
}

type StoredBoard = {
  markers?: Marker[];
  paths?: Point[][];
  notes?: string;
  map_image?: string;
};

export function StrategyBoard({
  strategyId,
  initialBoard = blank,
  canEdit,
  initialTitle = "Nova estratégia",
  initialMapName = "Ascent",
  initialSide = "attack",
}: {
  strategyId?: string;
  initialBoard?: BoardData;
  canEdit: boolean;
  initialTitle?: string;
  initialMapName?: string;
  initialSide?: "attack" | "defense";
}) {
  const [board, setBoard] = useState<BoardData>({
    ...blank,
    ...(initialBoard || {}),
  });

  const [tool, setTool] = useState<"select" | "marker" | "path">("marker");
  const [label, setLabel] = useState("P1");
  const [mapName, setMapName] = useState(initialMapName);
  const [title, setTitle] = useState(initialTitle);
  const [side, setSide] = useState<"attack" | "defense">(initialSide);
  const [status, setStatus] = useState("");
  const [mapFailed, setMapFailed] = useState(false);
  const [officialMapAssets, setOfficialMapAssets] = useState<
    Record<string, string>
  >({});

  const svgRef = useRef<SVGSVGElement>(null);
  const drawing = useRef<Point[]>([]);

  useEffect(() => {
    let active = true;

    fetch("https://valorant-api.com/v1/maps?language=pt-BR")
      .then((response) => {
        if (!response.ok) throw new Error("Map data unavailable");
        return response.json();
      })
      .then(
        (payload: {
          data?: Array<{
            displayName?: string;
            displayIcon?: string | null;
          }>;
        }) => {
          if (!active) return;

          const entries = (payload.data || [])
            .filter((item) => item.displayName && item.displayIcon)
            .map(
              (item) =>
                [item.displayName!.toLowerCase(), item.displayIcon!] as const
            );

          setOfficialMapAssets(Object.fromEntries(entries));
        }
      )
      .catch(() => {
        if (active) setOfficialMapAssets({});
      });

    return () => {
      active = false;
    };
  }, []);

  function point(e: MouseEvent<SVGSVGElement>): Point {
    const rect = e.currentTarget.getBoundingClientRect();

    return {
      x: Math.max(
        0,
        Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)
      ),
      y: Math.max(
        0,
        Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)
      ),
    };
  }

  function onDown(e: MouseEvent<SVGSVGElement>) {
    if (!canEdit) return;

    const p = point(e);

    if (tool === "marker") {
      const marker: Marker = {
        id: crypto.randomUUID(),
        ...p,
        label: label || "P",
        kind: "player",
      };

      setBoard((b) => ({
        ...b,
        markers: [...b.markers, marker],
      }));
    } else if (tool === "path") {
      drawing.current = [p];
    }
  }

  function onUp(e: MouseEvent<SVGSVGElement>) {
    if (!canEdit || tool !== "path" || !drawing.current.length) return;

    const end = point(e);
    const path = [...drawing.current, end];

    setBoard((b) => ({
      ...b,
      paths: [...b.paths, path],
    }));

    drawing.current = [];
  }

  async function save() {
    if (!canEdit) return;

    setStatus("A guardar...");

    try {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;

      if (!user) {
        throw new Error("Tens de iniciar sessão para guardar estratégias.");
      }

      const payload = {
        name: title.trim(),
        map_name: mapName,
        side,
        instructions: board.notes,
        markers: {
          markers: board.markers,
          paths: board.paths,
          notes: board.notes,
          map_image: board.map_image,
        },
      };

      if (!payload.name) {
        throw new Error("Introduz um título para a estratégia.");
      }

      const result = strategyId
        ? await supabase
            .from("strategies")
            .update(payload)
            .eq("id", strategyId)
            .select("id")
            .maybeSingle()
        : await supabase
            .from("strategies")
            .insert({
              ...payload,
              created_by: user.id,
            })
            .select("id")
            .single();

      if (result.error) throw result.error;

      if (strategyId && !result.data) {
        throw new Error(
          "Não foi possível atualizar a estratégia. Verifica as permissões."
        );
      }

      setStatus("Estratégia guardada com sucesso.");
    } catch (e) {
      console.error("Erro ao guardar estratégia:", e);

      setStatus(
        e instanceof Error ? e.message : "Erro ao guardar estratégia."
      );
    }
  }

  async function exportPng() {
    const svg = svgRef.current;
    if (!svg) return;

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    const source = new XMLSerializer().serializeToString(clone);

    const url = URL.createObjectURL(
      new Blob([source], {
        type: "image/svg+xml;charset=utf-8",
      })
    );

    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1400;
      canvas.height = 896;

      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(url);
        return;
      }

      ctx.fillStyle = "#0d0f14";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      URL.revokeObjectURL(url);

      try {
        const a = document.createElement("a");
        a.download = `noxvanta-${mapName.toLowerCase()}.png`;
        a.href = canvas.toDataURL("image/png");
        a.click();
      } catch {
        setStatus(
          "Não foi possível exportar este mapa. Confirma se a imagem local está em public/maps."
        );
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      setStatus("Não foi possível exportar o quadro.");
    };

    img.src = url;
  }

  const localImage =
    board.map_image && validLocalMapPath(board.map_image)
      ? board.map_image.trim()
      : "";

  const mapImage =
    localImage || officialMapAssets[mapName.toLowerCase()] || "";

  return (
    <div className="board-shell">
      <div className="board-toolbar">
        <div className="tool-group">
          <button
            type="button"
            className={tool === "marker" ? "tool active" : "tool"}
            onClick={() => setTool("marker")}
            disabled={!canEdit}
          >
            <MousePointer2 size={16} /> Marcador
          </button>

          <button
            type="button"
            className={tool === "path" ? "tool active" : "tool"}
            onClick={() => setTool("path")}
            disabled={!canEdit}
          >
            <Pencil size={16} /> Caminho
          </button>

          <button
            type="button"
            className="tool"
            onClick={() =>
              setBoard((b) => ({
                ...b,
                markers: [],
                paths: [],
              }))
            }
            disabled={!canEdit}
          >
            <Trash2 size={16} /> Limpar desenhos
          </button>
        </div>

        <button className="tool" type="button" onClick={exportPng}>
          <Download size={16} /> Exportar PNG
        </button>
      </div>

      <div className="board-fields">
        <label>
          Título
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!canEdit}
          />
        </label>

        <label>
          Mapa
          <select
            value={mapName}
            onChange={(e) => {
              setMapName(e.target.value);
              setMapFailed(false);
            }}
            disabled={!canEdit}
          >
            {mapOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Lado
          <select
            value={side}
            onChange={(e) =>
              setSide(e.target.value as "attack" | "defense")
            }
            disabled={!canEdit}
          >
            <option value="attack">Ataque</option>
            <option value="defense">Defesa</option>
          </select>
        </label>

        <label>
          Etiqueta do marcador
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={!canEdit}
          />
        </label>
      </div>

      <label className="map-asset-field">
        Imagem de minimapa personalizada (opcional)
        <input
          value={board.map_image || ""}
          onChange={(e) => {
            setBoard((b) => ({
              ...b,
              map_image: e.target.value,
            }));
            setMapFailed(false);
          }}
          disabled={!canEdit}
          placeholder={`/maps/${mapName.toLowerCase()}.png`}
        />

        <small>
          Os minimapas são carregados automaticamente. Também podes indicar
          uma imagem autorizada em public/maps.
        </small>
      </label>

      <div className="tactical-stage">
        <svg
          ref={svgRef}
          className="tactical-svg"
          viewBox="0 0 1000 640"
          onMouseDown={onDown}
          onMouseUp={onUp}
          role="img"
          aria-label={`Quadro tático ${mapName}`}
        >
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#353943"
                strokeWidth="1"
              />
            </pattern>

            <marker
              id="arrow"
              markerWidth="8"
              markerHeight="8"
              refX="6"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill="#e53945" />
            </marker>
          </defs>

          <rect width="1000" height="640" fill="#10131a" />

          {mapImage && !mapFailed ? (
            <image
              href={mapImage}
              x="0"
              y="0"
              width="1000"
              height="640"
              preserveAspectRatio="xMidYMid meet"
              onError={() => setMapFailed(true)}
            />
          ) : (
            <g>
              <rect width="1000" height="640" fill="url(#grid)" />

              <path
                d="M120 90 L410 90 L410 230 L590 230 L590 90 L880 90 L880 540 L650 540 L650 410 L350 410 L350 540 L120 540 Z"
                fill="#171c25"
                stroke="#454b58"
                strokeWidth="4"
              />

              <path
                d="M410 90 L410 230 L350 300 L350 410 M590 90 L590 230 L650 300 L650 410 M350 300 L650 300"
                fill="none"
                stroke="#555c69"
                strokeWidth="3"
                strokeDasharray="8 8"
              />

              <text
                x="500"
                y="300"
                textAnchor="middle"
                fill="#727987"
                fontSize="24"
                letterSpacing="5"
              >
                {mapFailed ? "IMAGEM NÃO ENCONTRADA" : "MAPA TÁTICO"}
              </text>

              <text
                x="500"
                y="333"
                textAnchor="middle"
                fill="#555d6a"
                fontSize="14"
              >
                {mapName.toUpperCase()} · ADICIONA O MINIMAPA EM PUBLIC/MAPS
              </text>
            </g>
          )}

          {board.paths.map((path, i) => (
            <polyline
              key={i}
              points={path
                .map((p) => `${p.x * 10},${p.y * 6.4}`)
                .join(" ")}
              fill="none"
              stroke="#e53945"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              markerEnd="url(#arrow)"
            />
          ))}

          {board.markers.map((m) => (
            <g key={m.id}>
              <circle
                cx={m.x * 10}
                cy={m.y * 6.4}
                r="22"
                fill="#e53945"
                stroke="#fff"
                strokeWidth="3"
              />

              <text
                x={m.x * 10}
                y={m.y * 6.4 + 6}
                textAnchor="middle"
                fill="#fff"
                fontSize="17"
                fontWeight="bold"
              >
                {m.label.slice(0, 4)}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <p className="privacy-note">
        Minimapa carregado através do catálogo comunitário Valorant-API.
        VALORANT pertence à Riot Games.
      </p>

      <label className="board-notes">
        Notas táticas
        <textarea
          rows={3}
          value={board.notes}
          onChange={(e) =>
            setBoard((b) => ({
              ...b,
              notes: e.target.value,
            }))
          }
          disabled={!canEdit}
          placeholder="Plano de execução, utilitários, timings e callouts..."
        />
      </label>

      {canEdit && (
        <button
          className="button button-red"
          type="button"
          onClick={save}
        >
          <Save size={16} /> Guardar estratégia
        </button>
      )}

      {status && (
        <p className="form-message" role="status">
          {status}
        </p>
      )}
    </div>
  );
}
