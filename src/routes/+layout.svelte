<script lang="ts">
	import { FirebaseApp, SignedIn, SignedOut } from 'sveltefire';
	import 'uno.css';

	import { page } from '$app/stores';
	import { initializeApp } from 'firebase/app';
	import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';
	import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

	// Initialize Firebase
	const app = initializeApp({
		apiKey: 'AIzaSyCJkOqtDhwPYjRonHTKdMrWVWJFAOdjcXc',
		authDomain: 'crabwalk-64ecb.firebaseapp.com',
		projectId: 'crabwalk-64ecb',
		storageBucket: 'crabwalk-64ecb.appspot.com',
		messagingSenderId: '943485216193',
		appId: '1:943485216193:web:2134d9beda5b79689b7b40'
	});
	const firestore = getFirestore(app);
	const auth = getAuth(app);

	const provider = new GoogleAuthProvider();

	async function signIn() {
		const { user } = await signInWithPopup(auth, provider);
		const existingUser = await getDoc(doc(firestore, 'players', user.uid));
		if (!existingUser.exists()) {
			await setDoc(doc(firestore, 'players', user.uid), {
				name: user.displayName
			});
		}
	}
</script>

<FirebaseApp {auth} {firestore}>
	<SignedIn let:user let:signOut>
		<nav>
			<ul>
				<li>
					{#if $page.data.backLink}
						<a href={$page.data.backLink} role="button" class="bg-slate border-slate mb-4">Back</a>
					{/if}
					<span class="ml-4">{user.displayName}</span>
				</li>
			</ul>
			<ul>
				<li><button on:click={() => signOut()} class="secondary">Sign out</button></li>
			</ul>
		</nav>
		<slot />
	</SignedIn>
	<SignedOut>
		<button on:click={() => signIn()}>Sign in</button>
	</SignedOut>
</FirebaseApp>
