// original source: https://github.com/SegFaultx64/typescript-graph
// previous fork: https://github.com/sroussey/typescript-graph
// license: MIT

import { describe, expect, it } from "bun:test";
import { edgeIdentity } from "./graph.test";
import { Graph, DirectedGraph, DirectedAcyclicGraph } from "@podley/util";

describe("The Readme", () => {
  it("runs the first example correctly", () => {
    // Identify the node type to be used with the graph
    interface NodeType {
      name: string;
      count: number;
      metadata: Record<string, string>;
    }
    // Define a custom identity function with which to identify nodes
    const graph = new Graph<NodeType, undefined, string, string>(
      (n: NodeType) => n.name,
      (edge, node1Identity, node2Identity) => `${node1Identity}-${node2Identity}-${edge}` as string
    );

    // Insert nodes into the graph
    const node1 = graph.insert({ name: "node1", count: 45, metadata: { color: "green" } });
    const node2 = graph.insert({
      name: "node2",
      count: 5,
      metadata: { color: "red", style: "normal" },
    });
    const node3 = graph.insert({
      name: "node3",
      count: 15,
      metadata: { color: "blue", size: "large" },
    });

    // Add edges between the nodes we created.
    graph.addEdge(node1, node2);
    graph.addEdge(node2, node3);

    const node: NodeType | undefined = graph.getNode(node2);

    expect(graph).toBeInstanceOf(Graph);
    expect(node).toBeDefined();
    expect(node?.count).toEqual(5);
  });

  it("runs the second example correctly", () => {
    // Create the graph
    interface NodeType {
      name: string;
      count: number;
    }
    const graph = new DirectedGraph<NodeType>((n: NodeType) => n.name, edgeIdentity);

    // Insert nodes into the graph
    const node1 = graph.insert({ name: "node1", count: 45 });
    const node2 = graph.insert({ name: "node2", count: 5 });
    const node3 = graph.insert({ name: "node3", count: 15 });

    // Check for cycles
    expect(graph.isAcyclic()).toBe(true); // true

    // Add edges between the nodes we created.
    graph.addEdge(node1, node2);
    graph.addEdge(node2, node3);

    // Check for cycles again
    expect(graph.isAcyclic()).toBe(true); // still true

    // Converts the graph into one that enforces acyclicality
    const dag = DirectedAcyclicGraph.fromDirectedGraph(graph);

    // Try to add an edge that will cause an cycle
    expect(() => {
      dag.addEdge(node3, node1);
    }).toThrow(); // throws an exception

    // You can add the edge that would cause a cycle on the preview graph
    graph.addEdge(node3, node1);

    // Check for cycles again
    expect(graph.isAcyclic()).toBe(false); // now false

    expect(() => DirectedAcyclicGraph.fromDirectedGraph(graph)).toThrow(); // now throws an exception because graph is not acyclic
  });

  it("runs the third example correctly", () => {
    // Create the graph
    interface NodeType {
      name: string;
    }
    const graph = new DirectedAcyclicGraph<NodeType>((n: NodeType) => n.name, edgeIdentity);

    // Insert nodes into the graph
    const node1 = graph.insert({ name: "node1" });
    const node2 = graph.insert({ name: "node2" });
    const node3 = graph.insert({ name: "node3" });
    const node4 = graph.insert({ name: "node4" });
    const node5 = graph.insert({ name: "node5" });

    // Add edges
    graph.addEdge(node1, node2);
    graph.addEdge(node2, node4);
    graph.addEdge(node1, node3);
    graph.addEdge(node3, node5);
    graph.addEdge(node5, node4);

    // Get the nodes in topologically sorted order
    expect(graph.topologicallySortedNodes()).toEqual([
      { name: "node1" },
      { name: "node3" },
      { name: "node5" },
      { name: "node2" },
      { name: "node4" },
    ]);
  });
});
