const pm2 = require('pm2');

pm2.connect((e0) => {
	if (e0) {
		console.error(e0);
		process.exit();
	}

	pm2.start(
		{
			name: 'bridge',
			script:
				'node --experimental-modules --es-module-specifier-resolution=node ./packages/pomomo-bridge/dist/index.js ',
			env: {
				NODE_CONFIG_DIR: './config',
				NODE_ENV: 'prod',
			},
			autorestart: false,
		},
		(e1, _) => {
			if (e1) {
				console.error(e1);
				return pm2.disconnect();
			}
			console.info('starting bridge');
		},
	);
});

pm2.launchBus((_, bus) => {
	bus.on('process:msg', (msg) => {
		console.info('Received process:msg', msg.data);
		if (msg.data.bridgeReady) {
			startBot();
		} else if (msg.data.restart) {
			return pm2.disconnect();
		}
	});
});

function startBot() {
	pm2.start(
		{
			name: 'bot',
			script:
				'node --experimental-modules --es-module-specifier-resolution=node ./packages/pomomo-bot/dist/index.js ',
			env: {
				NODE_CONFIG_DIR: './config',
				NODE_ENV: 'prod',
				IS_CLUSTERED: true,
			},
			log_date_format: 'HH:mm:ss MM-DD-YYYY',
			time: true,
			autorestart: false,
		},
		(e0, _) => {
			if (e0) {
				console.error(e0);
				return pm2.disconnect();
			}
			console.info('starting bot');
		},
	);
}
