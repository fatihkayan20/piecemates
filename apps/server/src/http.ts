/** HTTP statuses the API answers with. */
export const STATUS = {
	badRequest: 400,
	unauthorized: 401,
	forbidden: 403,
	notFound: 404,
	upgradeRequired: 426,
	internalError: 500,
} as const;
