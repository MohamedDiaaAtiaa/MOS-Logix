import { supabase } from './lib/supabaseClient.js';

const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const statusDiv = document.getElementById('status');

function log(msg) {
    statusDiv.textContent = msg + '\n' + statusDiv.textContent;
}

document.getElementById('signUpBtn').addEventListener('click', async () => {
    log('Signing up...');
    const { data, error } = await supabase.auth.signUp({
        email: emailInput.value,
        password: passwordInput.value,
    });
    if (error) log('Error: ' + error.message);
    else log('Success! Check email for confirmation (if enabled). User: ' + data.user?.id);
});

document.getElementById('signInBtn').addEventListener('click', async () => {
    log('Signing in...');
    const { data, error } = await supabase.auth.signInWithPassword({
        email: emailInput.value,
        password: passwordInput.value,
    });
    if (error) log('Error: ' + error.message);
    else log('Signed in as: ' + data.user?.email);
});

document.getElementById('signOutBtn').addEventListener('click', async () => {
    log('Signing out...');
    const { error } = await supabase.auth.signOut();
    if (error) log('Error: ' + error.message);
    else log('Signed out.');
});

document.getElementById('fetchProfileBtn').addEventListener('click', async () => {
    log('Fetching profile...');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        log('No user logged in.');
        return;
    }

    // Ensure 'profiles' table exists and policy allows select
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (error) {
        log('Fetch Error: ' + error.message + ' (Table might not exist?)');
    } else {
        log('Profile Data: ' + JSON.stringify(data));
    }
});
