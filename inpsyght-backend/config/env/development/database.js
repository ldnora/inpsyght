const fs = require('fs');
const path = require('path');

console.log('✅ Carregando configuração customizada do banco de dados (database.js)...');

module.exports = ({ env }) => ({
  connection: {
    client: 'postgres',
    // O Strapi irá priorizar a connectionString se ela existir.
    // Os outros parâmetros (host, port, etc.) servirão como fallback.
    connection: {
      connectionString: env('DATABASE_URL'), // <-- Usando a nova variável do .env
      ssl: {
        // Mantemos esta opção como uma garantia para contornar o firewall.
        rejectUnauthorized: false,
      },
    },
    debug: false,
  },
});

