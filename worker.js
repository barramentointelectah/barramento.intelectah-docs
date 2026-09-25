/**
 * Controle de acesso quando o projeto e um **Worker com assets estaticos**.
 * As regras ficam em ./acesso.js, compartilhadas com functions/_middleware.js.
 *
 * O wrangler.jsonc marca run_worker_first: true, entao este codigo roda antes de
 * qualquer arquivo ser entregue; so depois de passar e que os assets sao buscados.
 */
import { barrar, semCache } from "./acesso.js";

export default {
  async fetch(request, env) {
    const negado = barrar(request, env);
    if (negado) return negado;
    return semCache(await env.ASSETS.fetch(request));
  },
};
