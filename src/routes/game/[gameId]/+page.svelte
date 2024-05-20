<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { auth, firestore } from '$lib/firebase';
	import {
		collection,
		deleteDoc,
		deleteField,
		doc,
		query,
		setDoc,
		updateDoc
	} from 'firebase/firestore';
	import { Doc, userStore } from 'sveltefire';
	import crabImage from '$lib/assets/crab-icon.png';
	import {
		computeNewGameState,
		generateWasteObjects,
		getNextLobsterRow,
		type ObjectType,
		type WasteObject
	} from '$lib/gameLogic';

	const grid = Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, k) => 6 * i + k));

	const user = userStore(auth);

	let error = '';

	const labels: any = {
		badGuy: '😈',
		friend: '🙂',
		waste: '🩳'
	};

	async function deleteGame() {
		await deleteDoc(doc(firestore, 'games', $page.params.gameId));
		goto('/');
	}

	function getOtherPlayer(data: any) {
		return data.player1.id === $user?.uid ? data.player2 : data.player1;
	}
	function getCurrentPlayer(data: any) {
		return data.player1.id === $user?.uid ? data.player1 : data.player2;
	}

	async function reset(ref: any, data: any) {
		const { objects, player1Objects, player2Objects } = generateWasteObjects();
		await setDoc(ref, {
			player1: { ...data.player1, objects: player1Objects },
			player2: { ...data.player2, objects: player2Objects },
			crab: {
				position: {
					x: 0,
					y: 0
				}
			},
			placeLobster: getNextLobsterRow(),
			lifes: 3,
			turn: 0,
			wasteObjects: objects
		});
	}

	function isMyTurn(data: any) {
		return data.turn % 2 != getOtherPlayer(data).role;
	}

	function checkCurrentCell(data: any, i: number, j: number) {
		if (!isMyTurn(data)) {
			return false;
		}
		if (data.placeLobster !== undefined) {
			return data.placeLobster === i && !data.wasteObjects[`${i}_${j}`];
		}
		return getCurrentPlayer(data).role ? i === data.crab.position.x : j === data.crab.position.y;
	}

	function getPhaseLabel(data: any) {
		if (!isMyTurn(data)) {
			return 'Wait for the other player';
		}
		if (data.placeLobster) {
			return 'Place an evil lobster on the marked row';
		}
		return `Move the crab ${getCurrentPlayer(data).role ? 'horizontally' : 'vertically'}`;
	}

	async function handleClick(data: any, ref: any, i: number, j: number) {
		if (!isMyTurn(data)) {
			error = 'Not your turn yet!';
			return;
		}

		if (!checkCurrentCell(data, i, j)) {
			error = "You can't play here!";
			return;
		}

		const newGameState = computeNewGameState(data, i, j);

		console.log({ newGameState });
		await updateDoc(ref, newGameState);
		error = '';
	}
</script>

<Doc ref={`games/${$page.params.gameId}`} let:data let:ref>
	<a href="/" role="button" class="bg-slate border-slate mb-4">Back</a>
	<button on:click={() => reset(ref, data)}>Reset</button>
	<button on:click={deleteGame}>Delete</button>
	{#if !data.player2}
		<p>Waiting for 2nd player...</p>
		<label>
			Code
			<input type="text" readonly value={ref?.id} />
		</label>
	{:else}
		<section class="text-center">
			{getPhaseLabel(data)}
		</section>
		<section
			class="grid grid-cols-6 grid-rows-6 bg-gradient-to-b from-yellow to-blue-800 max-w-xl mx-auto"
		>
			{#each grid as row, i}
				{#each row as _, j}
					{@const validCell = checkCurrentCell(data, i, j)}
					<!-- svelte-ignore a11y-no-noninteractive-tabindex -->
					<!-- svelte-ignore a11y-no-static-element-interactions -->
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div
						class="h-15 hover:ring c-black grid place-content-center"
						class:ring-slate={validCell}
						class:ring-red={!validCell}
						class:outline-green-6={validCell && data.placeLobster !== undefined}
						class:outline-solid={validCell && data.placeLobster !== undefined}
						tabindex={validCell ? 0 : -1}
						on:click={() => handleClick(data, ref, i, j)}
					>
						{#if data.crab.position.x == i && data.crab.position.y == j}
							<img src={crabImage} alt="crab" class="h-20" />
						{:else if data.wasteObjects[`${i}_${j}`]}
							<div
								class="ring-red"
								class:ring={getCurrentPlayer(data).objects.includes(`${i}_${j}`)}
							>
								{labels[data.wasteObjects[`${i}_${j}`].type]}
							</div>
						{/if}
					</div>
				{/each}
			{/each}
		</section>

		<section class="flex justify-between">
			<p>2nd player: {getOtherPlayer(data).name}</p>
			{#if error}
				<p class="c-red">{error}</p>
			{/if}
			{#if isMyTurn(data)}
				<p>It's your turn!</p>
			{:else}
				<p>It's their turn</p>
			{/if}
		</section>
		<section class="flex justify-between">
			<p>❤️ {data.lifes}, Turn {data.turn}</p>
		</section>
	{/if}
</Doc>
