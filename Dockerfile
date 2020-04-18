FROM node:12

WORKDIR /k8s-eip

# Start with package.json to ensure better caching
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["node", "dist/index.js"]
