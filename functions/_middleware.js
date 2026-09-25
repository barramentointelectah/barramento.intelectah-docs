/**
 * Controle de acesso quando o projeto e do tipo **Pages**.
 * As regras ficam em ../acesso.js, compartilhadas com o worker.js.
 */
import { barrar, semCache } from "../acesso.js";

export async function onRequest({ request, next, env }) {
  const negado = barrar(request, env);
  if (negado) return negado;
  return semCache(await next());
}
