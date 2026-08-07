# Grid Diagrams

Grid diagrams let you display objects in a structured grid.

```d2
grid-rows: 5
style.fill: black

classes: {
  white square: {
    label: ""
    width: 120
    style: {
      fill: white
      stroke: cornflowerblue
      stroke-width: 10
    }
  }
  block: {
    style: {
      text-transform: uppercase
      font-color: white
      fill: darkcyan
      stroke: black
    }
  }
}

flow1.class: white square
flow2.class: white square
flow3.class: white square
flow4.class: white square
flow5.class: white square
flow6.class: white square
flow7.class: white square
flow8.class: white square
flow9.class: white square

dagger engine: {
  width: 800
  class: block
  style: {
    fill: beige
    stroke: darkcyan
    font-color: blue
    stroke-width: 8
  }
}

any docker compatible runtime: {
  width: 800
  class: block
  style: {
    fill: lightcyan
    stroke: darkcyan
    font-color: black
    stroke-width: 8
  }
  icon: https://icons.d2lang.com/dev%2Fdocker.svg
}

any ci: {
  class: block
  style: {
    fill: gold
    stroke: maroon
    font-color: maroon
    stroke-width: 8
  }
}
windows.class: block
linux.class: block
macos.class: block
kubernetes.class: block
```

Two keywords do all the magic:

- `grid-rows`
- `grid-columns`

Setting just `grid-rows`:

```d2
grid-rows: 3
Executive
Legislative
Judicial
```

Setting just `grid-columns`:

```d2
grid-columns: 3
Executive
Legislative
Judicial
```

Setting both `grid-rows` and `grid-columns`:

```d2
grid-rows: 2
grid-columns: 2
Executive
Legislative
Judicial
```

## Width and height

To create specific constructions, use `width` and/or `height`.

```d2
grid-rows: 2
Executive
Legislative
Judicial
The American Government.width: 400
```

Notice how objects are evenly distributed within each row.

## Cells expand to fill

When you define only one of row or column, objects will expand.

```d2
grid-rows: 3
Executive
Legislative
Judicial
The American Government.width: 400
Voters
Non-voters
```

Notice how `Voters` and `Non-voters` fill the space.

## Dominant direction

When you apply both row and column, the first appearance is the dominant direction. The
dominant direction is the order in which cells are filled.

For example:

```d2-incomplete
grid-rows: 4
grid-columns: 2
# bunch of shapes
```

Since `grid-rows` is defined first, objects will fill rows before moving onto columns.

But if it were reversed:

```d2-incomplete
grid-columns: 2
grid-rows: 4
# bunch of shapes
```

It would do the opposite.

