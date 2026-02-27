#!/usr/bin/env bash
# Recupera o repositório a partir do commit usado no deploy OK do Vercel.
# Uso: COMMIT_BOM=<hash> ./scripts/recover-from-vercel.sh
# Ex.: COMMIT_BOM=8278231 ./scripts/recover-from-vercel.sh

set -e
cd "$(dirname "$0")/.."

if [ -z "${COMMIT_BOM}" ]; then
  echo "Erro: defina COMMIT_BOM com o hash do commit do deploy OK no Vercel."
  echo "Ex.: COMMIT_BOM=8278231 $0"
  exit 1
fi

echo "Passo 2: Restaurando GitHub main para o commit ${COMMIT_BOM}..."
git fetch origin
git checkout main
git reset --hard "${COMMIT_BOM}"
git push origin main --force

echo "Passo 3: Sincronizando pasta local com origin/main..."
git fetch origin
git reset --hard origin/main

echo "Pronto. Seu repositório local está igual ao commit que o Vercel usa no deploy OK."
