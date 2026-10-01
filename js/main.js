import routes from './routes.js';

// 1. Initialize Supabase Client
// Replace these two strings with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const store = Vue.reactive({
    dark: JSON.parse(localStorage.getItem('dark')) || false,
    user: null, // Stores logged-in Discord user details
    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
    },
});

const app = Vue.createApp({
    data: () => ({ store }),
    async mounted() {
        // Check if user is already logged in on page refresh
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            this.store.user = session.user;
        }

        // Listen for auth state changes (login / logout)
        supabaseClient.auth.onAuthStateChange((_event, session) => {
            this.store.user = session ? session.user : null;
        });
    },
    methods: {
        // 2. Function attached to the "Login with Discord" button
        async loginWithDiscord() {
            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: window.location.origin
                }
            });
            if (error) {
                console.error('Login error:', error.message);
            }
        },
        async logout() {
            await supabaseClient.auth.signOut();
            this.store.user = null;
        }
    }
});

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

app.use(router);

app.mount('#app');
