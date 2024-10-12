# Metastable Resource Name

MRNs are functionally similar to URNs. Unlike URNs, MRNs use regular URL-like query instead of r/q/f-components and have a simpler algorithm for escaping segments.

## Escaping

Out of ASCII printable characters, only the following are escaped:

- ` ` (space)
- `:`
- `%`
- `?`

## Examples

- `mrn:project:V1StGXR8_Z5jdHi6B-myT:file:input:00001.png`
- `mrn:project:V1StGXR8_Z5jdHi6B-myT:file:input:00001.png?size=thumbnail`
- `mrn:project:V1StGXR8_Z5jdHi6B-myT`
- `mrn:model:checkpoint:sdxl/sd_xl_base_1.0.safetensors`
- `mrn:model:checkpoint:sdxl/sd_xl_base_1.0.safetensors:cover`
- `mrn:model:checkpoint:~extra_directory/sd_xl_base_1.0.safetensors`
