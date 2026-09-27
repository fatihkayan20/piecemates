type Env = { SERVER: { fetch: typeof fetch } };

/**
 * In production the web Worker hands the server's paths (assets.runWorkerFirst
 * in packages/infra) to the server Worker, so the browser sees one site and
 * Safari keeps the session cookie. Everything else is a static asset.
 */
export default {
	fetch: (request: Request, env: Env) => env.SERVER.fetch(request),
};
