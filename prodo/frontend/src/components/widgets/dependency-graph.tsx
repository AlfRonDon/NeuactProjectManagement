"use client";

import React, { useEffect, useRef, useState } from "react";
import { GitBranch, AlertTriangle } from "lucide-react";
import {
  STATUS_COLOR_HEX, PRIORITY_BORDER_HEX, NEUTRAL, STATUS_HEX, FOUNDATION, FONT_SANS,
} from "@/design";

interface GraphNode {
  id: string;
  label: string;
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  estimatedHours?: number;
  assignee?: string;
}

interface GraphEdge {
  from: string;
  to: string;
}

interface DependencyGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
  criticalPath?: string[];
}

// Canvas 2D cannot resolve CSS var() — use hex values from design palette.
const STATUS_COLOR = STATUS_COLOR_HEX;
const PRIORITY_BORDER = PRIORITY_BORDER_HEX;

export default function DependencyGraph({ data }: { data: DependencyGraphData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const positionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Simple layered layout (topological sort then position)
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = container.clientWidth;
    const H = 400;
    canvas.width = W * 2; // retina
    canvas.height = H * 2;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(2, 2);

    // Topological layering
    const inDegree = new Map<string, number>();
    const adj = new Map<string, string[]>();
    data.nodes.forEach((n) => {
      inDegree.set(n.id, 0);
      adj.set(n.id, []);
    });
    data.edges.forEach((e) => {
      adj.get(e.from)?.push(e.to);
      inDegree.set(e.to, (inDegree.get(e.to) || 0) + 1);
    });

    const layers: string[][] = [];
    const visited = new Set<string>();
    let queue = data.nodes.filter((n) => (inDegree.get(n.id) || 0) === 0).map((n) => n.id);

    while (queue.length > 0) {
      layers.push([...queue]);
      queue.forEach((id) => visited.add(id));
      const nextQueue: string[] = [];
      queue.forEach((id) => {
        adj.get(id)?.forEach((to) => {
          const newDeg = (inDegree.get(to) || 1) - 1;
          inDegree.set(to, newDeg);
          if (newDeg === 0 && !visited.has(to)) {
            nextQueue.push(to);
          }
        });
      });
      queue = nextQueue;
    }

    // Add any unvisited nodes (cycles)
    const remaining = data.nodes.filter((n) => !visited.has(n.id)).map((n) => n.id);
    if (remaining.length > 0) layers.push(remaining);

    // Position nodes
    const positions = new Map<string, { x: number; y: number }>();
    const nodeMap = new Map(data.nodes.map((n) => [n.id, n]));
    const padX = 80;
    const padY = 50;
    const layerWidth = (W - padX * 2) / Math.max(layers.length - 1, 1);

    layers.forEach((layer, li) => {
      const layerHeight = (H - padY * 2) / Math.max(layer.length - 1, 1);
      layer.forEach((id, ni) => {
        positions.set(id, {
          x: padX + li * layerWidth,
          y: layer.length === 1 ? H / 2 : padY + ni * layerHeight,
        });
      });
    });
    positionsRef.current = positions;

    const critSet = new Set(data.criticalPath || []);

    // Draw
    ctx.clearRect(0, 0, W, H);

    // Edges
    data.edges.forEach((e) => {
      const from = positions.get(e.from);
      const to = positions.get(e.to);
      if (!from || !to) return;

      const isCritical = critSet.has(e.from) && critSet.has(e.to);
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);

      // Bezier curve
      const cx1 = from.x + (to.x - from.x) * 0.4;
      const cx2 = from.x + (to.x - from.x) * 0.6;
      ctx.bezierCurveTo(cx1, from.y, cx2, to.y, to.x, to.y);

      ctx.strokeStyle = isCritical ? STATUS_HEX.bad.solid : FOUNDATION.borderSubtle;
      ctx.lineWidth = isCritical ? 2 : 1;
      ctx.stroke();

      // Arrow head
      const angle = Math.atan2(to.y - from.y, to.x - from.x);
      const arrowLen = 8;
      ctx.beginPath();
      ctx.moveTo(to.x - 20 * Math.cos(angle), to.y - 20 * Math.sin(angle));
      ctx.lineTo(
        to.x - 20 * Math.cos(angle) - arrowLen * Math.cos(angle - 0.4),
        to.y - 20 * Math.sin(angle) - arrowLen * Math.sin(angle - 0.4)
      );
      ctx.moveTo(to.x - 20 * Math.cos(angle), to.y - 20 * Math.sin(angle));
      ctx.lineTo(
        to.x - 20 * Math.cos(angle) - arrowLen * Math.cos(angle + 0.4),
        to.y - 20 * Math.sin(angle) - arrowLen * Math.sin(angle + 0.4)
      );
      ctx.strokeStyle = isCritical ? STATUS_HEX.bad.solid : FOUNDATION.borderStrong;
      ctx.lineWidth = isCritical ? 2 : 1;
      ctx.stroke();
    });

    // Nodes
    data.nodes.forEach((node) => {
      const pos = positions.get(node.id);
      if (!pos) return;

      const r = node.estimatedHours ? Math.min(12 + node.estimatedHours * 1.5, 28) : 16;
      const isCritical = critSet.has(node.id);
      const isHovered = hoveredNode === node.id;

      // Glow for critical path
      if (isCritical) {
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r + 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(239, 68, 68, 0.10)";
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, isHovered ? r + 2 : r, 0, Math.PI * 2);
      ctx.fillStyle = STATUS_COLOR[node.status] || NEUTRAL[200];
      ctx.fill();
      ctx.strokeStyle = PRIORITY_BORDER[node.priority] || NEUTRAL[500];
      ctx.lineWidth = node.priority === "critical" ? 3 : node.priority === "high" ? 2 : 1;
      ctx.stroke();

      // Label
      ctx.fillStyle = FOUNDATION.textPrimary;
      ctx.font = `bold 9px ${FONT_SANS}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      const label = node.label.length > 20 ? node.label.slice(0, 18) + "..." : node.label;
      ctx.fillText(label, pos.x, pos.y + r + 4);

      // Assignee
      if (node.assignee) {
        ctx.fillStyle = FOUNDATION.textTertiary;
        ctx.font = `8px ${FONT_SANS}`;
        ctx.fillText(node.assignee, pos.x, pos.y + r + 15);
      }
    });
  }, [data, hoveredNode]);

  // Mouse hover
  const handleMouseMove = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let found: string | null = null;
    positionsRef.current.forEach((pos, id) => {
      const dx = pos.x - x;
      const dy = pos.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        found = id;
      }
    });
    setHoveredNode(found);
  };

  const blockers = data.nodes.filter(
    (n) =>
      data.criticalPath?.includes(n.id) &&
      !["done", "cancelled"].includes(n.status)
  );

  return (
    <div className="bg-white rounded-lg border border-neutral-200 shadow-xsmall p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-neutral-400" />
          <h3 className="text-xs uppercase font-bold tracking-widest text-neutral-400">
            Dependency Graph
          </h3>
        </div>
        {blockers.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-bad-fg bg-bad-bg px-2 py-1 rounded border border-bad-solid/20 font-medium">
            <AlertTriangle className="w-3 h-3" />
            {blockers.length} blocking on critical path
          </div>
        )}
      </div>

      <div ref={containerRef} className="relative">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredNode(null)}
          className="w-full cursor-crosshair"
          style={{ height: 400 }}
        />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-neutral-100">
        <div className="flex items-center gap-1">
          <div className="w-8 h-0.5 bg-bad-solid" />
          <span className="text-xs text-neutral-400">Critical path</span>
        </div>
        {["todo", "in_progress", "done"].map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLOR[s] }} />
            <span className="text-xs text-neutral-400 capitalize">{s.replace("_", " ")}</span>
          </div>
        ))}
        <span className="text-xs text-neutral-300 ml-auto">Node size = estimated hours</span>
      </div>
    </div>
  );
}
