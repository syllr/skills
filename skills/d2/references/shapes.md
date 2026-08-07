# Shapes

## Basics

You can declare shapes like so:

```d2
imAShape
im_a_shape
im a shape
i'm a shape
# notice that one-hyphen is not a connection
# whereas, `a--shape` would be a connection
a-shape
```

You can also use semicolons to define multiple shapes on the same line:

```d2
SQLite; Cassandra
```

By default, a shape's label is the same as the shape's key. But if you want it to be different, assign a new label like so:

```d2
pg: PostgreSQL
```

By default, a shape's type is `rectangle`. To specify otherwise, provide the field `shape`:

```d2
Cloud: my cloud
Cloud.shape: cloud
```

## Example

```d2
pg: PostgreSQL
Cloud: my cloud
Cloud.shape: cloud
SQLite
Cassandra
```

> [!NOTE]
Keys are case-insensitive, so `postgresql` and `postgreSQL` will reference the same shape.

> [!NOTE] Shape catalog

There are other values that `shape` can take, but they're special types that are covered
in the next section.

## 1:1 Ratio shapes

Some shapes maintain a 1:1 aspect ratio, meaning their width and height are always equal.

- `circle`
- `square`

For these shapes, if you have a long label that make the shape wider, D2 will also make
the shape taller to maintain the 1:1 ratio.

If you manually set `width` and `height` on a 1:1 ratio shape, both dimensions will be set
to the larger of the two values to maintain the aspect ratio.
