FROM node:20-slim

# dependências do Chrome
RUN apt-get update && apt-get install -y \
  chromium \
  ca-certificates \
  fonts-liberation \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  libgbm1 \
  libgtk-3-0 \
  libnss3 \
  libasound2 \
  xdg-utils \
  --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*


ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV CHROME_PATH=/usr/bin/chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672

# Diretório da aplicação
WORKDIR /app

# Copia apenas arquivos de dependência
COPY package*.json ./

# Instala dependências
RUN npm install 

# Copia o resto do código
COPY . .

# Build do NestJS
RUN npm run build

#RUN npx prisma migrate dev --name multi_girls_architecture

# Porta padrão do Nest
EXPOSE 3000

# Inicia a aplicação
CMD ["node", "dist/main.js"]
