# Portal de Documentação — Barramento Neoh × HIS (GitHub Pages)

Portal público de documentação da API do Barramento, gerado a partir do **OpenAPI 3.0.3** (`openapi.yaml`) e renderizado com **Redoc**. Fonte da verdade = **código-fonte (`Barramento.cs`) + planilhas OFICIAL**. Genérico (Tasy/MV) — sem dependência de HIS específico.

## Conteúdo do pacote

| Arquivo | Função |
|---|---|
| `index.html` | Aba **Referência de API**. Carrega o Redoc (CDN) e aponta para `openapi.yaml`. |
| `openapi.yaml` | Especificação OpenAPI 3.0.3 (49 rotas, 51 operações). É o arquivo a editar. |
| `de-para.html` | Aba **De-para · Documentação × Portal**. Página estática **gerada** — não editar à mão. |
| `.nojekyll` | Impede o GitHub de processar os arquivos com Jekyll. |

## Publicar no GitHub Pages

1. Repositório público `thiagopaz/barramento-docs` (Pages habilitado, branch `main`, pasta raiz).
2. Repositório em uso: **`thiagopaz/barramento-docs`**. Suba estes arquivos na raiz do branch `main`:
   ```bash
   git init
   git add index.html openapi.yaml de-para.html .nojekyll
   git commit -m "Portal de documentação do Barramento"
   git branch -M main
   git remote add origin https://github.com/thiagopaz/barramento-docs.git
   git push -u origin main
   ```
3. No repositório: **Settings → Pages → Build and deployment → Source = Deploy from a branch**, branch `main`, pasta `/ (root)`. Salve.
4. Em 1–2 min o site fica em `https://thiagopaz.github.io/barramento-docs/`.

## Aba De-para (`de-para.html`)

Liga cada operação publicada ao documento que a especifica na OFICIAL, com a situação de cada uma
(publicado / proposta / não localizado / documentado mas ainda não publicado). A página é **gerada** —
não se edita o HTML. Para regerar depois de mexer no `openapi.yaml` ou no de-para:

```bash
cd OFICIAL
python3 .sync/gerar-de-para-html.py
```

O gerador lê `DE-PARA-Portal-x-Codigo.md` (seção *Visão consolidada*) e o `openapi.yaml`, e reescreve
`de-para.html`. Por decisão de projeto ele **não** publica nomes de método nem números de linha do
código-fonte: essa parte fica só no de-para interno, na OFICIAL. O gerador avisa no console quando uma
operação do `openapi.yaml` não tem linha no de-para (ou o contrário) — vale tratar o aviso antes de publicar.

## Atualizar a documentação

Toda a documentação vem do `openapi.yaml`. Para alterar:

1. Edite `openapi.yaml` (é a fonte; qualquer ajuste de contrato deve refletir o **código**, nunca o contrário).
2. Valide antes de publicar:
   ```bash
   pip install openapi-spec-validator pyyaml
   python -c "from openapi_spec_validator import validate; import yaml; validate(yaml.safe_load(open('openapi.yaml'))); print('OK')"
   ```
3. Regere a aba de-para: `python3 ../.sync/gerar-de-para-html.py` (a partir da OFICIAL).
4. `git commit` + `git push`. O Pages republica sozinho.

## Versão offline (para enviar por e-mail/WhatsApp)

O arquivo `portal-barramento-api.html` (na pasta OFICIAL, fora deste pacote) é **autocontido**: abre com duplo clique, sem internet e sem servidor. Use-o para mandar a documentação direto para uma pessoa. Ele embute o Redoc e o spec no próprio HTML.

---
*Documentação de contrato — reconstruída a partir das planilhas OFICIAL + `Barramento.cs`. Onde a planilha do cliente e o código divergem, o portal segue o código.*
