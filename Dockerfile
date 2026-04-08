FROM node:20

WORKDIR /app

# Instalar PM2 globalmente
RUN npm install -g pm2

# Copiar dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar código
COPY . . 

# Exponer puerto 4000
EXPOSE 4000 

# Ejecutar con PM2
CMD ["pm2-runtime", "start", "npm", "--", "run", "start"]
