# Metastable UI

A project-based Stable Diffusion Web UI, for easier organization of generated images. Work in progress.

The backend is based on [ComfyUI's backend](https://github.com/comfyanonymous/ComfyUI).

## Manual installation

Installation is performed similarly to ComfyUI, with some extra requirements.

### Requirements

- node.js 18+
- python 3.10+
- pip
- npm
- yarn (`npm install -g yarn` or via your system's package manager)
- git

#### Alpine Linux

- `apk add git python3 py3-pip nodejs npm`
- `npm install -g yarn`

#### Arch Linux

- `pacman -S git python python-pip node npm`
- `npm install -g yarn`

#### CentOS/RHEL/Fedora

- `dnf install git python3-pip python3-wheel nodejs npm`
- `npm install -g yarn`

#### Debian/Ubuntu

- `apt install git python3-pip nodejs npm`
- `npm install -g yarn`

#### openSUSE

- `zypper install git python3-pip python3-setuptools python3-wheel`
- `npm install -g yarn`

#### Windows

- Install Python 3: https://www.python.org/downloads/windows/
- Install node.js: https://nodejs.org/en/download
- Install git: https://git-scm.com/download/win
- Open Command Prompt (or Powershell)
- Run `npm install -g yarn`

### Installation

- Open Terminal/Command Prompt/Powershell
- `git clone https://github.com/mat-sz/metastable.git`
- `cd metastable`
- `yarn`
- Continue with the instructions below depending on your GPU

#### AMD GPUs (Linux only)

```
yarn setup:amd # or `yarn setup:amd:rocm5.7` for nightly builds of pytorch that might perform faster
yarn setup:pip
```

#### NVIDIA

```
yarn setup:nvidia
yarn setup:pip
```

#### Apple Silicon Macs

```
yarn setup:other
yarn setup:pip
```

You'll need to edit api/package.json to include ` --force-fp16` after `python main.py`.

#### Others/CPU

```
yarn setup:other
yarn setup:pip
```

## Usage

Place your models in `./models/`.

```
yarn start
```

The web app will be available at: http://127.0.0.1:5001/
