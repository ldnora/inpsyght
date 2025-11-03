FROM node:18-alpine
# Installing libvips-dev for sharp Compatibility
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev postgresql-client
ENV NODE_ENV=${NODE_ENV}

# Definir o diretório de trabalho principal e mantê-lo
WORKDIR /opt/app

# Copiar os arquivos de dependência primeiro para aproveitar o cache do Docker
COPY package.json package-lock.json ./

# Instalar dependências. Agora elas serão criadas em /opt/app/node_modules
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm install

# Copiar o resto do código-fonte para o diretório de trabalho
COPY . .

# O PATH já deve incluir ./node_modules/.bin, mas esta linha é uma garantia
ENV PATH /opt/app/node_modules/.bin:$PATH

# Mudar a propriedade dos arquivos para o usuário 'node'
RUN chown -R node:node /opt/app

# Mudar para o usuário não-root
USER node

# --- A CORREÇÃO ESTÁ AQUI ---
# Define o diretório HOME para o usuário 'node'
# Isso corrige o erro "mkdir '/home/node/.npm'"
ENV HOME=/opt/app
# --- FIM DA CORREÇÃO ---

# Construir a aplicação
RUN ["npm", "run", "build"]

# Expor a porta e iniciar a aplicação
EXPOSE 1337
CMD ["npm", "run", "develop"]
