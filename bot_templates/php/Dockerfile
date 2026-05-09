FROM php:8.2-fpm-alpine

RUN apk add --no-cache nginx

WORKDIR /var/www/html

COPY index.php .

CMD ["php-fpm"]
