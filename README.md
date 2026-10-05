# Isys Karoline — site oficial

Personal Trainer e Pilates clássico para mulheres em Palmital/SP.

Site: https://isyskarolinepersonal.com.br/

Endereço Cloudflare: https://isys-karoline.pages.dev/

Este repositório contém somente os arquivos estáticos publicados e a rotina de publicação. O GitHub Actions publica a branch `main` no Cloudflare Pages, projeto `isys-karoline`, conta Isys Karoline. Fontes e bibliotecas incluem suas respectivas licenças.

A rotina `.github/workflows/cloudflare-pages.yml` valida o JavaScript e envia somente HTML, CSS, JavaScript, redirecionamentos e `assets/`. Usa o secret `CLOUDFLARE_API_TOKEN`, com permissão Pages Write apenas na conta Isys Karoline, e a variável `CLOUDFLARE_ACCOUNT_ID`. A chave global não faz parte da publicação. Cada push em `main` atualiza o site; também é possível executar a rotina manualmente pela aba Actions.

O domínio principal é `isyskarolinepersonal.com.br`; `www.isyskarolinepersonal.com.br` redireciona para ele. Nameservers para o Registro.br: `algin.ns.cloudflare.com` e `alla.ns.cloudflare.com`.
