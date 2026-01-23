<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabaseClient';

	let form = $state({
		firstName: '',
		lastName: '',
		suffix: '',
		email: '',
		phone: '',
		companyName: '',
		businessType: 'Provider',
		website: '',
		taxId: '',
		npi: '',
		npiMatchesContact: 'yes',
		npiAgreeMatchesContact: false,
		hasResellerLicense: 'yes',
		resellerPermit: '',
		resellerCertificate: null,
		address: '',
		city: '',
		state: '',
		zip: '',
		proofOfBusiness: null,
		referredBy: '',
		notes: '',
		agree: false
	});

	const isValidNPI = (npi) => /^\d{10}$/.test(npi);
	const isValidEIN = (ein) => /^(\d{2}-\d{7}|\d{9})$/.test(ein);
	const isValidUSPhone = (phone) => /^\+?1?\s?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/.test(phone);

	const isFormValid = () => {
		return (
			form.firstName &&
			form.lastName &&
			form.email &&
			isValidUSPhone(form.phone) &&
			form.companyName &&
			form.website &&
			isValidEIN(form.taxId) &&
			isValidNPI(form.npi) &&
			form.address &&
			form.city &&
			form.state &&
			form.zip &&
			form.agree &&
			(form.hasResellerLicense !== 'yes' || form.resellerPermit) &&
			form.resellerCertificate
		);
	};

	function handleFileUpload(e, field) {
		const file = e.target.files?.[0];
		if (file) {
			form[field] = file;
		}
	}

	// function submitForm() {
	// 	const fd = new FormData();

	// 	Object.entries(form).forEach(([key, value]) => {
	// 		fd.append(key, value ?? '');
	// 	});

	// 	fetch('/api/provider-intake', {
	// 		method: 'POST',
	// 		body: fd
	// 	})
	// 		.then((r) => r.json())
	// 		.then((data) => console.log('Submitted:', data))
	// 		.catch(console.error);
	// }

	async function uploadFile(file, folder) {
		const filePath = `${folder}/${crypto.randomUUID()}-${file.name}`;

		const { error } = await supabase.storage.from('provider-files').upload(filePath, file, {
			upsert: true
		});

		if (error) throw error;

		// 👇 THIS is the key change
		const { data } = supabase.storage.from('provider-files').getPublicUrl(filePath);

		return data.publicUrl;
	}

	async function submitForm() {
		try {
			let resellerCertificateUrl = null;
			let proofOfBusinessUrl = null;

			if (form.resellerCertificate) {
				resellerCertificateUrl = await uploadFile(
					form.resellerCertificate,
					'reseller-certificates'
				);
			}

			if (form.proofOfBusiness) {
				proofOfBusinessUrl = await uploadFile(form.proofOfBusiness, 'proof-of-business');
			}

			const { error } = await supabase.from('provider_intake').insert({
				first_name: form.firstName,
				last_name: form.lastName,
				suffix: form.suffix || null,
				email: form.email,
				phone: form.phone,

				company_name: form.companyName,
				business_type: form.businessType,
				website: form.website || null,
				tax_id: form.taxId || null,
				npi: form.npi || null,

				npi_matches_contact: form.npiMatchesContact,
				npi_agree_matches_contact: form.npiAgreeMatchesContact,

				has_reseller_license: form.hasResellerLicense,
				reseller_permit: form.resellerPermit || null,

				// 👇 URLs stored directly
				reseller_certificate_path: resellerCertificateUrl,
				proof_of_business_path: proofOfBusinessUrl,

				address: form.address,
				city: form.city,
				state: form.state,
				zip: form.zip,

				referred_by: form.referredBy || null,
				notes: form.notes || null,

				agree: form.agree
			});

			if (error) throw error;

			alert('Form submitted successfully!');
		} catch (err) {
			console.error(err);
			alert('Submission failed. Check console.');
		}
	}

	let affiliateList = $state([]);
	let search = $state('');
	let open = $state(false);
	let filteredList = $state([]);

	onMount(async () => {
		await loadAffiliates();
	});

	async function loadAffiliates() {
		try {
			const res = await fetch(
				'https://api.goaffpro.com/v1/admin/affiliates?status=approved&fields=id,name,first_name,last_name,ref_code',
				{
					headers: {
						'X-GOAFFPRO-ACCESS-TOKEN':
							'5d7c7806d9545a1d44d0dfd9da39e4b9fc513d43fe24a56cb9ced3280252ac22',
						'Content-Type': 'application/json'
					}
				}
			);

			const data = await res.json();
			affiliateList = data.affiliates || [];
			filteredList = affiliateList;
		} catch (err) {
			console.error('Error fetching affiliates:', err);
		}
	}

	// Filter affiliates

	$effect(() => {
		filteredList = affiliateList.filter((a) => a.name.toLowerCase().includes(search.toLowerCase()));
	});

	$effect(() => {
		const ref = $page.url.searchParams.get('ref');
		if (ref) {
			form.referredBy = ref;
		}
	});

	function selectReferrer(a) {
		form.referredBy = a.ref_code;
		open = false;
	}
