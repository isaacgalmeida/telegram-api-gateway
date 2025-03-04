# Dockerfile
FROM node:16-alpine

WORKDIR /app

# Copia os arquivos de package para instalar as dependências
COPY package*.json ./

RUN npm install

# Copia o restante do código
COPY . .

# Expor a porta definida (no .env ou 3001)
EXPOSE ${PORT}

CMD ["node", "server.js"]
