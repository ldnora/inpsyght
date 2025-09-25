FROM node:20-alpine

WORKDIR /app

# Copiar apenas os arquivos de dependência primeiro
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências - usar npm install ao invés de npm ci
RUN npm install

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar o resto do código
COPY . .

ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "dev"]