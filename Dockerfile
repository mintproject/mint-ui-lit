FROM nginx:1.13.0-alpine
WORKDIR /usr/share/nginx/html
COPY build ./
RUN sed -i "s/es6\///g" index.html
EXPOSE 80
