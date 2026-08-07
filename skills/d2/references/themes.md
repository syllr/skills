# Themes

D2 comes with many themes that make your diagram look professional and ready to insert
into blogs and wikis.

（官方截图：主题预览 / mixed berry blue / vanilla nitro cola，见 https://d2lang.com/tour/themes/）

### They apply to special shapes like tables too

# Rendered with theme "Grape soda"

# Rendered with theme "Vanilla nitro cola"

## Setting theme on the CLI

To specify the theme used, you can set the flag `-t, --theme`.

```shell
d2 -t 101 input.d2
```

You can also use an environment variable.

```shell
D2_THEME=101 d2 input.d2
```

To see which themes are available, run

```shell
d2 themes
```

## Dark theme

Dark themes are not set by default, so your diagram will look the same regardless of
whether the user's system preferences are light or dark.

> [!NOTE]
> All diagrams in these docs have a dark theme. Try toggling your system preference between
> light and dark and see how it changes.

If you'd like your diagram to adapt and switch to a dark theme when the user's system
preference is dark, you can do so by specifying the following flag.

```shell
d2 --dark-theme 200 input.d2
```

Like regular themes, this can also be set with an environment variable.

```shell
D2_DARK_THEME=200 d2 input.d2
```

> [!NOTE]
> The themes are catalogued separately into light and dark, but there's nothing stopping you
> from passing a dark theme ID to `theme` for your diagram to always be dark (or vice versa,
> to give a surprise to dark mode users).

An example of a dark theme (this one's an image not an SVG, so it won't change according
to your system preference).

## Special themes

Certain, special themes do more than just color.

For example, when you apply the `Terminal` theme, the following attributes are set as
default:

- Caps lock on all labels
- No border radius
- Monospaced font
- `fill-pattern` set to `dots` for all containers
- Most outer container has `double-border` set to `true`

Source code for the above diagram (rendered with ELK) is as follows. Notice that many of
the properties apparent in the diagram do not appear in the source, such as the casing of
the labels, because the special theme uses different defaults.

```d2
vars: {
  d2-config: {
    layout-engine: elk
    # Terminal theme code
    theme-id: 300
  }
}
network: {
  cell tower: {
    satellites: {
      shape: stored_data
      style.multiple: true
    }
    transmitter
    satellites -> transmitter: send
  }
}
user: { shape: person; width: 130 }
user -> network.cell tower: make call
```

## Customizing themes

You can override theme values to customize existing themes or replace them entirely with
your own theme.

This is controlled by two [configuration variables](/tour/vars/#configuration-variables):

- `theme-overrides`: replaces color codes for theme
- `dark-theme-overrides`: replaces color codes for dark theme

Adding this snippet to the above code results in the following diagram.

```d2-incomplete
vars: {
  d2-config: {
    theme-overrides: {
      B1: "#2E7D32"
      B2: "#66BB6A"
      B3: "#A5D6A7"
      B4: "#C5E1A5"
      B5: "#E6EE9C"
      B6: "#FFF59D"

      AA2: "#0D47A1"
      AA4: "#42A5F5"
      AA5: "#90CAF9"

      AB4: "#F44336"
      AB5: "#FFCDD2"
    }
  }
}
```

### Color codes

（官方截图：D2 色码表，见 https://d2lang.com/tour/themes/）

> [!NOTE]
> Not all color codes are currently used right now, but that may change in the future for
> new things that come to D2.
