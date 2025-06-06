// original source: https://github.com/SegFaultx64/typescript-graph
// previous fork: https://github.com/sroussey/typescript-graph
// license: MIT

import { Graph, NodeAlreadyExistsError, NodeDoesntExistError, serialize } from "@podley/util";
import { hash } from "bun";
import { describe, expect, it } from "bun:test";

export const nodeIdentity = (n: any) => hash(serialize(n as Record<string, any>)).toString(16);
export const edgeIdentity = (edge: any, node1Identity: any, node2Identity: any) => {
  const h1 =
    typeof edge === "object" ? hash(serialize(edge as Record<string, any>)).toString(16) : "";
  return `${String(node1Identity)}-${String(node2Identity)}-${h1}`;
};

/***
 * Graph test
 */

describe("Graph", () => {
  it("can be instantiated", () => {
    expect(new Graph<Record<string, any>>(nodeIdentity, edgeIdentity)).toBeInstanceOf(Graph);
    expect(
      new Graph<Record<string, any>, Record<string, any>>(nodeIdentity, edgeIdentity)
    ).toBeInstanceOf(Graph);
    expect(
      new Graph<Record<string, any>, Record<string, any>, string, string>(
        nodeIdentity,
        edgeIdentity
      )
    ).toBeInstanceOf(Graph);
  });

  it("can add a node", () => {
    const graph = new Graph<{ a: number; b: string }, undefined, string, string>(
      (node) => nodeIdentity(node),
      (edge, node1Identity, node2Identity) => `${node1Identity}-${node2Identity}-${edge}` as string
    );

    graph.insert({ a: 1, b: "b" });

    expect((graph as any).nodes.size).toBe(1);
    expect((graph as any).adjacency.length).toBe(1);
    expect((graph as any).adjacency[0].length).toBe(1);

    expect(() => {
      graph.insert({ a: 1, b: "b" });
    }).toThrow(NodeAlreadyExistsError);
    expect((graph as any).nodes.size).toBe(1);
    expect((graph as any).adjacency.length).toBe(1);
    expect((graph as any).adjacency[0].length).toBe(1);
  });

  it("can remove a node", () => {
    const graph = new Graph<{ a: number; b: string }>(nodeIdentity, edgeIdentity);

    graph.insert({ a: 1, b: "b" });

    expect((graph as any).nodes.size).toBe(1);
    expect((graph as any).adjacency.length).toBe(1);
    expect((graph as any).adjacency[0].length).toBe(1);

    graph.remove(nodeIdentity({ a: 1, b: "b" }));

    expect((graph as any).nodes.size).toBe(0);
    expect((graph as any).adjacency.length).toBe(0);
  });

  it("can add a node with custom identity function", () => {
    interface NodeType {
      a: number;
      b: string;
    }
    const graph = new Graph<NodeType>((n: NodeType) => n.a.toFixed(2), edgeIdentity);

    graph.insert({ a: 1, b: "b" });

    expect((graph as any).nodes.size).toBe(1);
    expect((graph as any).adjacency.length).toBe(1);
    expect((graph as any).adjacency[0].length).toBe(1);

    expect(() => {
      graph.insert({ a: 1, b: "not b" });
    }).toThrow(NodeAlreadyExistsError);
    expect(() => {
      graph.insert({ a: 1.0007, b: "not b" });
    }).toThrow(NodeAlreadyExistsError);

    expect((graph as any).nodes.size).toBe(1);
    expect((graph as any).adjacency.length).toBe(1);
    expect((graph as any).adjacency[0].length).toBe(1);

    graph.insert({ a: 2, b: "not b" });

    expect((graph as any).nodes.size).toBe(2);
    expect((graph as any).adjacency.length).toBe(2);
    expect((graph as any).adjacency[0].length).toBe(2);
  });

  it("can replace a node", () => {
    const graph = new Graph<{ a: number; b: string }>(nodeIdentity, edgeIdentity);

    graph.insert({ a: 1, b: "b" });
    graph.replace({ a: 1, b: "b" });

    expect(() => {
      graph.replace({ a: 1, b: "c1" });
    }).toThrow(NodeDoesntExistError);
    expect((graph as any).nodes.get(nodeIdentity({ a: 1, b: "c" }))).toBeUndefined();

    expect((graph as any).nodes.size).toBe(1);
    expect((graph as any).adjacency.length).toBe(1);
    expect((graph as any).adjacency[0].length).toBe(1);
    expect((graph as any).nodes.get(nodeIdentity({ a: 1, b: "b" }))).toEqual({
      a: 1,
      b: "b",
    });
  });

  it("can replace a node with custom identity function", () => {
    interface NodeType {
      a: number;
      b: string;
    }
    const graph = new Graph<NodeType>((n: NodeType) => n.a.toFixed(2), edgeIdentity);

    graph.insert({ a: 1, b: "b" });
    graph.replace({ a: 1, b: "not b" });

    expect((graph as any).nodes.size).toBe(1);
    expect((graph as any).adjacency.length).toBe(1);
    expect((graph as any).adjacency[0].length).toBe(1);
    expect((graph as any).nodes.get("1.00")).toBeDefined();
    expect((graph as any).nodes.get("1.00")).toEqual({ a: 1, b: "not b" });

    graph.replace({ a: 1.0007, b: "not b" });

    expect((graph as any).nodes.size).toBe(1);
    expect((graph as any).adjacency.length).toBe(1);
    expect((graph as any).adjacency[0].length).toBe(1);
    expect((graph as any).nodes.get("1.00")).toBeDefined();
    expect((graph as any).nodes.get("1.00")).toEqual({ a: 1.0007, b: "not b" });

    expect(() => {
      graph.replace({ a: 2.5, b: "c" });
    }).toThrow(NodeDoesntExistError);
    expect((graph as any).nodes.get("2.50")).toBeUndefined();
  });

  it("can upsert a node", () => {
    interface NodeType {
      a: number;
      b: string;
    }
    const graph = new Graph<NodeType>((n: NodeType) => n.a.toFixed(2), edgeIdentity);

    graph.insert({ a: 1, b: "b" });
    graph.upsert({ a: 1, b: "not b" });

    expect((graph as any).nodes.size).toBe(1);
    expect((graph as any).adjacency.length).toBe(1);
    expect((graph as any).adjacency[0].length).toBe(1);
    expect((graph as any).nodes.get("1.00")).toBeDefined();
    expect((graph as any).nodes.get("1.00")).toEqual({ a: 1, b: "not b" });

    graph.upsert({ a: 2.5, b: "super not b" });

    expect((graph as any).nodes.size).toBe(2);
    expect((graph as any).adjacency.length).toBe(2);
    expect((graph as any).adjacency[0].length).toBe(2);
    expect((graph as any).nodes.get("2.50")).toBeDefined();
    expect((graph as any).nodes.get("2.50")).toEqual({ a: 2.5, b: "super not b" });
  });

  it("can add an edge", () => {
    interface NodeType {
      a: number;
      b: string;
    }
    const graph = new Graph<NodeType>((n: NodeType) => n.a.toFixed(2), edgeIdentity);

    graph.insert({ a: 1, b: "b" });

    expect(() => {
      graph.addEdge("3.00", "2.00");
    }).toThrow(NodeDoesntExistError);
    expect(() => {
      graph.addEdge("1.00", "2.00");
    }).toThrow(NodeDoesntExistError);
    expect(() => {
      graph.addEdge("2.00", "1.00");
    }).toThrow(NodeDoesntExistError);

    graph.insert({ a: 2, b: "b" });
    graph.insert({ a: 3, b: "b" });
    graph.insert({ a: 4, b: "b" });

    graph.addEdge("1.00", "2.00");
    expect((graph as any).adjacency[0][1]).toBeTruthy();
    expect((graph as any).adjacency[1][0]).toBeFalsy();
    expect((graph as any).adjacency[1][2]).toBeFalsy();

    graph.addEdge("2.00", "1.00");
    expect((graph as any).adjacency[0][1]).toBeTruthy();
    expect((graph as any).adjacency[1][0]).toBeTruthy();
    expect((graph as any).adjacency[1][2]).toBeFalsy();
  });

  it("can remove an edge", () => {
    interface NodeType {
      a: number;
      b: string;
    }
    const graph = new Graph<NodeType>((n: NodeType) => n.a.toFixed(2), edgeIdentity);

    graph.insert({ a: 1, b: "b" });
    graph.insert({ a: 2, b: "b" });
    graph.insert({ a: 3, b: "b" });
    graph.insert({ a: 4, b: "b" });

    graph.addEdge("1.00", "2.00");
    expect((graph as any).adjacency[0][1]).toBeTruthy();
    expect((graph as any).adjacency[1][0]).toBeFalsy();
    expect((graph as any).adjacency[1][2]).toBeFalsy();

    graph.addEdge("2.00", "1.00");
    expect((graph as any).adjacency[0][1]).toBeTruthy();
    expect((graph as any).adjacency[1][0]).toBeTruthy();
    expect((graph as any).adjacency[1][2]).toBeFalsy();

    graph.removeEdge("1.00", "2.00");
    graph.removeEdge("2.00", "1.00");
    expect((graph as any).adjacency[0][1]).toBeFalsy();
    expect((graph as any).adjacency[1][0]).toBeFalsy();
    expect((graph as any).adjacency[1][2]).toBeFalsy();
  });

  it("can deal with multiple edges", () => {
    interface NodeType {
      a: number;
      b: string;
    }
    interface EdgeType {
      c: string;
    }
    const graph = new Graph<NodeType, EdgeType>((n: NodeType) => n.a.toFixed(2), edgeIdentity);

    graph.insert({ a: 1, b: "b" });
    graph.insert({ a: 2, b: "b" });
    graph.insert({ a: 3, b: "b" });
    graph.insert({ a: 4, b: "b" });

    graph.addEdge("1.00", "2.00", { c: "c1" });
    expect((graph as any).adjacency[0][1]).toBeTruthy();
    expect((graph as any).adjacency[1][0]).toBeFalsy();
    expect((graph as any).adjacency[1][2]).toBeFalsy();

    graph.addEdge("2.00", "1.00", { c: "c2" });
    expect((graph as any).adjacency[0][1]).toBeTruthy();
    expect((graph as any).adjacency[1][0]).toBeTruthy();
    expect((graph as any).adjacency[1][2]).toBeFalsy();

    graph.addEdge("2.00", "1.00", { c: "c3" });

    expect((graph.nodeEdges("1.00") as any).length).toBe(3);
    expect((graph.nodeEdges("3.00") as any).length).toBe(0);
    expect((graph.outEdges("2.00") as any).length).toBe(2);
    expect((graph.inEdges("1.00") as any).length).toBe(2);
    expect((graph.inEdges("2.00") as any).length).toBe(1);
    expect((graph.getEdges() as any).length).toBe(3);

    graph.removeEdge("1.00", "2.00");
    graph.removeEdge("2.00", "1.00");
    expect((graph as any).adjacency[0][1]).toBeFalsy();
    expect((graph as any).adjacency[1][0]).toBeFalsy();
    expect((graph as any).adjacency[1][2]).toBeFalsy();
  });

  it("can return the nodes", () => {
    interface NodeType {
      a: number;
      b: string;
    }
    const graph = new Graph<NodeType>((n: NodeType) => n.a.toFixed(2), edgeIdentity);

    graph.insert({ a: 1, b: "b" });

    expect(graph.getNodes()).toEqual([{ a: 1, b: "b" }]);

    graph.insert({ a: 2, b: "b" });
    graph.insert({ a: 3, b: "b" });
    graph.insert({ a: 4, b: "b" });

    expect(graph.getNodes()).toContainEqual({ a: 1, b: "b" });
    expect(graph.getNodes()).toContainEqual({ a: 2, b: "b" });
    expect(graph.getNodes()).toContainEqual({ a: 3, b: "b" });
    expect(graph.getNodes()).toContainEqual({ a: 4, b: "b" });
  });

  it("can return the nodes sorted", () => {
    interface NodeType {
      a: number;
      b: string;
    }
    const graph = new Graph<NodeType>((n: NodeType) => n.a.toFixed(2), edgeIdentity);

    graph.insert({ a: 2, b: "b" });
    graph.insert({ a: 4, b: "b" });
    graph.insert({ a: 1, b: "b" });
    graph.insert({ a: 3, b: "b" });

    expect(graph.getNodes((a, b) => a.a - b.a)).toEqual([
      { a: 1, b: "b" },
      { a: 2, b: "b" },
      { a: 3, b: "b" },
      { a: 4, b: "b" },
    ]);
  });

  it("can get a specific node", () => {
    interface NodeType {
      a: number;
      b: string;
    }
    const identityfn = (n: NodeType): string => n.a.toFixed(2);
    const graph = new Graph<NodeType>(identityfn, edgeIdentity);

    const inputToRetrieve = { a: 1, b: "c" };

    graph.insert({ a: 2, b: "b" });
    graph.insert({ a: 4, b: "b" });
    graph.insert(inputToRetrieve);
    graph.insert({ a: 3, b: "b" });

    expect(graph.getNode(identityfn(inputToRetrieve))).toBeDefined();
    expect(graph.getNode(identityfn(inputToRetrieve))).toEqual(inputToRetrieve);
    expect(graph.getNode("nonsense")).toBeUndefined();
  });
});
