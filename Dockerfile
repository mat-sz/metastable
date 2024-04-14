FROM pytorch/pytorch:2.1.2-cuda12.1-cudnn8-runtime

ENV DEBIAN_FRONTEND=noninteractive PIP_PREFER_BINARY=1

RUN apt update && \
  apt install -y ca-certificates curl gnupg && \
  mkdir -p /etc/apt/keyrings && \
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg && \
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_20.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list && \
  apt update && apt install -y nodejs ffmpeg libsm6 libxext6 && \
  apt clean

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY . /app

RUN --mount=type=cache,target=/root/.cache \
  --mount=type=cache,target=/root/.npm \
  npm install -g yarn && \
  yarn install && \
  yarn setup:other && \
  yarn build

EXPOSE 5001
ENV NVIDIA_VISIBLE_DEVICES=all
ENV SERVER_USE_PROXY=0
ENV SERVER_SKIP_PYTHON_SETUP=1
CMD ["yarn", "start"]