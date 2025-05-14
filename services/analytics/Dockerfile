FROM node:23-slim
WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
EXPOSE 3011
CMD ["npm", "start"]