FROM node:22-alpine

WORKDIR /app

COPY backend/package.json ./package.json
RUN npm install

COPY backend ./backend
COPY frontend ./frontend

EXPOSE 8000

CMD ["node", "backend/index.js"]
