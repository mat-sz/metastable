# Metastable UI

A project-based Stable Diffusion Web UI, for easier organization of generated images. Work in progress.

The backend is based on [ComfyUI's backend](https://github.com/comfyanonymous/ComfyUI).

## Installation

```
yarn install
cd api
pip -r requirements.txt
```

Place your models in `./models/`.

## Usage

```
cd api && python main.py
cd web && yarn start
```
