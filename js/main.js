import routes from './routes.js';
import { fetchList } from './content.js';
import { supabase } from './supabase.js';

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
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            this.store.user = session.user;
        }

        supabase.auth.onAuthStateChange((_event, session) => {
            this.store.user = session ? session.user : null;
        });

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
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'discord',
                options: {
                    redirectTo: 'https://fyroluck.github.io/pletlevelslist/',
                    scopes: 'identify guilds.members.read'
                }
            });
            if (error) console.error('Login error:', error.message);
        },
        async logout() {
            await supabase.auth.signOut();
            this.store.user = null;
            this.showSubmitModal = false;
            sessionStorage.removeItem('is_admin_verified');
        },
        async submitRecord() {
            this.submitting = true;
            this.submitMessage = '';

            const user = this.store.user;
            const userName = user.user_metadata.full_name || user.user_metadata.name || user.user_metadata.custom_claims?.global_name;

            const { error } = await supabase
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
