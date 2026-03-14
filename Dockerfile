FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN apk add --no-cache curl
RUN npm install

COPY . .

# Build the Next.js app
RUN npm run build

EXPOSE 3000

# Set environment to production
ENV NODE_ENV production

# Using npm start to run the production build
CMD ["npm", "start"]
