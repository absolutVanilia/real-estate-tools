# frontend/Dockerfile

# ==============================
#  STAGE 1: Build
# ==============================
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx ng build --configuration=production

# ==============================
#  STAGE 2: Production (Nginx)
# ==============================
FROM nginx:alpine AS production

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/te-arrendamos/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]