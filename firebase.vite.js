// firebase.vite.js — StockFlow Pro v9.9.6
// ══════════════════════════════════════════════════════════════════
// Versão do firebase.js para uso com Vite (melhoria #10).
//
// DIFERENÇA em relação a firebase.js:
//   firebase.js       → imports via CDN gstatic.com (funciona sem build)
//   firebase.vite.js  → imports via pacote npm (funciona com Vite)
//
// PARA ATIVAR COM VITE:
//   1. Renomeie firebase.js     → firebase.cdn.js   (backup)
//   2. Renomeie firebase.vite.js → firebase.js       (ativa)
//   3. npm run build
//
// API pública idêntica — nenhum outro módulo precisa mudar.
// ══════════════════════════════════════════════════════════════════

import { initializeApp }
    from 'firebase/app';
import { getFirestore, collection, doc,
         setDoc, getDocs, deleteDoc, onSnapshot }
    from 'firebase/firestore';
import { getAuth, GoogleAuthProvider,
         signInWithPopup, signOut, onAuthStateChanged }
    from 'firebase/auth';

// ── Lê credenciais das variáveis de ambiente Vite ────────────────
// Configure um arquivo .env com VITE_FIREBASE_* antes de rodar o dev server.
// Consulte .env.example para a lista completa das variáveis necessárias.
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
    console.error(
        '[firebase] ⚠️  Variáveis de ambiente Firebase não encontradas.\n' +
        'Copie .env.example para .env e preencha as credenciais do seu projeto.'
    );
}

const FIREBASE_CONFIG = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            || '',
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        || '',
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         || '',
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId:             import.meta.env.VITE_FIREBASE_APP_ID             || '',
};

let _app   = null;
let _db    = null;
let _auth  = null;
let _uid   = null;
let _user  = null;
let _ready = false;
const _readyListeners = [];

export function fbIsAvailable() { return _ready && !!_uid; }
export function fbGetUid()      { return _uid; }
export function fbGetUser()     { return _user; }

export async function initFirebase() {
    try {
        _app  = initializeApp(FIREBASE_CONFIG);
        _db   = getFirestore(_app);
        _auth = getAuth(_app);
        return true;
    } catch (e) {
        console.error('[firebase] Erro ao inicializar SDK:', e);
        return false;
    }
}

export function fbGetCurrentUser() {
    return new Promise(resolve => {
        if (!_auth) { resolve(null); return; }
        const unsub = onAuthStateChanged(_auth, user => {
            unsub();
            if (user) { _uid = user.uid; _user = user; _ready = true; }
            resolve(user || null);
        });
    });
}

export async function fbSignInGoogle() {
    if (!_auth) throw new Error('Firebase não inicializado');
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const cred = await signInWithPopup(_auth, provider);
    _uid   = cred.user.uid;
    _user  = cred.user;
    _ready = true;
    _readyListeners.forEach(fn => fn(_user));
    console.info(`[firebase] ✓ Login Google. UID: ${_uid}`);
    return cred.user;
}

export async function fbSignOut() {
    if (!_auth) return;
    await signOut(_auth);
    _uid   = null;
    _user  = null;
    _ready = false;
}

export function onFirebaseReady(cb) { _readyListeners.push(cb); }

function _colRef(colecao) {
    if (!_db || !_uid) throw new Error('Firebase indisponível');
    return collection(_db, 'users', _uid, colecao);
}

export async function fbSave(colecao, id, dados) {
    if (!fbIsAvailable()) throw new Error('Firebase indisponível');
    await setDoc(doc(_colRef(colecao), id), dados, { merge: true });
}

export async function fbLoad(colecao) {
    if (!fbIsAvailable()) throw new Error('Firebase indisponível');
    const snap = await getDocs(_colRef(colecao));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function fbDelete(colecao, id) {
    if (!fbIsAvailable()) throw new Error('Firebase indisponível');
    await deleteDoc(doc(_colRef(colecao), id));
}

export function fbWatch(colecao, callback) {
    if (!fbIsAvailable()) return () => {};
    return onSnapshot(_colRef(colecao), snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
}
