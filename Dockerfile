FROM node:18

WORKDIR /app

COPY package*.json ./

# Install all dependencies including recharts
RUN npm install && \
    npm install --save \
    react-beautiful-dnd \
    @types/react-beautiful-dnd \
    recharts \
    @types/recharts

COPY . .

ENV NODE_OPTIONS=--openssl-legacy-provider

EXPOSE 3000

CMD ["npm", "start"] 