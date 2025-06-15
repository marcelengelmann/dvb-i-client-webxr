const cors_proxy_link = "https://api.codetabs.com/v1/proxy?quest=";

export function getCorsProxyUrl(actualURL: string): string {
	return cors_proxy_link + encodeURIComponent(actualURL);
}
