<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth, firestore } from '$lib/firebase';
	import { generateWasteObjects, getInitialGameState } from '$lib/gameLogic';
	import { doc, updateDoc } from 'firebase/firestore';
	import { userStore } from 'sveltefire';

	let code: string;

	const user = userStore(auth);

	async function submitCode() {
		if (!$user || !code) return;
		// Random role
		const role = Math.floor(Math.random() * 2);

		const { objects, player1Objects, player2Objects } = generateWasteObjects();
		await updateDoc(doc(firestore, 'games', code), {
			player2: {
				id: $user.uid,
				name: $user.displayName,
				role: 1 - role,
				objects: player2Objects
			},
			'player1.role': role,
			'player1.objects': player1Objects,
			...getInitialGameState(),
			wasteObjects: objects
		});
		goto(`/game/${code}`);
	}
</script>

<input type="text" bind:value={code} />
<button on:click={submitCode}>Join</button>
