<script>
	// JSON = JavaScript object notation

	// reading json file
	import tweets from './MuskTweet.json';
	let selectedTweets;

</script>


<main>
	{#if selectedTweets}
		<p><a on:click={() => selectedTweets = null} href="#"> Go back to list</a></p>
		<h1>He tweeted: {selectedTweets.Text}</h1> 
		<p>The tweeted date and time is {selectedTweets.Datetime}</p>
		<p>The post got *{selectedTweets.Likes}* number of likes,
		and *{selectedTweets.Retweets}* number of retweets.</p>
	{:else}
	<ul>
		<h3>Elon Musk's top 10 most liked tweets</h3>
		<p>Select a tweet below for details!</p>
		{#each tweets as tweet}
		<li on:click={() => selectedTweets = tweet}>{tweet.Text}</li>
		{/each}
	</ul>
	{/if}
	<p>Visit the <a href="https://svelte.dev/tutorial">Svelte tutorial</a> to learn how to build Svelte apps.</p>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>