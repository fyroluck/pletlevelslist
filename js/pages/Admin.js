import { store } from '../main.js';

export default {
    template: `
        <div class="page-admin" style="padding: 40px; max-width: 1000px; margin: 0 auto; color: #fff;">
            <h1 style="font-size: 28px; font-weight: bold; margin-bottom: 20px;">Admin Record Review</h1>

            <div v-if="loading" style="font-size: 18px; color: #aaa;">
                Checking admin permissions...
            </div>

            <div v-else-if="!isAdmin" style="background: #e74c3c22; border: 1px solid #e74c3c; padding: 20px; border-radius: 8px;">
                <h3 style="color: #e74c3c; font-weight: bold;">Access Denied</h3>
                <p style="margin-top: 8px; color: #ddd;">
                    You do not have the required Discord Admin role to view this page, or your session has expired. Try logging out and logging back in with Discord.
                </p>
            </div>

            <div v-else>
                <div v-if="fetchingRecords" style="color: #aaa;">Loading pending submissions...</div>
                
                <div v-else-if="pendingRecords.length === 0" style="background: #2a2a2a; padding: 20px; border-radius: 8px; text-align: center; color: #aaa;">
                    🎉 No pending records to review!
                </div>

                <div v-else style="display: flex; flex-direction: column; gap: 15px;">
                    <div 
                        v-for="record in pendingRecords" 
                        :key="record.id" 
                        style="background: #2a2a2a; border: 1px solid #444; padding: 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; gap: 20px;"
                    >
                        <div>
                            <h3 style="font-size: 20px; font-weight: bold; color: #5865F2;">{{ record.level_name }}</h3>
                            <p style="margin-top: 5px; color: #bbb;">
                                Submitted by: <strong>{{ record.user_name }}</strong> | 
                                Refresh Rate: <strong>{{ record.hz }}Hz</strong> | 
                                Progress: <strong>{{ record.percentage }}%</strong>
                            </p>
                            <a 
                                :href="record.video_url" 
                                target="_blank" 
                                style="display: inline-block; margin-top: 8px; color: #3498db; text-decoration: underline;"
                            >
                                📺 Watch Proof Video
                            </a>
                        </div>

                        <div style="display: flex; gap: 10px;">
                            <button 
                                @click="updateStatus(record.id, 'approved')" 
                                style="background: #2ecc71; color: #fff; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;"
                            >
                                Approve
                            </button>
                            <button 
                                @click="updateStatus(record.id, 'rejected')" 
                                style="background: #e74c3c; color: #fff; border: none; padding: 10px 16px; border-radius: 6px; cursor: pointer; font-weight: bold;"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    data() {
        return {
            isAdmin: false,
            loading: true,
            fetchingRecords: false,
            pendingRecords: []
        };
    },
    async mounted() {
        await this.checkAdminRole();
        if (this.isAdmin) {
            await this.fetchPendingRecords();
        }
        this.loading = false;
    },
    methods: {
        async checkAdminRole() {
            // Use cached authorization if already validated in this browser session
            if (sessionStorage.getItem('is_admin_verified') === 'true') {
                this.isAdmin = true;
                return;
            }

            const GUILD_ID = '1531527778690924644';
            const ADMIN_ROLE_ID = '1555287625760510083';

            const SUPABASE_URL = 'https://pklwtxcadoetlpeubstb.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHd0eGNhZG9ldGxwZXVic3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NjUyNTQsImV4cCI6MjEwNjQ0MTI1NH0.z2_d4pJ2Qf9qO3B2jhWf7Z-C7TwxAz_CajozBh7Y_ZI';
            const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            const { data: { session } } = await supabaseClient.auth.getSession();
            
            if (!session || !session.provider_token) {
                this.isAdmin = false;
                return;
            }

            try {
                const res = await fetch(`https://discord.com/api/v10/users/@me/guilds/${GUILD_ID}/member`, {
                    headers: { Authorization: `Bearer ${session.provider_token}` }
                });

                if (!res.ok) {
                    this.isAdmin = false;
                    return;
                }

                const member = await res.json();
                this.isAdmin = Array.isArray(member.roles) && member.roles.includes(ADMIN_ROLE_ID);

                if (this.isAdmin) {
                    sessionStorage.setItem('is_admin_verified', 'true');
                }
            } catch (err) {
                console.error('Failed to verify admin status:', err);
                this.isAdmin = false;
            }
        },
        async fetchPendingRecords() {
            this.fetchingRecords = true;
            const SUPABASE_URL = 'https://pklwtxcadoetlpeubstb.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHd0eGNhZG9ldGxwZXVic3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NjUyNTQsImV4cCI6MjEwNjQ0MTI1NH0.z2_d4pJ2Qf9qO3B2jhWf7Z-C7TwxAz_CajozBh7Y_ZI';
            const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            const { data, error } = await supabaseClient
                .from('records')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: true });

            if (!error && data) {
                this.pendingRecords = data;
            }
            this.fetchingRecords = false;
        },
        async updateStatus(id, newStatus) {
            const SUPABASE_URL = 'https://pklwtxcadoetlpeubstb.supabase.co';
            const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBrbHd0eGNhZG9ldGxwZXVic3RiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4NjUyNTQsImV4cCI6MjEwNjQ0MTI1NH0.z2_d4pJ2Qf9qO3B2jhWf7Z-C7TwxAz_CajozBh7Y_ZI';
            const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            const { error } = await supabaseClient
                .from('records')
                .update({ status: newStatus })
                .eq('id', id);

            if (error) {
                alert('Failed to update record status: ' + error.message);
            } else {
                // Remove from local array instantly
                this.pendingRecords = this.pendingRecords.filter(r => r.id !== id);
            }
        }
    }
};
