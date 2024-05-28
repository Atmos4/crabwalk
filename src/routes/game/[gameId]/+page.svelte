<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import crabImage from '$lib/assets/crab-icon.png';
	import { auth, firestore } from '$lib/firebase';
	import {
		computeNewGameState,
		generateWasteObjects,
		getInitialGameState,
		type ObjectType
	} from '$lib/gameLogic';
	import { deleteDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
	import { Doc, userStore } from 'sveltefire';

	const grid = Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, k) => 6 * i + k));

	const user = userStore(auth);

	let error = '';

	let newName = '';

	async function editName(ref: any) {
		if (!newName) return;
		await updateDoc(ref, { name: newName });
		newName = '';
	}

	const labels: any = {
		badGuy: '😈',
		friend: '🙂',
		waste: '🩳'
	};

	async function deleteGame() {
		await deleteDoc(doc(firestore, 'games', $page.params.gameId));
		goto('/');
	}

	function getWasteObjects(data: any): { hidden: ObjectType }[] {
		return data.wasteObjects;
	}

	function getOtherPlayer(data: any) {
		return data.player1.id === $user?.uid ? data.player2 : data.player1;
	}
	function getCurrentPlayer(data: any) {
		return data.player1.id === $user?.uid ? data.player1 : data.player2;
	}

	async function reset(ref: any, data: any) {
		const { objects, player1Objects, player2Objects } = generateWasteObjects();
		const role = Math.floor(Math.random() * 2);
		await setDoc(ref, {
			player1: { ...data.player1, objects: player1Objects, role },
			player2: { ...data.player2, objects: player2Objects, role: 1 - role },
			createdAt: data.createdAt,
			...getInitialGameState(),
			wasteObjects: objects
		});
	}

	function isGameOver(data: any) {
		return data.turn <= 0 || data.lives <= 0;
	}

	function isMyTurn(data: any) {
		return data.turn % 2 != getOtherPlayer(data).role;
	}

	function checkCurrentCell(data: any, i: number, j: number) {
		if (!isMyTurn(data) || isGameOver(data)) {
			return false;
		}
		if (data.placeLobster !== undefined) {
			return data.placeLobster === i && !data.wasteObjects[`${i}_${j}`];
		}
		return getCurrentPlayer(data).role ? i === data.crab.position.x : j === data.crab.position.y;
	}

	function getPhaseLabel(data: any) {
		if (isGameOver(data)) {
			return 'Game over ☹️';
		}
		if (!isMyTurn(data)) {
			return 'Wait for the other player';
		}
		if (data.placeLobster !== undefined) {
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
	{#if !data.player2}
		<p>Waiting for 2nd player...</p>
		<label>
			Code
			<input type="text" readonly value={ref?.id} />
		</label>
	{:else}
		{@const victory = !Object.values(getWasteObjects(data)).filter((v) => v.hidden === 'friend')
			.length}
		<section class="text-center">
			{victory ? 'Victory 🎉' : getPhaseLabel(data)}
		</section>
		<section
			class="grid grid-cols-6 grid-rows-6 bg-gradient-to-b from-yellow to-blue-800 max-w-xl mx-auto cursor-pointer"
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
						on:click={() => !victory && handleClick(data, ref, i, j)}
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
			<p>
				⏰ {data.turn} ❤️ {data.lives}
			</p>
		</section>
	{/if}

	<section>
		<label for="newName">Name: {data.name}</label>
		<form role="group" on:submit|preventDefault={() => editName(ref)}>
			<input type="text" id="newName" bind:value={newName} placeholder={`New name`} />
			<button class="whitespace-nowrap">Change</button>
		</form>
	</section>
	<details>
		<summary>Options</summary>
		{#if data.player2}
			<button on:click={() => reset(ref, data)}>Reset</button>
			<p>Turn {data.turn}</p>
		{/if}
		<button on:click={deleteGame}>Delete</button>
	</details>
</Doc>
