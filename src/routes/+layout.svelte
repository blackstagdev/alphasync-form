<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	import { browser } from '$app/environment';

	const GTM_IDS = {
		google: 'GTM-TKJ2M4FD',
		fb: 'GTM-N5CFXBGS'
	};

	function pickGtmId(referrer) {
		const ref = (referrer || '').toLowerCase();

		// your rules:
		if (ref.includes('m-longevity')) return GTM_IDS.fb;
		if (ref.includes('g-longevity')) return GTM_IDS.google;

		// fallback
		return GTM_IDS.google;
	}

	function loadGtm(containerId) {
		if (!containerId) return;

		// prevent double-load
		if (document.getElementById(`gtm-script-${containerId}`)) return;

		// init dataLayer
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

		// inject gtm.js into <head>
		const s = document.createElement('script');
		s.id = `gtm-script-${containerId}`;
		s.async = true;
		s.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
		document.head.appendChild(s);

		// OPTIONAL: add the iframe (noscript equivalent)
		// Note: real <noscript> only matters when JS is disabled; in an embed this is usually irrelevant.
		const iframeWrap = document.createElement('div');
		iframeWrap.id = `gtm-iframe-${containerId}`;
		iframeWrap.style.display = 'none';
		iframeWrap.innerHTML = `
		<iframe
			src="https://www.googletagmanager.com/ns.html?id=${containerId}"
			height="0"
			width="0"
			style="display:none;visibility:hidden"
		></iframe>
	`;
		document.body.prepend(iframeWrap);
	}

	let gtmId = $state('');

	$effect(() => {
		if (!browser) return;

		const parentUrl = document.referrer || '';
		gtmId = pickGtmId(parentUrl);

		loadGtm(gtmId);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
