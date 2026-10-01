import routes from './routes.js';
import { fetchList } from './content.js';

const SUPABASE_URL = 'https://pklwtxcadoetlpeubstb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHd0eGNhZG9ldGxwZXVic3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NjUyNTQsImV4cCI6MjEwNjQ0MTI1NH0.z2_d4pJ2Qf9qO3B2jhWf7Z-C7TwxAz_CajozBh7Y_ZI';

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const store = Vue.reactive({
    dark: JSON.parse(localStorage.getItem('dark')) || false,
    user: null,
    toggleDark() {
        this.dark = !this.dark;
        localStorage.setItem('dark', JSON.stringify(this.dark));
    },
});

const app = Vue.createApp({
    data() {
        return {
            store,
            showSubmitModal: false,
            submitting: false,
            submitMessage: '',
            levelListNames: [],
            levelSearch: '',
            showDropdown: false,
            form: {
                level_name: '',
                hz: 240,
                percentage: 100,
                video_url: ''
            }
        };
    },
    computed: {
        filteredLevels() {
            if (!this.levelSearch) return this.levelListNames;
            return this.levelListNames.filter(name => 
                name.toLowerCase().includes(this.levelSearch.toLowerCase())
            );
        }
    },
    async mounted() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (session) {
            this.store.user = session.user;
        }

        supabaseClient.auth.onAuthStateChange((_event, session) => {
            this.store.user = session ? session.user : null;
        });

        // Load level names for dropdown menu
        try {
            const rawList = await fetchList();
            if (rawList) {
                this.levelListNames = rawList
                    .filter(([lvl]) => lvl && lvl.name)
                    .map(([lvl]) => lvl.name);
            }
        } catch (e) {
            console.error('Failed to pre-load level dropdown list', e);
        }
    },
    methods: {
        openModal() {
            this.showSubmitModal = true;
            this.showDropdown = false;
        },
        selectLevel(name) {
            this.form.level_name = name;
            this.levelSearch = name;
            this.showDropdown = false;
        },
        async loginWithDiscord() {
            const { error } = await supabaseClient.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: 'https://fyroluck.github.io/pletlevelslist/',
                    scopes: 'identify guilds.members.read'
                }
            });
            if (error) console.error('Login error:', error.message);
        },
        async logout() {
            await supabaseClient.auth.signOut();
            this.store.user = null;
            this.showSubmitModal = false;
            sessionStorage.removeItem('is_admin_verified');
        },
        async submitRecord() {
            this.submitting = true;
            this.submitMessage = '';

            const user = this.store.user;
            const userName = user.user_metadata.full_name || user.user_metadata.name || user.user_metadata.custom_claims?.global_name;

            const { error } = await supabaseClient
                .from('records')
                .insert([
                    {
                        user_id: user.id,
                        user_name: userName,
                        level_name: this.form.level_name,
                        hz: this.form.hz,
                        percentage: this.form.percentage,
                        video_url: this.form.video_url,
                        status: 'pending'
                    }
                ]);

            this.submitting = false;

            if (error) {
                this.submitMessage = 'Error: ' + error.message;
            } else {
                this.submitMessage = 'Record submitted successfully!';
                this.form = { level_name: '', hz: 240, percentage: 100, video_url: '' };
                this.levelSearch = '';
                setTimeout(() => {
                    this.showSubmitModal = false;
                    this.submitMessage = '';
                }, 2000);
            }
        }
    }
});

const router = VueRouter.createRouter({
    history: VueRouter.createWebHashHistory(),
    routes,
});

app.use(router);
app.mount('#app');
