<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	export let form: ActionData;

	let submitCount = 0;
</script>

<h1>Home</h1>

<form
	method="POST"
	use:enhance={() => {
		submitCount++;
		return ({ update }) => {
			// prevent resetting the form after submission
			update({ reset: false });
		};
	}}
>
	<label for="text">Submission</label>
	<input id="text" type="text" name="text" />
	<button>Go</button>
</form>

<p>Submitted {submitCount} times</p>

{#if form?.error}
	{form.error}
{:else if form?.result}
	<p>Transformed: {form.result}</p>
{/if}

<style>
	* > * + * {
		margin-top: 1em;
	}
</style>
