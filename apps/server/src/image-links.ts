import { ENV } from "./env.server";

/** A link stays the same for a week, so caches keep it, and works for one to two weeks. */
const LINK_PERIOD_MS = 604_800_000;
const PERIODS_VALID = 2;
const HEX = 16;
const SIGNATURE = /^[0-9a-f]{64}$/;

let key: Promise<CryptoKey> | undefined;
// Its own key from the auth secret, so a link signature is useless anywhere else.
const hmacKey = () => {
	key ??= crypto.subtle.importKey(
		"raw",
		new TextEncoder().encode(`image-links:${ENV.BETTER_AUTH_SECRET}`),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign", "verify"],
	);
	return key;
};

const message = (id: string, expires: number) =>
	new TextEncoder().encode(`${id}.${expires}`);

/** When a link made now expires and its signature, as the `e` and `s` query parameters. */
export async function signImage(id: string) {
	const expires =
		(Math.floor(Date.now() / LINK_PERIOD_MS) + PERIODS_VALID) * LINK_PERIOD_MS;
	const signature = await crypto.subtle.sign(
		"HMAC",
		await hmacKey(),
		message(id, expires),
	);
	const hex = Array.from(new Uint8Array(signature), (b) =>
		b.toString(HEX).padStart(2, "0"),
	).join("");
	return { e: String(expires), s: hex };
}

/** Whether a link to this photo is ours and hasn't expired. */
export async function checkImage(id: string, e?: string, s?: string) {
	const expires = Number(e);
	if (!(expires > Date.now()) || !s || !SIGNATURE.test(s)) return false;
	const bytes = Uint8Array.from(s.match(/../g) ?? [], (h) =>
		Number.parseInt(h, HEX),
	);
	return crypto.subtle.verify(
		"HMAC",
		await hmacKey(),
		bytes,
		message(id, expires),
	);
}
