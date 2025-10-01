FROM node:20-slim

# Instala dependências do sistema para Chromium
RUN apt-get update && apt-get install -y \
  chromium \
  libatk1.0-0 \
  libgtk-3-0 \
  libx11-6 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxrandr2 \
  libdrm2 \
  libnss3 \
  libnspr4 \
  libdbus-1-3 \
  libxfixes3 \
  libxcb1 \
  libexpat1 \
  libudev1 \
  libcairo2 \
  libpango-1.0-0 \
  libgdk-pixbuf2.0-0 \
  libfreetype6 \
  fontconfig \
  --no-install-recommends && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

# Instala dependências do projeto
RUN npm install

# Expõe a porta se for necessário
EXPOSE 3000

CMD ["npm", "start"]