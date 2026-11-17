import { useMemo } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType,
  type NodeProps,
  type Node,
  type Edge,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import { visibleTree, type Chain, type DeviceNode } from "@/lib/predicate-chain";

type CardNode = Node<{ device: DeviceNode; subject: boolean }>;
function DeviceCard({ data }: NodeProps<CardNode>) {
  const n = data.device;
  const unextracted = n.stop?.toLowerCase().includes("not yet extracted");
  const role = data.subject
    ? "subject"
    : unextracted
      ? "unextracted"
      : n.role === "primary + reference" || n.role === "primary+reference"
        ? "combined"
        : n.role === "primary"
          ? "primary"
          : "reference";
  return (
    <div
      className={`tree-card ${role} ${n.stop ? "stopped" : ""} ${n.stop?.startsWith("TRUNCATED") ? "truncated" : ""}`}
    >
      <Handle type="target" position={Position.Top} />
      <div className="node-first">
        <span>{n.knumber}</span>
        <span>{n.decision_date?.slice(0, 4) ?? "—"}</span>
      </div>
      <div className="node-line" title={n.applicant}>
        {n.applicant}
      </div>
      <div className="node-line" title={n.device_name}>
        {n.device_name.length > 30 ? `${n.device_name.slice(0, 30)}…` : n.device_name}
      </div>
      {n.stop && (
        <div className="node-stop" title={n.stop}>
          STOP: {n.stop}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}
const nodeTypes = { device: DeviceCard };
export default function PredicateTree({
  chain,
  primaryOnly,
}: {
  chain: Chain;
  primaryOnly: boolean;
}) {
  const { nodes, edges } = useMemo(() => {
    const visible = visibleTree(chain, primaryOnly);
    const graph = new dagre.graphlib.Graph({ multigraph: true }).setDefaultEdgeLabel(() => ({}));
    graph.setGraph({ rankdir: "TB", nodesep: 38, ranksep: 100 });
    visible.nodes.forEach((n) => graph.setNode(n.knumber, { width: 232, height: 108 }));
    const ids = new Set(visible.nodes.map((n) => n.knumber));
    const valid = visible.edges.filter((e) => ids.has(e.child) && ids.has(e.predicate));
    valid.forEach((e, i) => graph.setEdge(e.child, e.predicate, {}, String(i)));
    dagre.layout(graph);
    const nodes: CardNode[] = visible.nodes.map((n) => {
      const p = graph.node(n.knumber);
      return {
        id: n.knumber,
        type: "device",
        position: { x: p.x - 116, y: p.y - 54 },
        data: { device: n, subject: chain.roots.includes(n.knumber) },
      };
    });
    const edges: Edge[] = valid.map((e, i) => ({
      id: `edge-${i}`,
      source: e.child,
      target: e.predicate,
      type: "smoothstep",
      className: `${e.role === "reference" ? "reference" : ""} ${e.confidence === "LOW" && e.review_source === "parser" ? "low" : ""}`,
      markerEnd: { type: MarkerType.ArrowClosed },
      label: [
        e.confidence === "LOW" && e.review_source === "parser" ? "LOW" : "",
        e.number_as_printed != null ? `corrected from ${e.number_as_printed}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
    }));
    return { nodes, edges };
  }, [chain, primaryOnly]);
  return (
    <ReactFlowProvider>
      <ReactFlow
        key={primaryOnly ? "primary" : "full"}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.05}
        maxZoom={2}
        nodesDraggable
        nodesConnectable={false}
        deleteKeyCode={null}
      >
        <Background gap={22} />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => {
            const device = n.data["device"] as DeviceNode;
            return `var(--${chain.roots.includes(n.id) ? "subject" : device.stop?.toLowerCase().includes("not yet extracted") ? "unextracted" : device.role === "primary" ? "predicate" : device.role?.includes("primary") && device.role?.includes("reference") ? "combined" : "reference"})`;
          }}
        />
      </ReactFlow>
    </ReactFlowProvider>
  );
}
