FROM node:22-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY backend/package.json ./package.json
RUN npm install

# Копируем весь бэкенд
COPY backend ./backend

# Копируем фронтенд
COPY frontend ./frontend

# Создаем симлинк для статических файлов
RUN ln -sf /app/frontend /app/backend/frontend || true

EXPOSE 3000

CMD ["node", "backend/index.js"]
