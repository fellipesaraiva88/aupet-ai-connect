#!/bin/bash
set -e

echo "🚀 Iniciando build do Auzap.ai Backend"

# Navegar para o diretório backend
cd backend

echo "📦 Instalando dependências..."
npm install

echo "🔨 Compilando TypeScript..."
npm run build

echo "✅ Build concluído com sucesso!"
echo "📁 Arquivos compilados estão em backend/dist/"