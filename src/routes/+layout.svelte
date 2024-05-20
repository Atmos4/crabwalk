<script lang="ts">
	import 'uno.css';
	import { FirebaseApp, SignedIn, SignedOut, User } from 'sveltefire';

	import { initializeApp } from 'firebase/app';
	import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
	import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth';

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
				<li>{user.displayName}</li>
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
