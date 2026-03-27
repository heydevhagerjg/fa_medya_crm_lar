import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

window.Echo = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT ?? 8080,
    wssPort: import.meta.env.VITE_REVERB_PORT === '8080' ? 443 : (import.meta.env.VITE_REVERB_PORT ?? 443),
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    enableLogging: true,
    authorizer: (channel, options) => {
        return {
            authorize: (socketId, callback) => {
                let token = null;
                try {
                    const persisted = localStorage.getItem('crm-auth');
                    if (persisted) {
                        token = JSON.parse(persisted)?.state?.token;
                    }
                } catch (e) {
                    console.error('Echo token fetch error:', e);
                }

                window.axios.post('/api/broadcasting/auth', {
                    socket_id: socketId,
                    channel_name: channel.name
                }, {
                    headers: {
                        Authorization: token ? `Bearer ${token}` : '',
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    withCredentials: true,
                })
                .then(response => {
                    callback(false, response.data);
                })
                .catch(error => {
                    console.error('Broadcasting auth error:', error?.response?.data || error);
                    callback(true, error);
                });
            }
        };
    },
});

