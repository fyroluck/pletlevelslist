import routes from './routes.js';

// 1. Initialize Supabase Client
// Replace these two strings with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const supabaseClient = window.supabase.createClient(https://pklwtxcadoetlpeubstb.supabase.co/rest/v1/, eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHd0eGNhZG9ldGxwZXVic3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NjUyNTQsImV4cCI6MjEwNjQ0MTI1NH0.z2_d4pJ2Qf9qO3B2jhWf7Z-C7TwxAz_CajozBh7Y_ZI);

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
