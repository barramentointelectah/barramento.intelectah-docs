/**
 * Controle de acesso do portal do Barramento.
 *
 * Roda no Cloudflare Pages antes de qualquer arquivo ser servido — inclusive
 * os .yaml abertos direto na barra de endereco. Uma trava em JavaScript dentro
 * da pagina nao faria isso.
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

function pedirSenha(nome) {
  return new Response("Acesso restrito.\n", {
    status: 401,
    headers: {
      "WWW-Authenticate": `Basic realm="${nome}", charset="UTF-8"`,
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequest(contexto) {
  const { request, next, env } = contexto;
  const caminho = new URL(request.url).pathname;
  const regra = escolherRegra(caminho);

  const credenciais = lerCredenciais(request.headers.get("Authorization"));
  if (!credenciais) return pedirSenha(regra.nome);

  const variavel = regra.perfis[credenciais.usuario.toLowerCase()];
  // Perfil que nao existe neste caminho, ou senha nao configurada: nega.
  // Fechado por omissao — esquecer de preencher uma variavel tranca, nao abre.
  if (!variavel) return pedirSenha(regra.nome);
  const esperada = env[variavel];
  if (!esperada || !saoIguais(credenciais.senha, esperada)) return pedirSenha(regra.nome);

  const resposta = await next();
  const nova = new Response(resposta.body, resposta);
  nova.headers.set("Cache-Control", "no-store");
  return nova;
}
