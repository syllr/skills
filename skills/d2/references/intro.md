# D2 Tour

**D2** is a diagram scripting language that turns text to diagrams. It stands for
**Declarative Diagramming**. Declarative, as in, you describe what you want diagrammed, it
generates the image.

For example, download the CLI, create a file named `input.d2`, copy paste the following,
run this command, and you get the image below.

```sh
d2 --theme=300 --dark-theme=200 -l elk --pad 0 ./input.d2
```

```d2
vars: {
  d2-config: {
    layout-engine: elk
    theme-id: 300
  }
}
network: {
  cell tower: { satellites: { shape: stored_data; style.multiple: true }; transmitter }
  online portal: { ui: {shape: hexagon} }
  data processor: { storage: { shape: cylinder; style.multiple: true } }
}
user: { shape: person; width: 130 }
user -> network.cell tower: make call
```

## Using the CLI watch mode

> 官方截图（CLI watch 演示）见 https://d2lang.com/tour/intro/。

You can finish this tour in about 5-10 minutes, and at the end, there's a cheat sheet you
can download and refer to. If you want just the bare essentials, [Getting Started](/tour/hello-world/) takes
~2 mins.

> [!NOTE]
> The source code for D2 is hosted here:
> [https://github.com/d2lang/d2](https://github.com/d2lang/d2).

The source code for these docs are here:
[https://github.com/d2lang/d2-docs](https://github.com/d2lang/d2-docs).

> [!NOTE]
> For each D2 snippet, you can hover over it to open directly in the Playground and tinker.

There's some exceptions like snippets that use imports.