> [!NOTE]
> These animations are also pure D2, so you can animate grid diagrams being built-up. Use
> the `animate-interval` flag with this
> [code](https://github.com/d2lang/d2-docs/blob/f5c762223ce192338d9d7865df3ca8533d683cdc/static/bespoke-d2/grid-row-dominant.d2#L1).
> More on this later, in the [composition](/tour/composition/) section.

## Gap size

You can control the gap size of the grid with 3 keywords:

- `vertical-gap`
- `horizontal-gap`
- `grid-gap`

Setting `grid-gap` is equivalent to setting both `vertical-gap` and `horizontal-gap`.

`vertical-gap` and `horizontal-gap` can override `grid-gap`.

### Gap size 0

`grid-gap: 0` in particular can create some interesting constructions:

#### Like this map of Japan

> [D2 source](https://github.com/d2lang/d2/blob/master/docs/examples/japan-grid/japan.d2)

#### Or a table of data

```d2
# Specified so that objects are written in row-dominant order
grid-rows: 2
grid-columns: 4
grid-gap: 0

classes: {
  header: {
    style.underline: true
  }
}

Element.class: header
Atomic Number.class: header
Atomic Mass.class: header
Melting Point.class: header

Hydrogen
1
"1.008"
"-259.16"

Carbon
6
"12.011"
3500

Oxygen
8
"15.999"
"-218.79"
```

> [!NOTE]
> You may find it easier to just use Markdown tables though, especially if there are
> duplicate cells.

```d2
savings: ||md
  | Month    | Savings | Expenses | Balance |
  | -------- | ------- | -------- | ------- |
  | January  | $250    | $150     | $100    |
  | February | $80     | $200     | -$120   |
  | March    | $420    | $180     | $240    |
||
```

## Connections

Connections for grids themselves work normally as you'd expect.

> Source code [here](https://github.com/d2lang/d2-docs/blob/eda2d8739ce21c656e7608be48cb9067df36eb53/static/d2/grid-connected.d2).

### Connections between grid cells

Connections between shapes inside a grid work a bit differently. Because a grid structure
imposes positioning outside what the layout engine controls, the layout engine is also
unable to make routes. Therefore, these connections are center-center straight segments,
i.e., no path-finding.

> Source code [here](https://github.com/d2lang/d2/blob/master/e2etests/testdata/files/simple_grid_edges.d2).

> Source code [here](https://github.com/d2lang/d2/blob/master/docs/examples/vector-grid/vector-grid.d2).

## Nesting

Currently you can nest grid diagrams within grid diagrams. Nesting other types is coming
soon.

```d2
grid-gap: 0
grid-columns: 1
header
body: "" {
  grid-gap: 0
  grid-columns: 2
  content
  sidebar
}
footer
```

## Aligning with invisible elements

A common technique to align grid elements to your liking is to pad the grid with invisible
elements.

Consider the following diagram.

```d2
grid-columns: 1
us-east-1: {
  grid-rows: 1
  a
  b
  c
  d
  e
}

us-west-1: {
  grid-rows: 1
  a
}

us-east-1.c -> us-west-1.a
```

It'd be nicer if it were centered. This can be achieved by adding 2 invisible elements.

```d2
classes: {
  invisible: {
    style.opacity: 0
    label: a
  }
}

grid-columns: 1
us-east-1: {
  grid-rows: 1
  a
  b
  c
  d
  e
}

us-west-1: {
  grid-rows: 1
  pad1.class: invisible
  pad2.class: invisible
  a
  # Move the label so it doesn't go through the connection
  label.near: bottom-center
}

us-east-1.c -> us-west-1.a
```

## Troubleshooting

### Why is there extra padding in one cell?

Elements in a grid column have the same width and elements in a grid row have the same
height.

So in this example, a small empty space in "Backend Node" is present.

```d2
classes: {
  kuber: {
    style: {
      fill: "white"
      stroke: "#aeb5bd"
      border-radius: 4
      stroke-dash: 3
    }
  }
  sys: {
    label: ""
    style: {
      fill: "#AFBFDF"
      stroke: "#aeb5bd"
    }
  }
  node: {
    grid-gap: 0
    style: {
      fill: "#ebf3e6"
      border-radius: 8
      stroke: "#aeb5bd"
    }
  }
  clust: {
    style: {
      fill: "#A7CC9E"
      stroke: "#aeb5bd"
    }
  }
  deploy: {
    grid-gap: 0
    style: {
      fill: "#ffe6d5"
      stroke: "#aeb5bd"
      # border-radius: 4
    }
  }
  nextpod: {
    icon: https://www.svgrepo.com/show/378440/nextjs-fill.svg
    style: {
      fill: "#ECECEC"
      stroke: "#aeb5bd"
      # border-radius: 4
    }
  }
  flaskpod: {
    icon: https://www.svgrepo.com/show/508915/flask.svg
    style: {
      fill: "#ECECEC"
      stroke: "#aeb5bd"
      # border-radius: 4
    }
  }
}

classes

Kubernetes: {
  grid-columns: 2
  system: {
    grid-columns: 1
    Backend Node: {
      grid-columns: 2
      ClusterIP\nService 1
      Deployment 1: {
        grid-rows: 3
        NEXT POD 1
        NEXT POD 2
        NEXT POD 3
      }
    }
    Frontend Node: {
      grid-columns: 2
      ClusterIP\nService 2
      Deployment 2: {
        grid-rows: 3
        FLASK POD 1
        FLASK POD 2
        FLASK POD 3
      }
    }
  }
}

kubernetes.class: kuber
kubernetes.system.class: sys

kubernetes.system.backend node.class: node
kubernetes.system.backend node.clusterip\nservice 1.class: clust
kubernetes.system.backend node.deployment 1.class: deploy
kubernetes.system.backend node.deployment 1.next pod*.class: nextpod

kubernetes.system.frontend node.class: node
kubernetes.system.frontend node.clusterip\nservice 2.class: clust
kubernetes.system.frontend node.deployment 2.class: deploy
kubernetes.system.frontend node.deployment 2.flask pod*.class: flaskpod
```

It's due to the label of "Flask Pod" being slightly longer than "Next Pod". So the way we
fix that is to set `width`s to match.

```d2
classes: {
  kuber: {
    style: {
      fill: "white"
      stroke: "#aeb5bd"
      border-radius: 4
      stroke-dash: 3
    }
  }
  sys: {
    label: ""
    style: {
      fill: "#AFBFDF"
      stroke: "#aeb5bd"
    }
  }
  node: {
    grid-gap: 0
    style: {
      fill: "#ebf3e6"
      border-radius: 8
      stroke: "#aeb5bd"
    }
  }
  clust: {
    style: {
      fill: "#A7CC9E"
      stroke: "#aeb5bd"
    }
  }
  deploy: {
    grid-gap: 0
    style: {
      fill: "#ffe6d5"
      stroke: "#aeb5bd"
      # border-radius: 4
    }
  }
  nextpod: {
    width: 180
    icon: https://www.svgrepo.com/show/378440/nextjs-fill.svg
    style: {
      fill: "#ECECEC"
      stroke: "#aeb5bd"
      # border-radius: 4
    }
  }
  flaskpod: {
    width: 180
    icon: https://www.svgrepo.com/show/508915/flask.svg
    style: {
      fill: "#ECECEC"
      stroke: "#aeb5bd"
      # border-radius: 4
    }
  }
}

classes

Kubernetes: {
  grid-columns: 2
  system: {
    grid-columns: 1
    Backend Node: {
      grid-columns: 2
      ClusterIP\nService 1
      Deployment 1: {
        grid-rows: 3
        NEXT POD 1
        NEXT POD 2
        NEXT POD 3
      }
    }
    Frontend Node: {
      grid-columns: 2
      ClusterIP\nService 2
      Deployment 2: {
        grid-rows: 3
        FLASK POD 1
        FLASK POD 2
        FLASK POD 3
      }
    }
  }
}

kubernetes.class: kuber
kubernetes.system.class: sys

kubernetes.system.backend node.class: node
kubernetes.system.backend node.clusterip\nservice 1.class: clust
kubernetes.system.backend node.deployment 1.class: deploy
kubernetes.system.backend node.deployment 1.next pod*.class: nextpod

kubernetes.system.frontend node.class: node
kubernetes.system.frontend node.clusterip\nservice 2.class: clust
kubernetes.system.frontend node.deployment 2.class: deploy
kubernetes.system.frontend node.deployment 2.flask pod*.class: flaskpod
```
