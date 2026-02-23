let state = { meta: { inv:'', cli:'', adr:'', date:'', auth:'', tel:'', mail:'' }, logo: '', mainImg: '', floors: [] };
let active = { f: null, d: null };

const LEGAL_TEXT = "Niniejszy dokument nie stanowi opinii biegłego sądowego ani orzeczenia rzeczoznawcy w rozumieniu przepisów prawa. Jest to raport z oględzin technicznych dokumentujący stan faktyczny w dniu kontroli.";

// FUNKCJE POMOCNICZE
function uploadImg(type, fi, di) {
    const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
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

function addFloor() { 
    state.floors.push({ name: 'Kondygnacja ' + (state.floors.length + 1), plan: '', defects: [], rotation: 0 }); 
    render(); 
}

function deleteFloor(fi) { 
    if(confirm("Usunąć kondygnację?")) { state.floors.splice(fi, 1); render(); } 
}

function rotatePlan(fi) { 
    state.floors[fi].rotation = ((state.floors[fi].rotation || 0) + 90) % 360; 
    render(); 
}

function uploadImg(type, fi, di) {
    const input = document.createElement('input'); 
    input.type = 'file'; 
    input.accept = 'image/*';
    input.onchange = e => {
        const file = e.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            if(type==='plan') state.floors[fi].plan = ev.target.result;
            else if(type==='report') {
                state.floors[fi].defects[di].img = ev.target.result;
            }
            render();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function addDot(e, fi) {
    // Jeśli nie ma rzutu, najpierw go wgraj
    if (!state.floors[fi].plan) return uploadImg('plan', fi);
    
    const r = e.currentTarget.getBoundingClientRect();
    const di = state.floors[fi].defects.length;
    state.floors[fi].defects.push({
        x: ((e.clientX - r.left)/r.width)*100,
        y: ((e.clientY - r.top)/r.height)*100,
        desc: "",
        img: "" // Miejsce na zdjęcie usterki
    });
    render();
    openModal(fi, di); // Otwórz okno edycji od razu po dodaniu
}
// MODAL
function openModal(fi, di) {
    active = { f: fi, d: di }; 
    const d = state.floors[fi].defects[di];
    document.getElementById('m-title').innerText = "EDYCJA NR " + (di + 1);
    document.getElementById('m-desc').value = d.desc; 
    document.getElementById('m-norm').value = d.norm;
    document.getElementById('m-photo-box').innerHTML = d.img ? `<img src="${d.img}" style="width:100%">` : '<small>KLIKNIJ, ABY DODAĆ ZDJĘCIE</small>';
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

function setStatus(s) { 
    if(active.f !== null) {
        state.floors[active.f].defects[active.d].status = s; 
        closeModal(); 
    }
}

function deleteReport() { 
    if(confirm("Usunąć?")) { 
        state.floors[active.f].defects.splice(active.d, 1); 
        closeModal(); 
    } 
}

// EKSPORT / IMPORT
function exportData() { 
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state)], {type: 'application/json'})); 
    a.download = 'Raport.json'; 
    a.click(); 
}

function importData(e) { 
    const r = new FileReader(); 
    r.onload = ev => { state = JSON.parse(r.result); render(); }; 
    r.readAsText(e.target.files[0]); 
}

// GŁÓWNY RENDER
function render() {
    const root = document.getElementById('app');
    root.innerHTML = '';
    
    let allDots = [];
    state.floors.forEach(f => allDots = allDots.concat(f.defects));
    const rep = allDots.filter(d => d.status === 'reported').length;
    const nrep = allDots.filter(d => d.status === 'not_reported').length;
    document.getElementById('stats-box').innerHTML = `ZGL: ${rep} | NIEZGL: ${nrep} | SUMA: ${allDots.length}`;

    // STRONA TYTUŁOWA
    const cover = document.createElement('div'); cover.className = 'page';
    cover.innerHTML = `
        <div class="logo-box" onclick="uploadImg('logo')">
            ${state.logo ? `<img src="${state.logo}" style="max-height:100px">` : '<b>KLIKNIJ, ABY DODAĆ LOGO</b>'}
        </div>
        <h1 style="text-align:center; font-size:20px;">PROTOKÓŁ ODBIORU</h1>
        <div style="display:flex; flex-direction:column; gap:10px; margin:20px 0;">
            <input placeholder="Inwestycja" value="${state.meta.inv}" oninput="state.meta.inv=this.value" style="padding:10px; border:1px solid #ddd">
            <input placeholder="Klient" value="${state.meta.cli}" oninput="state.meta.cli=this.value" style="padding:10px; border:1px solid #ddd">
            <input type="date" value="${state.meta.date}" oninput="state.meta.date=this.value" style="padding:10px; border:1px solid #ddd">
        </div>
        <div class="main-img-box" onclick="uploadImg('main')" style="height:200px; border:2px dashed #ccc; display:flex; align-items:center; justify-content:center; overflow:hidden">
            ${state.mainImg ? `<img src="${state.mainImg}" style="width:100%; height:100%; object-fit:cover;">` : 'DODAJ ZDJĘCIE GŁÓWNE'}
        </div>
    `;
    root.appendChild(cover);

    // KONDYGNACJE
    state.floors.forEach((f, fi) => {
        const fPage = document.createElement('div'); fPage.className = 'page';
        fPage.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px">
                <input value="${f.name}" oninput="state.floors[${fi}].name=this.value" style="font-weight:bold; border:none; font-size:18px">
                <button class="btn" style="background:red" onclick="deleteFloor(${fi})">USUŃ</button>
            </div>
            <div class="plan-wrapper" onclick="addDot(event, ${fi})">
                ${f.plan ? `<img src="${f.plan}" class="plan-img rot-${f.rotation || 0}">` : 'WGRAJ RZUT (KLIKNIJ)'}
                ${f.defects.map((d, di) => `
                    <div class="dot ${d.status==='reported'?'c-rep':(d.status==='not_reported'?'c-nrep':'c-none')}" 
                         style="left:${d.x}%; top:${d.y}%" 
                         onclick="event.stopPropagation(); openModal(${fi},${di})">${di+1}</div>
                `).join('')}
            </div>
        `;
        root.appendChild(fPage);

        // KARTY USTEREK (po 2 na stronę)
        for (let i = 0; i < f.defects.length; i += 2) {
            const dPage = document.createElement('div'); dPage.className = 'page';
            let html = '<div style="display:flex; flex-direction:column; gap:20px">';
            for (let j = 0; j < 2; j++) {
                const idx = i + j;
                if (idx < f.defects.length) {
                    const d = f.defects[idx];
                    html += `
                        <div style="border:1px solid #eee; padding:10px; border-radius:8px" onclick="openModal(${fi}, ${idx})">
                            <b>PUNKT NR ${idx+1}</b> - ${d.status}
                            <div style="margin:10px 0; font-style:italic">${d.desc || 'Brak opisu...'}</div>
                            <div style="height:150px; background:#f9f9f9; display:flex; align-items:center; justify-content:center; overflow:hidden">
                                ${d.img ? `<img src="${d.img}" style="max-height:100%">` : 'BRAK ZDJĘCIA'}
                            </div>
                        </div>
                    `;
                }
            }
            html += '</div>';
            dPage.innerHTML = html;
            root.appendChild(dPage);
        }
    });
}

// START
if(state.floors.length === 0) addFloor();
render();
