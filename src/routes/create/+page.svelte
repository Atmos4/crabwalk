<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, firestore } from '$lib/firebase';

	import { addDoc, collection, or, query, serverTimestamp, where } from 'firebase/firestore';
	import { Collection, userStore } from 'sveltefire';

	const user = userStore(auth);

	let name = '';
	let error = '';

	async function createNewGame() {
		// Put all logic here to setup the game.
		if (!$user) return;
		if (!name) {
			error = 'Enter a name!';
			return;
		}

		const newRef = await addDoc(collection(firestore, 'games'), {
			player1: {
				id: $user.uid,
				role: 0,
				name: $user.displayName
			},
			createdAt: serverTimestamp(),
			name
		});
		goto(`/game/${newRef.id}`);
	}
</script>

<h1>New game</h1>
<label>Name:<input type="text" bind:value={name} /></label>
<button on:click={createNewGame}>Create</button>
{#if error}
	<p class="c-red-5">{error}</p>
{/if}
