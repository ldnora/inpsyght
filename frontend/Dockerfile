FROM node:20-alpine

WORKDIR /app

<<<<<<< HEAD
COPY package*.json . 

COPY . .

EXPOSE 3000
RUN npm install

CMD npm run dev 
=======
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
>>>>>>> 2-dockercompose
