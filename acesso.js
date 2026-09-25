/**
 * Regras de acesso do portal do Barramento — modulo comum.
 *
 * Usado pelos dois modos de publicacao do Cloudflare: projeto Pages
 * (functions/_middleware.js) e Worker com assets estaticos (worker.js).
 * Nos dois, a verificacao acontece antes de qualquer arquivo ser servido —
 * inclusive os .yaml abertos direto na barra de endereco.
 *
 * Cada caminho aceita duas senhas, uma por perfil:
 *
 *   usuario "intelectah" -> senha do time interno
 *   usuario "integrador" -> senha do integrador daquele HIS
 *
 * Assim, quando um integrador sai do projeto, troca-se so a senha dele: o time
 * interno continua entrando. As senhas moram nas variaveis de ambiente do
 * projeto no Cloudflare, nunca neste arquivo.
 */

const REGRAS = [
  {
    prefixo: "/tasy/",
    nome: "Barramento · Tasy",
    perfis: { intelectah: "SENHA_INTELECTAH_TASY", integrador: "SENHA_INTEGRADOR_TASY" },
  },
  {
    prefixo: "/mv/",
    nome: "Barramento · MV",
    perfis: { intelectah: "SENHA_INTELECTAH_MV", integrador: "SENHA_INTEGRADOR_MV" },
  },
  {
    prefixo: "/de-para/",
    nome: "Barramento · De-para (interno)",
    perfis: { intelectah: "SENHA_INTELECTAH_DEPARA" },
  },
];

// Vale para a raiz e para tudo que nao casar com as regras acima: o openapi.yaml
// completo, a pagina neutra, e qualquer arquivo novo que venha a aparecer.
const REGRA_PADRAO = {
  nome: "Barramento · Interno",
  perfis: { intelectah: "SENHA_INTELECTAH_RAIZ" },
};

function escolherRegra(caminho) {
  for (const regra of REGRAS) {
    if (caminho === regra.prefixo.slice(0, -1) || caminho.startsWith(regra.prefixo)) {
      return regra;
    }
  }
  return REGRA_PADRAO;
}

/** Comparacao de tempo constante: nao encurta no primeiro caractere diferente. */
function saoIguais(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bytesA = new TextEncoder().encode(a);
  const bytesB = new TextEncoder().encode(b);
  let diferenca = bytesA.length ^ bytesB.length;
  const limite = Math.max(bytesA.length, bytesB.length);
  for (let i = 0; i < limite; i++) {
    diferenca |= (bytesA[i] || 0) ^ (bytesB[i] || 0);
  }
  return diferenca === 0;
}

function lerCredenciais(cabecalho) {
  if (!cabecalho || !cabecalho.startsWith("Basic ")) return null;
  let texto;
  try {
    texto = atob(cabecalho.slice(6));
  } catch (erro) {
    return null;
  }
  const corte = texto.indexOf(":");
  if (corte < 0) return null;
  return { usuario: texto.slice(0, corte), senha: texto.slice(corte + 1) };
}

const TODAS_AS_VARIAVEIS = [
  "SENHA_INTELECTAH_TASY", "SENHA_INTEGRADOR_TASY",
  "SENHA_INTELECTAH_MV", "SENHA_INTEGRADOR_MV",
  "SENHA_INTELECTAH_DEPARA", "SENHA_INTELECTAH_RAIZ",
];

/**
 * Corpo do 401 com o que o servidor esta enxergando — sem NUNCA revelar valor
 * de senha, so quais variaveis existem. Sai apenas quando a URL pede ?diag=1,
 * e so para quem ainda nao entrou, entao nao vaza nada de quem esta dentro.
 */
function diagnostico(url, regra, env, usuario) {
  const definidas = TODAS_AS_VARIAVEIS.filter((v) => typeof env[v] === "string" && env[v].length > 0);
  const faltando = TODAS_AS_VARIAVEIS.filter((v) => !definidas.includes(v));
  const linhas = [
    "",
    "--- diagnostico ---",
    "caminho pedido:        " + url.pathname,
    "regra que casou:       " + regra.nome,
    "perfis aceitos aqui:   " + Object.keys(regra.perfis).join(", "),
    "variavel consultada:   " + (usuario ? (regra.perfis[usuario.toLowerCase()] || "(nenhuma: perfil nao vale neste caminho)") : "(sem usuario)"),
    "senhas configuradas:   " + (definidas.length ? definidas.join(", ") : "NENHUMA — o servidor nao recebeu nenhuma variavel"),
    "faltando configurar:   " + (faltando.length ? faltando.join(", ") : "nenhuma"),
    "",
    "Se a variavel consultada aparece em 'faltando configurar', o problema e de",
    "configuracao, nao de senha: cadastre como Secret e refaca o deploy.",
    "",
  ];
  return linhas.join("\n");
}

function pedirSenha(nome, extra) {
  return new Response("Acesso restrito.\n" + (extra || ""), {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${nome}", charset="UTF-8"`,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Devolve uma Response de 401 quando a requisicao nao passa, ou null quando passa.
 * Serve tanto ao Pages (functions/_middleware.js) quanto ao Worker (worker.js).
 */
export function barrar(request, env) {
  const url = new URL(request.url);
  const regra = escolherRegra(url.pathname);
  const credenciais = lerCredenciais(request.headers.get("Authorization"));
  const pedir = () => pedirSenha(
    regra.nome,
    url.searchParams.has("diag") ? diagnostico(url, regra, env, credenciais && credenciais.usuario) : "");

  if (!credenciais) return pedir();

  const variavel = regra.perfis[credenciais.usuario.toLowerCase()];
  // Perfil que nao existe neste caminho, ou senha nao configurada: nega.
  // Fechado por omissao - esquecer de preencher uma variavel tranca, nao abre.
  if (!variavel) return pedir();
  const esperada = env[variavel];
  if (!esperada || !saoIguais(credenciais.senha, esperada)) return pedir();

  return null;
}

export function semCache(resposta) {
  const nova = new Response(resposta.body, resposta);
  nova.headers.set("Cache-Control", "no-store");
  return nova;
}
