let state = { meta: { inv:'', cli:'', adr:'', date:'', auth:'', tel:'', mail:'' }, logo: '', mainImg: '', floors: [] };
let active = { f: null, d: null };

const LEGAL_TEXT = "Niniejszy dokument nie stanowi opinii biegłego sądowego... (raport techniczny)";

function uploadImg(type, fi, di) {
    const input = document.createElement('input'); 
    input.type = 'file'; 
    input.accept = 'image/*';
    input.onchange = e => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            if(type==='logo') state.logo = ev.target.result;
            else if(type==='main') state.mainImg = ev.target.result;
            else if(type==='plan') state.floors[fi].plan = ev.target.result;
            else if(type==='report') {
                state.floors[fi].defects[di].img = ev.target.result;
                document.getElementById('m-photo-box').innerHTML = `<img src="${ev.target.result}" style="width:100%">`;
            }
            render();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function addDot(e, fi) {
    if (!state.floors[fi].plan) return uploadImg('plan', fi);
    const r = e.currentTarget.getBoundingClientRect();
    const di = state.floors[fi].defects.length;
    // Przeliczenie dotyku na procenty rzutu
    state.floors[fi].defects.push({ 
        x: ((e.clientX - r.left)/r.width)*100, 
        y: ((e.clientY - r.top)/r.height)*100, 
        desc: '', norm: '', status: 'to_discuss', img: '' 
    });
    render(); 
    openModal(fi, di);
}

function openModal(fi, di) {
    active = { f: fi, d: di }; 
    const d = state.floors[fi].defects[di];
    document.getElementById('m-title').innerText = "PUNKT NR " + (di + 1);
    document.getElementById('m-desc').value = d.desc; 
    document.getElementById('m-norm').value = d.norm;
    document.getElementById('m-photo-box').innerHTML = d.img ? `<img src="${d.img}" style="width:100%">` : '<small>DODAJ ZDJĘCIE</small>';
    document.getElementById('ov').style.display = 'block'; 
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    if(active.f !== null && state.floors[active.f].defects[active.d]) {
        state.floors[active.f].defects[active.d].desc = document.getElementById('m-desc').value;
        state.floors[active.f].defects[active.d].norm = document.getElementById('m-norm').value;
    }
    document.getElementById('ov').style.display = 'none'; 
    document.getElementById('modal').style.display = 'none';
    render();
}

function setStatus(s) { state.floors[active.f].defects[active.d].status = s; closeModal(); }
function addFloor() { state.floors.push({ name: 'Kondygnacja ' + (state.floors.length + 1), plan: '', defects: [], rotation: 0 }); render(); }
function exportData() { 
    const data = JSON.stringify(state);
    const blob = new Blob([data], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `Raport_${state.meta.inv || 'projekt'}.json`;
    a.click();
}
function importData(e) {
    const r = new FileReader();
    r.onload = ev => { state = JSON.parse(r.result); render(); };
    r.readAsText(e.target.files[0]);
}

function render() {
    const root = document.getElementById('app');
    root.innerHTML = '';
    // Tutaj generuje się widok na podstawie 'state' (podobnie jak w oryginale, ale z nowymi klasami CSS)
    // ... (Logika renderowania z Twojego index.html dostosowana do nowych klas)
    
    // Uproszczony stat-box dla tabletu
    let allCount = 0;
    state.floors.forEach(f => allCount += f.defects.length);
    document.getElementById('stats-box').innerHTML = `Punkty: <b>${allCount}</b>`;
}

if(!state.floors.length) addFloor();
render();