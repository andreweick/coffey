/**
 * Parse a duration string into seconds.
 * Supports formats: "72h", "30m", "5s", "2d"
 * Returns 86400 (24 hours) if invalid or empty.
 */
export function parseDuration(duration: string | undefined): number {
	const DEFAULT_SECONDS = 86400; // 24 hours

	if (!duration || typeof duration !== 'string') {
		return DEFAULT_SECONDS;
	}

	const match = duration.match(/^(\d+)(d|h|m|s)$/);
	if (!match) {
		return DEFAULT_SECONDS;
	}

	const value = parseInt(match[1], 10);
	const unit = match[2];

	switch (unit) {
		case 'd':
			return value * 86400; // days to seconds
		case 'h':
			return value * 3600; // hours to seconds
		case 'm':
			return value * 60; // minutes to seconds
		case 's':
			return value; // already seconds
		default:
			return DEFAULT_SECONDS;
	}
}
