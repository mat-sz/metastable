FROM archlinux:base-devel

ENV PIP_PREFER_BINARY=1

RUN pacman -Sy nodejs npm python uv --noconfirm 

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY . /app

RUN --mount=type=cache,target=/root/.cache \
  --mount=type=cache,target=/root/.npm \
  npm install -g yarn && \
  yarn install && \
  uv pip install --extra-index-url https://download.pytorch.org/whl/cu121 -r ./packages/metastable/python/requirements.txt --python $(which python) --break-system-packages && \
  yarn build

EXPOSE 5001
ENV NVIDIA_VISIBLE_DEVICES=all
ENV SERVER_USE_PROXY=0
ENV SERVER_SKIP_PYTHON_SETUP=1
CMD ["yarn", "start"]