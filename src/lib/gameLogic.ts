/* eslint-disable @typescript-eslint/no-explicit-any */
import { deleteField } from 'firebase/firestore';

export type WasteObject = {
	type: ObjectType;
	hidden?: ObjectType;
};

export type ObjectType = 'badGuy' | 'rock' | 'shrimp' | 'friend' | 'waste';

// Function to shuffle the array using Fisher-Yates (aka Knuth) shuffle algorithm
function shuffleArray(array: string[]) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}

export function generateWasteObjects(prefix = '') {
	const gameObjectArray: Record<string, WasteObject> = {};
	const availableCoordinates = [0, 1, 2, 3, 4, 5];
	const firstRowCoordinates = availableCoordinates.filter((_, i) => i != 0);
	const trackCoordinateCount = Array.from(Array(6), () => 0);

	// Create the waste! TODO: later we might want to instead have a pool of card that we take from :)
	for (let i = 0; i < 6; i++) {
		const arrayToUse = (i == 0 ? firstRowCoordinates : availableCoordinates).filter(
			(v) => trackCoordinateCount[v] < 2
		);

		const emptyColumn = trackCoordinateCount.map((v, i) => ({ i, v })).filter((v) => v.v === 0);

		if (emptyColumn.length === 1) {
			console.log('triggerring force fill for column', emptyColumn[0].i);
		}

		const firstIndex =
			emptyColumn.length === 1
				? arrayToUse.indexOf(emptyColumn[0].i)
				: Math.floor(Math.random() * arrayToUse.length);
		const firstCoordinate = arrayToUse[firstIndex];
		const indexOffset = Math.floor(Math.random() * (arrayToUse.length - 1));
		const secondIndex = (firstIndex + 1 + indexOffset) % arrayToUse.length;
		const secondCoordinate = arrayToUse[secondIndex];
		console.log({ firstIndex, firstCoordinate, indexOffset, secondIndex, secondCoordinate });
		if (firstCoordinate === secondCoordinate) {
			console.error({ arrayToUse, firstCoordinate, secondCoordinate });
			throw new Error('You messed up the code you silly goose');
		}

		gameObjectArray[`${prefix}${i}_${firstCoordinate}`] = {
			type: 'waste',
			hidden: 'friend'
		};
		gameObjectArray[`${prefix}${i}_${secondCoordinate}`] = {
			type: 'waste',
			hidden: 'friend'
		};

		trackCoordinateCount[firstCoordinate]++;
		trackCoordinateCount[secondCoordinate]++;
		console.log('end of pass', trackCoordinateCount);
	}

	// TODO: assign some evil objects
	const randomCoordinates = shuffleArray(Object.keys(gameObjectArray)).slice(0, 4);
	randomCoordinates.forEach((c) => (gameObjectArray[c].hidden = 'badGuy'));
	return {
		objects: gameObjectArray,
		player1Objects: randomCoordinates.slice(0, 2),
		player2Objects: randomCoordinates.slice(2, 4)
	};
}

function handleXCrabOffset(data: any, i: number, j: number) {
	let x = data.crab.position.x;
	if (x === i) {
		return false;
	}
	const offset = i > x ? 1 : -1;
	for (x += offset; x != i; x += offset) {
		if (data.wasteObjects[`${x}_${j}`] && data.wasteObjects[`${x}_${j}`].type === 'badGuy') {
			return true;
		}
	}
}
function handleYCrabOffset(data: any, i: number, j: number) {
	let y = data.crab.position.y;
	if (y === j) {
		return false;
	}
	const offset = j > y ? 1 : -1;
	for (y += offset; y != j; y += offset) {
		if (data.wasteObjects[`${i}_${y}`] && data.wasteObjects[`${i}_${y}`].type === 'badGuy') {
			return true;
		}
	}
}

export function getNextLobsterRow(data?: any) {
	if (!data) {
		return Math.floor(Math.random() * 6);
	}
	const array = Object.keys(data.wasteObjects)
		.reduce<number[]>(
			(rv, k) => {
				const computedIndex = Number(k.substring(0, 1));
				rv[computedIndex]++;
				return rv;
			},
			Array.from(Array(6), () => 0)
		)
		.map((v, k) => ({ k, v }))
		.filter((v) => v.v < 4);
	return array[Math.floor(Math.random() * array.length)].k;
}

export function computeNewGameState(data: any, i: number, j: number) {
	const newGameState: any = {
		lifes: data.lifes
	};
	if (
		data.placeLobster !== undefined &&
		data.placeLobster === i &&
		!data.wasteObjects[`${i}_${j}`]
	) {
		newGameState[`wasteObjects.${i}_${j}`] = {
			type: 'badGuy'
		};
		newGameState.placeLobster = deleteField();
		return newGameState;
	}

	newGameState.turn = data.turn + 1;
	newGameState['crab.position.x'] = i;
	newGameState['crab.position.y'] = j;
	newGameState.placeLobster = getNextLobsterRow(data);
	const hasCrossedBadGuy = handleXCrabOffset(data, i, j) || handleYCrabOffset(data, i, j);
	if (hasCrossedBadGuy) {
		newGameState.lifes--;
	}
	const object: WasteObject | undefined = data.wasteObjects[`${i}_${j}`] ?? undefined;
	console.log({ object });
	if (object) {
		switch (object.type) {
			case 'waste':
				if (object.hidden === 'badGuy') {
					newGameState.lifes -= 2;
				}
				newGameState[`wasteObjects.${i}_${j}.type`] = object.hidden;
				newGameState[`wasteObjects.${i}_${j}.hidden`] = deleteField();
				break;
			case 'badGuy':
				if (!hasCrossedBadGuy) {
					newGameState.lifes--;
				}
				break;
			//TODO Handle other types here
		}
	}
	return newGameState;
}
