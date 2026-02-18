<script>
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();

	import { browser } from '$app/environment';
	import { page } from '$app/stores';

	const GTM_IDS = {
		google: 'GTM-TKJ2M4FD',
		meta: 'GTM-N5CFXBGS',
		linkedin: 'GTM-M8X6QZ85'
	};

	function pickGtmId(gtmParam) {
		const key = (gtmParam || '').toLowerCase();
		return GTM_IDS[key] ?? GTM_IDS.google; // default google
	}

	function loadGtm(containerId) {
		// prevent double-load
		if (document.getElementById(`gtm-script-${containerId}`)) return;

		// init dataLayer
		window.dataLayer = window.dataLayer || [];
		window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

		// inject script
		const s = document.createElement('script');
		s.id = `gtm-script-${containerId}`;
		s.async = true;
		s.src = `https://www.googletagmanager.com/gtm.js?id=${containerId}`;
		document.head.appendChild(s);
	}

	let loadedId = $state('');

	$effect(() => {
		if (!browser) return;

		const gtmParam = $page.url.searchParams.get('gtm'); // "google" or "meta"
		const chosen = pickGtmId(gtmParam);

		if (chosen === loadedId) return;
		loadedId = chosen;

		loadGtm(chosen);

		// optional: expose which one was chosen
		window.dataLayer.push({ event: 'embed_loaded', gtm_variant: gtmParam || 'google' });
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
