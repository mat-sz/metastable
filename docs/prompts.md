# Prompts

Metastable uses a superset of [ComfyUI's prompt syntax](https://blenderneko.github.io/ComfyUI-docs/Interface/Textprompts/).

## Weighting

Similarly to ComfyUI, parts of the prompt can be weighted using the `(prompt:weight)` syntax.

Examples:

- `a photo of a (green:1.4) banana`
- `a photo of a (green) banana` (equals `a photo of a (green:1.1) banana`) - omitting the weight sets the weight to `1.1`
- `a photo of a ((green:1.5) banana:2.0)` (equals `a photo of a (green:3.0) (banana:2.0)`) - nested parentheses multiply the weights

Parentheses inside of prompts can be escaled to disable the weighting, e.g. `1990s \(style\)`.

Prompt inputs in Metastable also support the `Ctrl+Up/Down` keyboard shortcuts to update the weight of the currently selected text.

## Textual inversion/embeddings

As in ComfyUI, embeddings can be referenced using the `embedding:name` syntax. File extension can be omitted.

The embedding file must be present in the embeddings model directory.

## Random choices

Parts of the prompt can be selected at random using the following syntax: `{choice1|choice2|...}`.

Example: `a photo of a {red|blue|yellow|green} banana`.

## Comments

Metastable introduces a new feature that allows for certain parts of the prompt to be disabled.

Inline comments are designated the `#- comment -#` syntax:

```
a photo of a beautiful sunset over #- new york -# los angeles
```

Inline comments can be toggled on and off with the `Ctrl+/` keyboard shortcut.

Line comments use the `# comment` syntax:

```
hdr, sunset # a part of the line is commented out
# entire line is commented out
```
