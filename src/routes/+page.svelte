<script>
	import { goto } from '$app/navigation';
	import { auth, firestore } from '$lib/firebase';

	import { addDoc, collection, or, query, serverTimestamp, where } from 'firebase/firestore';
	import { Collection, userStore } from 'sveltefire';

	const user = userStore(auth);

	async function createNewGame() {
		// Put all logic here to setup the game.
		if (!$user) return;
		if (!window.crypto) return;

		const newRef = await addDoc(collection(firestore, 'games'), {
			player1: {
				id: $user.uid,
				role: 0,
				name: $user.displayName
			},
			createdAt: serverTimestamp()
		});
		goto(`/game/${newRef.id}`);
	}

	const q = query(
		collection(firestore, 'games'),
		or(where('player1.id', '==', $user?.uid), where('player2.id', '==', $user?.uid))
	);
</script>

<section>
	<button on:click={createNewGame}>Start new game</button>
	<a href="join" role="button" class="bg-yellow border-yellow c-black">Join with code</a>
</section>

<Collection ref={q} let:data={games}>
	<ul>
		{#each games as g (g.id)}
			<li><a href="/game/{g.id}">{g.id}</a></li>
		{/each}
	</ul>
</Collection>
