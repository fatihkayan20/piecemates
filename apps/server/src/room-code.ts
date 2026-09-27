// No 0/O/1/I/L so codes are easy to read out loud.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
// 31^8 ≈ 850 billion codes, too many to guess one; still short to type.
const CODE_LENGTH = 8;
const BYTE_VALUES = 256;
// Bytes at or above this are skipped so every letter is equally likely.
const BYTE_LIMIT = BYTE_VALUES - (BYTE_VALUES % CODE_ALPHABET.length);

/** A fresh random room code. */
export function newCode() {
	let code = "";
	while (code.length < CODE_LENGTH)
		for (const b of crypto.getRandomValues(new Uint8Array(CODE_LENGTH)))
			if (b < BYTE_LIMIT && code.length < CODE_LENGTH)
				code += CODE_ALPHABET[b % CODE_ALPHABET.length];
	return code;
}
