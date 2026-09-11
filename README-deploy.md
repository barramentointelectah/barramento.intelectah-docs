# Portal de Documentação — Barramento Neoh × HIS (GitHub Pages)

Portal público de documentação da API do Barramento, gerado a partir do **OpenAPI 3.0.3** (`openapi.yaml`) e renderizado com **Redoc**. Fonte da verdade = **código-fonte (`Barramento.cs`) + planilhas OFICIAL**. Genérico (Tasy/MV) — sem dependência de HIS específico.

## Conteúdo do pacote

| Arquivo | Função |
|---|---|
| `index.html` | Página do portal. Carrega o Redoc (CDN) e aponta para `openapi.yaml`. |
| `openapi.yaml` | Especificação OpenAPI 3.0.3 (46 rotas, 75 schemas). É o arquivo a editar. |
| `CNAME` | Domínio customizado: `docs.intelectah.com.br`. |
| `.nojekyll` | Impede o GitHub de processar os arquivos com Jekyll. |

## Publicar no GitHub Pages

1. Crie o repositório `intelectah/barramento-docs` (público, ou privado com Pages habilitado no plano).
2. Suba estes arquivos na raiz do branch `main`:
   ```bash
   git init
   git add index.html openapi.yaml CNAME .nojekyll
   git commit -m "Portal de documentação do Barramento"
   git branch -M main
   git remote add origin https://github.com/intelectah/barramento-docs.git
   git push -u origin main
   ```
3. No repositório: **Settings → Pages → Build and deployment → Source = Deploy from a branch**, branch `main`, pasta `/ (root)`. Salve.
4. Em 1–2 min o site fica em `https://intelectah.github.io/barramento-docs/`.

## Domínio customizado (`docs.intelectah.com.br`)

1. No provedor de DNS do domínio `intelectah.com.br`, crie um registro **CNAME**:
   - **Host/Nome:** `docs`
   - **Valor/Aponta para:** `intelectah.github.io`
2. Em **Settings → Pages → Custom domain**, informe `docs.intelectah.com.br` (o arquivo `CNAME` já traz esse valor).
3. Marque **Enforce HTTPS** após o certificado ser emitido (alguns minutos).

## Atualizar a documentação

Toda a documentação vem do `openapi.yaml`. Para alterar:

1. Edite `openapi.yaml` (é a fonte; qualquer ajuste de contrato deve refletir o **código**, nunca o contrário).
2. Valide antes de publicar:
   ```bash
   pip install openapi-spec-validator pyyaml
   python -c "from openapi_spec_validator import validate; import yaml; validate(yaml.safe_load(open('openapi.yaml'))); print('OK')"
   ```
3. `git commit` + `git push`. O Pages republica sozinho.

## Versão offline (para enviar por e-mail/WhatsApp)

O arquivo `portal-barramento-api.html` (na pasta OFICIAL, fora deste pacote) é **autocontido**: abre com duplo clique, sem internet e sem servidor. Use-o para mandar a documentação direto para uma pessoa. Ele embute o Redoc e o spec no próprio HTML.

---
*Documentação de contrato — reconstruída a partir das planilhas OFICIAL + `Barramento.cs`. Onde a planilha do cliente e o código divergem, o portal segue o código.*
