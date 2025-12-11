/**
 * Extract short address from full formatted address
 * e.g. "66 Mint St, San Francisco, CA 94103, USA" -> "66 Mint St"
 */
export function extractShortAddress(formattedAddress: string): string {
	const parts = formattedAddress.split(",");
	return parts[0]?.trim() || formattedAddress;
}
