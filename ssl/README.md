# SSL Certificates

This directory contains SSL certificates for HTTPS configuration.

## Development
For development, you can generate self-signed certificates:

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

## Production
For production, use certificates from a trusted CA like Let's Encrypt:

```bash
# Using certbot
certbot certonly --webroot -w /var/www/html -d your-domain.com
```

## Files needed:
- `cert.pem` - The SSL certificate
- `key.pem` - The private key