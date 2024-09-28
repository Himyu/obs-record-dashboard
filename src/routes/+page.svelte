<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';

	let webSocketEstablished = false;
	let ws: WebSocket | null = null;
	let log: string[] = [];

	const logEvent = (str: string) => {
		log = [...log, str];
	};

	export let data;
	const obsConfigs = data.obsConfigs;

	const establishWebSocket = () => {
		if (webSocketEstablished) return;
		const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
		ws = new WebSocket(`${protocol}//${window.location.host}/websocket`);
		ws.addEventListener('open', (event) => {
			webSocketEstablished = true;
			console.log('[websocket] connection open', event);
			logEvent('[websocket] connection open');
		});
		ws.addEventListener('close', (event) => {
			console.log('[websocket] connection closed', event);
			logEvent('[websocket] connection closed');
		});
		ws.addEventListener('message', (event) => {
			console.log('[websocket] message received', event);
			logEvent(`[websocket] message received: ${event.data}`);
		});
	};

	onMount(() => {
		establishWebSocket();
	});
</script>

<main class="dark:bg-gray-900 dark:text-white w-full h-[100vh] p-10">
	<h1
		class="inline-block text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight dark:text-slate-200 mb-10"
	>
		OBS Overwatch
	</h1>
	<table class="border-collapse table-auto w-full text-sm mb-10">
		<thead>
			<tr>
				<th
					class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left"
					>#</th
				>
				<th
					class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left"
					>Name</th
				>
				<th
					class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left"
					>IP</th
				>
				<th
					class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left"
					>Port</th
				>
				<th
					class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left"
					>Online</th
				>
				<th
					class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left"
					>Recording</th
				>
				<th
					class="border-b dark:border-slate-600 font-medium p-4 pl-8 pt-0 pb-3 text-slate-400 dark:text-slate-200 text-left"
				></th>
			</tr>
		</thead>
		<tbody class="bg-white dark:bg-slate-800">
			{#each obsConfigs as obs, i}
				<tr>
					<td
						class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-100 dark:text-slate-100"
						>{i}</td
					>
					<td
						class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-100 dark:text-slate-100"
						>{obs.name}</td
					>
					<td
						class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-100 dark:text-slate-100"
						>{obs.ip}</td
					>
					<td
						class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-100 dark:text-slate-100"
						>{obs.port}</td
					>
					<td
						class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-100 dark:text-slate-100"
					></td>
					<td
						class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-100 dark:text-slate-100"
					></td>
					<td
						class="border-b border-slate-100 dark:border-slate-700 p-4 pl-8 text-slate-100 dark:text-slate-100"
					></td>
				</tr>
			{/each}
		</tbody>
	</table>

	<h3
		class="inline-block text-xl font-extrabold text-slate-900 tracking-tight dark:text-slate-200 mb-3"
	>
		Add new Connection
	</h3>

	<form class="max-w-full flex" method="POST" autocomplete="off">
		<div class="mr-5 flex-1">
			<label for="name" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
				>Name</label
			>
			<input
				type="text"
				autocomplete="off"
				id="name"
				name="name"
				class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
				placeholder="OBS-1 ..."
				required
			/>
		</div>
		<div class="mr-5 flex-1">
			<label for="ip" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">IP</label
			>
			<input
				type="text"
				autocomplete="off"
				name="ip"
				id="ip"
				class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
				placeholder="127.0.0.1"
				required
			/>
		</div>
		<div class="mr-5 flex-1">
			<label for="port" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
				>Port</label
			>
			<input
				type="number"
				autocomplete="off"
				name="port"
				value="4455"
				id="port"
				class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
				placeholder="4455 ..."
				required
			/>
		</div>
		<div class="mr-5 flex-1">
			<label for="password" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
				>Password</label
			>
			<input
				type="password"
				autocomplete="off"
				id="password"
				name="password"
				class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
				placeholder="Password ..."
			/>
		</div>

		<button
			type="submit"
			class="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 mt-7"
			>Add connection
		</button>
	</form>
</main>
