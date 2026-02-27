#!/usr/bin/env bash
# Deploy para https://insta-pilates.vercel.app/
# Projeto: https://vercel.com/ia-volls-projects/insta-pilates
#
# Pré-requisito: fazer login com a conta que tem acesso ao time ia-volls-projects:
#   npx vercel login
#   (use ia.vollpilates@gmail.com ou a conta do iavollpilates-byte)
#
# Depois execute este script na pasta do projeto:
#   chmod +x scripts/deploy-vercel.sh
#   ./scripts/deploy-vercel.sh

set -e
cd "$(dirname "$0")/.."

echo "→ Vinculando ao projeto ia-volls-projects/insta-pilates..."
rm -rf .vercel
npx vercel link --scope ia-volls-projects --project insta-pilates --yes

echo "→ Deploy em produção..."
npx vercel --prod --yes

echo "✓ Deploy concluído. Site: https://insta-pilates.vercel.app/"
