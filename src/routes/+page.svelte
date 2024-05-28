<script>
	import { goto } from '$app/navigation';
	import { auth, firestore } from '$lib/firebase';

	import { addDoc, collection, or, query, serverTimestamp, where } from 'firebase/firestore';
	import { Collection, userStore } from 'sveltefire';

	const user = userStore(auth);

	async function createNewGame() {
		// Put all logic here to setup the game.
		if (!$user) return;

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
	<a href="/create" role="button">Start new game</a>
	<a href="join" role="button" class="bg-yellow border-yellow c-black">Join with code</a>
</section>

<Collection ref={q} let:data={games}>
	{#each games as g (g.id)}
		<article>
			<div class="flex justify-between">
				<a href="/game/{g.id}">{g.name ?? g.createdAt.toDate().toLocaleString()}</a>
				<span>{g.createdAt.toDate().toLocaleDateString()}</span>
			</div>

			<span>{g.player2 ? `${g.player2.name}` : 'Invite someone!'}</span>
		</article>
	{/each}
</Collection>