</script>

<form
	class="mx-auto grid max-w-3xl gap-12"
	onsubmit={(e) => {
		e.preventDefault();
		submitForm();
	}}
>
	<h1 class="text-3xl font-black">Let's get started</h1>

	<!-- Contact Information -->
	<section>
		<h2 class="section-title">Contact Information</h2>

		<div class="form-grid">
			<div class="flex w-full flex-col gap-4 sm:flex-row">
				<div class="w-full">
					<label for="firstName" class="required">First Name</label>
					<input id="firstName" bind:value={form.firstName} required class="input w-full" />
				</div>

				<div class="w-full">
					<label for="lastName" class="required w-full">Last Name</label>
					<input id="lastName" bind:value={form.lastName} required class="input w-full" />
				</div>

				<div class="w-full sm:w-1/2">
					<label for="suffix">Suffix</label>
					<input id="suffix" bind:value={form.suffix} class="input w-full" />
				</div>
			</div>

			<div class="flex flex-col gap-4 sm:flex-row">
				<div class="w-full">
					<label for="email" class="required">Email</label>
					<input id="email" type="email" bind:value={form.email} required class="input w-full" />
				</div>

				<div class="w-full">
					<label for="phone" class="required">Phone</label>
					<input
						id="phone"
						type="tel"
						bind:value={form.phone}
						required
						class="input w-full"
						placeholder="(555) 123-4567"
					/>

					{#if form.phone && !isValidUSPhone(form.phone)}
						<p class="mt-1 text-sm text-red-600">Please enter a valid US mobile number.</p>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- Business Profile -->
	<section>
		<h2 class="section-title">Business Profile</h2>

		<div class="grid gap-6">
			<div class="flex flex-col gap-4 sm:flex-row">
				<div class="w-full">
					<label for="companyName" class="required">Company Name</label>
					<input id="companyName" bind:value={form.companyName} required class="input" />
				</div>

				<div class="w-full">
					<label for="businessType">Business Type</label>
					<select id="businessType" bind:value={form.businessType} class="input">
						<option value="Provider">Provider</option>
						<option value="Clinic">Partner</option>
					</select>
				</div>
			</div>

			<div class="flex flex-col gap-4 sm:flex-row">
				<div class="w-full">
					<label for="website" class="required">Website</label>
					<input id="website" bind:value={form.website} required class="input" />
				</div>

				<div class="w-full">
					<label for="taxId" class="required">Tax ID / EIN</label>
					<input
						id="taxId"
						bind:value={form.taxId}
						required
						placeholder="12-3456789"
						class="input"
						type="number"
					/>

					{#if form.taxId && !isValidEIN(form.taxId)}
						<p class="mt-1 text-sm text-red-600">
							Enter a valid 9-digit Tax ID (e.g., 12-3456789 or 123456789).
						</p>
					{/if}
				</div>
			</div>

			<div class="flex flex-col gap-4 sm:flex-row">
				<div class="w-full">
					<label for="npi" class="required">NPI Number</label>
					<input
						id="npi"
						type="number"
						bind:value={form.npi}
						required
						inputmode="numeric"
						maxlength="10"
						class="input"
					/>

					{#if form.npi && !isValidNPI(form.npi)}
						<p class="mt-1 text-sm text-red-600">
							Please enter a valid 10-digit NPI number (numbers only).
						</p>
					{/if}
				</div>

				<!-- NPI Match -->
				<fieldset class="w-full space-y-2">
					<legend class="font-medium">Does the owner of the NPI match the contact?</legend>
					<div class="flex gap-6">
						<label class="inline-flex items-center gap-2" for="npiYes">
							<input
								id="npiYes"
								type="radio"
								bind:group={form.npiMatchesContact}
								value="yes"
								required
							/>
							<span>Yes</span>
						</label>

						<label class="inline-flex items-center gap-2" for="npiNo">
							<input id="npiNo" type="radio" bind:group={form.npiMatchesContact} value="no" />
							<span>No</span>
						</label>
					</div>
				</fieldset>
			</div>

			<div class="flex w-full gap-1">
				{#if form.npiMatchesContact === 'no'}
					<div class="flex items-start gap-4">
						<input
							id="agree"
							type="checkbox"
							class="mt-1.5"
							bind:checked={form.npiAgreeMatchesContact}
							required
						/>
						<label for="agree" class="required"
							>I acknowledge I will be required provide written approval from the owner of the NPI
							number prior to the account being approved</label
						>
					</div>
				{/if}
			</div>

			<div class="flex flex-col gap-4 md:flex-row">
				<!-- Reseller License -->
				<fieldset class="grid w-full gap-8">
					<legend class="font-medium">Does your business have a reseller’s license?</legend>
					<div class="flex gap-6">
						<label class="inline-flex items-center gap-2" for="resellerYes">
							<input
								id="resellerYes"
								type="radio"
								bind:group={form.hasResellerLicense}
								value="yes"
								required
							/>
							<span>Yes</span>
						</label>

						<label class="inline-flex items-center gap-2" for="resellerNo">
							<input id="resellerNo" type="radio" bind:group={form.hasResellerLicense} value="no" />
							<span>No</span>
						</label>

						<label class="inline-flex items-center gap-2" for="resellerUnsure">
							<input
								id="resellerUnsure"
								type="radio"
								bind:group={form.hasResellerLicense}
								value="unsure"
							/>
							<span>Not sure</span>
						</label>
					</div>
				</fieldset>

				{#if form.hasResellerLicense === 'yes'}
					<div class="w-full">
						<label for="resellerPermit" class="required">Reseller's Permit Number</label>
						<input id="resellerPermit" bind:value={form.resellerPermit} required class="input" />
					</div>
				{/if}
			</div>
		</div>
		{#if form.hasResellerLicense === 'yes'}
			<div class="mt-4 w-full">
				<label for="resellerCertificate" class="required">Upload Reseller’s Certificate</label>
				<input
					id="resellerCertificate"
					type="file"
					required
					onchange={(e) => handleFileUpload(e, 'resellerCertificate')}
					class="input-file"
				/>
			</div>
		{/if}
	</section>

	<!-- Business Address -->
	<section>
		<h2 class="section-title">Business Address</h2>

		<div class="form-grid">
			<div class="md:col-span-2">
				<label for="address" class="required">Address Line 1</label>
				<input id="address" bind:value={form.address} required class="input" />
			</div>
			<div class="flex gap-4">
				<div class="w-full">
					<label for="city" class="required">City</label>
					<input id="city" bind:value={form.city} required class="input" />
				</div>

				<div class="w-full">
					<label for="state" class="required">State</label>
					<input id="state" bind:value={form.state} required class="input" />
				</div>

				<div class="w-full">
					<label for="zip" class="required">Zip Code</label>
					<input id="zip" bind:value={form.zip} required class="input" />
				</div>
			</div>
		</div>
	</section>

	<!-- Verification & Referral -->
	<section>
		<h2 class="section-title">Verification & Referral</h2>

		<div>
			<label for="proofOfBusiness">Upload Proof of Business / License</label>
			<input
				id="proofOfBusiness"
				type="file"
				onchange={(e) => handleFileUpload(e, 'proofOfBusiness')}
				class="input-file"
			/>
			<p class="text-sm text-gray-500">
				Optional at this stage. Clinics may upload a business permit; individual providers may
				upload a license or valid ID. Required later to complete your application.
			</p>
		</div>

		<div class="relative mt-8 w-full">
			<label for="referredbySomeone">Referred by someone?</label>

			<button type="button" class="select-box w-full" onclick={() => (open = !open)}>
				{#if form.referredBy}
					{#each affiliateList as a}
						{#if a.ref_code === form.referredBy}
							{a.first_name} {a.last_name}
						{/if}
					{/each}
				{:else}
					Select Referrer
				{/if}
			</button>

			<!-- Dropdown with search -->
			{#if open}
				<div class="dropdown w-full">
					<input type="text" placeholder="Search..." bind:value={search} />

					{#each filteredList as a}
						<div class="option" onclick={() => selectReferrer(a)}>
							{a.name}
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- <div>
			<h2 class="section-title">Additional Notes</h2>

			<textarea id="notes" bind:value={form.notes} class="input h-24"></textarea>
		</div> -->
	</section>
	<section>
		<div>
			<h2 class="section-title">Additional Notes</h2>

			<!-- <label for="notes">Additional Notes</label> -->
			<textarea id="notes" bind:value={form.notes} class="input h-24"></textarea>
		</div>
	</section>

	<p class="text-sm text-gray-600">
		By registering, you consent to receive email and/or SMS notifications, alerts, and occasional
		marketing communication from Alpha BioMed. Message frequency varies. Message & data rates may
		apply. See our Terms & Conditions and Privacy Policy.
	</p>

	<div class="flex items-center gap-2">
		<input id="agree" type="checkbox" bind:checked={form.agree} required />
		<label for="agree" class="required">I agree to the terms</label>
	</div>

	<button
		type="submit"
		class="btn-primary cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
		disabled={!isFormValid()}
	>
		Submit
	</button>
</form>

<style>
	.section-title {
		font-size: 1.25rem; /* text-xl */
		font-weight: 700; /* font-semibold */
		margin-bottom: 1rem; /* mb-4 */
		color: #1451aa;
	}

	.form-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	@media (min-width: 768px) {
		.form-grid {
			grid-template-columns: repeat(2, 1fr); /* md:grid-cols-2 */
		}
	}

	label {
		display: block; /* block */
		font-weight: 500; /* font-medium */
		color: rgb(55 65 81); /* text-gray-700 */
		margin-bottom: 0.25rem; /* mb-1 */
	}

	label.required::after {
		content: ' *';
		color: rgb(239 68 68); /* text-red-500 */
	}

	.input {
		width: 100%; /* w-full */
		border-radius: 0.375rem; /* rounded */
		border: 1px solid rgb(209 213 219); /* border-gray-300 */
		padding: 0.5rem 0.75rem; /* px-3 py-2 */
	}

	.input:focus {
		outline: none;
		border-color: rgb(59 130 246); /* focus:border-blue-500 */
		box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4); /* focus:ring-2 focus:ring-blue-500 */
	}

	.input-file {
		width: 100%;
		font-size: 0.875rem; /* text-sm */
		color: rgb(55 65 81); /* text-gray-700 */
	}

	/* File input button styles */
	.input-file::-webkit-file-upload-button,
	.input-file::file-selector-button {
		margin-right: 1rem; /* file:mr-4 */
		padding: 0.5rem 1rem; /* file:py-2 file:px-4 */
		border-radius: 0.375rem; /* file:rounded */
		border: none;
		background: rgb(229 231 235); /* file:bg-gray-200 */
		font-size: 0.875rem; /* file:text-sm */
		font-weight: 500; /* file:font-medium */
		cursor: pointer;
	}

	.input-file::-webkit-file-upload-button:hover,
	.input-file::file-selector-button:hover {
		background: rgb(209 213 219); /* hover:file:bg-gray-300 */
	}

	.btn-primary {
		padding: 0.75rem 1.5rem; /* px-6 py-3 */
		background: #f4b357;
		color: white;
		border-radius: 0.375rem; /* rounded */
		font-weight: 600; /* font-semibold */
		transition: background 0.2s ease;
	}

	.btn-primary:hover {
		background: rgb(29 78 216); /* hover:bg-blue-700 */
	}

	.select-box {
		border: 1px solid #ccc;
		padding: 8px;
		cursor: pointer;
		background: white;
		text-align: left;
	}

	.dropdown {
		border: 1px solid #ccc;
		max-height: 200px;
		overflow-y: auto;
		background: white;
		position: absolute;
		z-index: 1000;
	}
	.dropdown input {
		width: 95%;
		margin: 5px;
		padding: 5px;
	}
	.dropdown div.option {
		padding: 8px;
		cursor: pointer;
	}
	.dropdown div.option:hover {
		background: #eee;
	}
</style>
