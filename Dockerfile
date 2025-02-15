FROM node:bookworm-slim
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app
ENV PATH /app/node_modules/.bin:/root/.local/bin:$PATH
COPY . /app

RUN --mount=type=cache,target=/root/.cache \
  uv python install 3.12 --preview --default

RUN --mount=type=cache,target=/root/.cache \
  uv pip install -r ./packages/metastable/python/requirements.txt --python $(which python) --break-system-packages

ENV VITE_APP_ENABLE_OPTIONAL_FEATURES=1

RUN --mount=type=cache,target=/root/.cache \
  --mount=type=cache,target=/root/.npm \
  --mount=type=cache,target=/root/.yarn \
  corepack enable yarn && \
  yarn install && \
  yarn build && \
  find . -name node_modules -prune -exec rm -rf {} \; && \
  yarn workspaces focus -A --production && \
  rm -rf node_modules/@img/sharp-*-{win32,darwin}-* && \
  rm -rf node_modules/@img/sharp-*-arm64 && \
  rm -rf node_modules/@metastable/cppzst

EXPOSE 5001
ENV NVIDIA_VISIBLE_DEVICES=all
ENV SERVER_USE_PROXY=0
ENV SERVER_SKIP_PYTHON_SETUP=1
CMD ["corepack", "yarn", "start"]
