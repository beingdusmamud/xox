// Import Firebase modules
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-auth.js';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDDAd8VUWxUw9AIcbOM4h0L0zKxu-ySbnM",
    authDomain: "xoplayv1.firebaseapp.com",
    projectId: "xoplayv1",
    storageBucket: "xoplayv1.firebasestorage.app",
    messagingSenderId: "757035850375",
    appId: "1:757035850375:android:8748c2bb4688a2d0bcf622",
    measurementId: "G-HM5RKYYPXG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loadingSpinner = document.getElementById('loadingSpinner');
const loginForm = document.getElementById('loginForm');
const songForm = document.getElementById('songForm');
const songsList = document.getElementById('songsList');
const loginError = document.getElementById('loginError');
const adminEmail = document.getElementById('adminEmail');
const formTitle = document.getElementById('formTitle');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const addNewBtn = document.getElementById('addNewBtn');
const logoutBtn = document.getElementById('logoutBtn');

let editingSongId = null;
let allSongs = [];

// Auth state observer
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        showDashboard(user);
        loadSongs();
    } else {
        // User is signed out
        showLogin();
    }
});

// Login form handler
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        showLoading();
        await signInWithEmailAndPassword(auth, email, password);
        hideLoading();
    } catch (error) {
        hideLoading();
        showLoginError(error.message);
    }
});

// Logout handler
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error signing out:', error);
    }
});

// Add new song button
addNewBtn.addEventListener('click', () => {
    resetForm();
    formTitle.textContent = 'Add New Song';
    saveBtn.textContent = 'Add Song';
    editingSongId = null;
});

// Cancel button
cancelBtn.addEventListener('click', resetForm);

// Song form handler
songForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveSong();
});

function showLogin() {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    loginError.textContent = '';
}

function showDashboard(user) {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    adminEmail.textContent = user.email;
}

function showLoading() {
    loadingSpinner.classList.remove('hidden');
}

function hideLoading() {
    loadingSpinner.classList.add('hidden');
}

function showLoginError(message) {
    loginError.textContent = message;
}

function resetForm() {
    songForm.reset();
    editingSongId = null;
    formTitle.textContent = 'Add New Song';
    saveBtn.textContent = 'Add Song';
}

async function loadSongs() {
    try {
        showLoading();
        const songsQuery = query(collection(db, 'songs'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(songsQuery);

        allSongs = [];
        songsList.innerHTML = '';

        querySnapshot.forEach((doc) => {
            const song = { id: doc.id, ...doc.data() };
            allSongs.push(song);
            addSongToList(song);
        });

        hideLoading();
    } catch (error) {
        console.error('Error loading songs:', error);
        hideLoading();
        alert('Error loading songs: ' + error.message);
    }
}

function addSongToList(song) {
    const songCard = document.createElement('div');
    songCard.className = 'song-card';
    songCard.innerHTML = `
        <div class="song-cover">
            <img src="${song.coverUrl}" alt="${song.title}" onerror="this.src='https://via.placeholder.com/150?text=No+Image'">
        </div>
        <div class="song-info">
            <h3>${song.title}</h3>
            <p><strong>Artist:</strong> ${song.artist}</p>
            <p><strong>Album:</strong> ${song.album || 'N/A'}</p>
            <p><strong>Duration:</strong> ${formatDuration(song.duration)}</p>
            <p><strong>Genre:</strong> ${song.genre || 'N/A'}</p>
        </div>
        <div class="song-actions">
            <button onclick="editSong('${song.id}')" class="btn-edit">
                <i class="fas fa-edit"></i> Edit
            </button>
            <button onclick="deleteSong('${song.id}')" class="btn-delete">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    `;
    songsList.appendChild(songCard);
}

async function saveSong() {
    const songData = {
        title: document.getElementById('songTitle').value,
        artist: document.getElementById('songArtist').value,
        album: document.getElementById('songAlbum').value,
        duration: parseInt(document.getElementById('songDuration').value),
        audioUrl: document.getElementById('songAudioUrl').value,
        coverUrl: document.getElementById('songCoverUrl').value,
        genre: document.getElementById('songGenre').value,
        createdAt: new Date()
    };

    try {
        showLoading();

        if (editingSongId) {
            // Update existing song
            await updateDoc(doc(db, 'songs', editingSongId), songData);
            alert('Song updated successfully!');
        } else {
            // Add new song
            await addDoc(collection(db, 'songs'), songData);
            alert('Song added successfully!');
        }

        hideLoading();
        resetForm();
        loadSongs(); // Reload the list
    } catch (error) {
        hideLoading();
        console.error('Error saving song:', error);
        alert('Error saving song: ' + error.message);
    }
}

async function editSong(songId) {
    const song = allSongs.find(s => s.id === songId);
    if (!song) return;

    editingSongId = songId;
    document.getElementById('songTitle').value = song.title;
    document.getElementById('songArtist').value = song.artist;
    document.getElementById('songAlbum').value = song.album || '';
    document.getElementById('songDuration').value = song.duration;
    document.getElementById('songAudioUrl').value = song.audioUrl;
    document.getElementById('songCoverUrl').value = song.coverUrl;
    document.getElementById('songGenre').value = song.genre || '';

    formTitle.textContent = 'Edit Song';
    saveBtn.textContent = 'Update Song';
}

async function deleteSong(songId) {
    if (!confirm('Are you sure you want to delete this song?')) {
        return;
    }

    try {
        showLoading();
        await deleteDoc(doc(db, 'songs', songId));
        hideLoading();
        alert('Song deleted successfully!');
        loadSongs(); // Reload the list
    } catch (error) {
        hideLoading();
        console.error('Error deleting song:', error);
        alert('Error deleting song: ' + error.message);
    }
}

function formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Make functions global so they can be called from HTML
window.editSong = editSong;
window.deleteSong = deleteSong;
