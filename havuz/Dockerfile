# Tek bağımlılık (pg), derleme adımı yok, kaynak tek dosya.
#
# NEDEN TypeScript DEĞİL: bu servis iş mantığı taşımıyor — `LessonStore`
# arayüzünü SQL'e çeviriyor, o kadar. Tipler zaten istemcide (src/lessons/
# types.ts) ve orada zorlanıyor. Buraya derleme adımı koymak, kabı ayağa
# kaldırmayı bir tsc çıktısına bağımlı yapardı; kazancı yok.
FROM node:22-alpine

WORKDIR /app

# Bağımlılık katmanı önce: server.js her değiştiğinde npm install koşmasın.
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

COPY server.js router.js ./

# root olarak koşmaya gerek yok.
USER node

EXPOSE 8787
CMD ["node", "server.js"]
