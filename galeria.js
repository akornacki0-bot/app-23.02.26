let state = { meta: { inv:'', cli:'', adr:'', date:'', auth:'', tel:'', mail:'' }, logo: '', mainImg: '', floors: [] };
let active = { f: null, d: null };

const LEGAL_TEXT = "Niniejszy dokument nie stanowi opinii biegłego sądowego ani orzeczenia rzeczoznawcy w rozumieniu przepisów prawa. Jest to raport z oględzin technicznych dokumentujący stan faktyczny w dniu kontroli.";

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
                document.getElementById('m-photo-box').innerHTML = `<img src="${ev.target.result}">`;
            }
            render();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function rotatePlan(fi) { state.floors[fi].rotation = ((state.floors[fi].rotation || 0) + 90) % 360; render(); }
function addFloor() { state.floors.push({ name: 'Kondygnacja ' + (state.floors.length + 1), plan: '', defects: [], rotation: 0 }); render(); }
function deleteFloor(fi) { if(confirm("Usunąć kondygnację?")) { state.floors.splice(fi, 1); render(); } }

function addDot(e, fi) {
    if (!state.floors[fi].plan) return uploadImg('plan', fi);
    const r = e.currentTarget.getBoundingClientRect();
    const di = state.floors[fi].defects.length;
    state.floors[fi].defects.push({ 
        x: ((e.clientX - r.left)/r.width)*100, 
        y: ((e.clientY - r.top)/r.height)*100, 
        desc: '', norm: '', status: 'to_discuss', img: '' 
    });
    render(); openModal(fi, di);
}

function openModal(fi, di) {
    active = { f: fi, d: di }; const d = state.floors[fi].defects[di];
    document.getElementById('m-title').innerText = "EDYCJA NR " + (di + 1);
    document.getElementById('m-desc').value = d.desc; 
    document.getElementById('m-norm').value = d.norm;
    document.getElementById('m-photo-box').innerHTML = d.img ? `<img src="${d.img}">` : '<small style="color:#a0aec0">KLIKNIJ, ABY DODAĆ ZDJĘCIE</small>';
    document.getElementById('ov').style.display = 'block'; 
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    if(active.f !== null && state.floors[active.f].defects[active.d]) {
        state.floors[active.f].defects[active.d].desc = document.getElementById('m-desc').value;
        state.floors[active.f].defects[active.d].norm = document.getElementById('m-norm').value;
    }
    document.getElementById('ov').style.display = 'none'; document.getElementById('modal').style.display = 'none';
    render();
}

function setStatus(s) { state.floors[active.f].defects[active.d].status = s; closeModal(); }
function deleteReport() { if(confirm("Usunąć?")) { state.floors[active.f].defects.splice(active.d, 1); closeModal(); } }

function exportData() { 
    const a = document.createElement('a'); 
    a.href = URL.createObjectURL(new Blob([JSON.stringify(state)], {type: 'application/json'})); 
    a.download = `Raport_${state.meta.inv || 'projekt'}.json`; 
    a.click(); 
}

function importData(e) { 
    const r = new FileReader(); 
    r.onload = ev => { state = JSON.parse(r.result); render(); }; 
    r.readAsText(e.target.files[0]); 
}

function render() {
    const root = document.getElementById('app'); root.innerHTML = '';
    let pTotal = 1 + state.floors.length + state.floors.reduce((a, f) => a + Math.ceil(f.defects.length / 2), 0);
    let pNum = 0;

    function getP() {
        pNum++; const p = document.createElement('div'); p.className = 'page';
        p.innerHTML = `<div class="header-info">
                         <div>RAPORT: ${state.meta.inv.toUpperCase() || '...'} | ${state.meta.date || ''}</div>
                         ${state.logo ? `<img src="${state.logo}" class="mini-logo">` : ''}
                       </div>
                       <div class="footer-info">
                         <div class="legal-note">${LEGAL_TEXT}</div>
                         <div class="footer-row"><span>STRONA ${pNum} / ${pTotal}</span></div>
                       </div>`;
        return p;
    }

    let allDots = []; state.floors.forEach(f => allDots = allDots.concat(f.defects));
    const rep = allDots.filter(d => d.status === 'reported').length;
    const nrep = allDots.filter(d => d.status === 'not_reported').length;
    document.getElementById('stats-box').innerHTML = `ZGL: ${rep} | NIEZGL: ${nrep} | SUMA: ${allDots.length}`;

    // STRONA TYTUŁOWA
    const cover = document.createElement('div'); cover.className = 'page'; pNum++;
    cover.innerHTML = `
        <div class="logo-box" onclick="uploadImg('logo')">${state.logo ? `<img src="${state.logo}">` : '<b>KLIKNIJ, ABY DODAĆ LOGO</b>'}</div>
        <h1 style="text-align:center; font-size:24px; color:var(--main); margin:15px 0">PROTOKÓŁ ODBIORU TECHNICZNEGO</h1>
        <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:13px">
            <tr><td style="padding:8px 0; width:140px"><span class="info-label">INWESTYCJA</span></td><td><input style="border:none; width:100%; font-weight:700" value="${state.meta.inv}" oninput="state.meta.inv=this.value"></td></tr>
            <tr><td style="padding:8px 0"><span class="info-label">ZAMAWIAJĄCY</span></td><td><input style="border:none; width:100%; font-weight:700" value="${state.meta.cli}" oninput="state.meta.cli=this.value"></td></tr>
            <tr><td style="padding:8px 0"><span class="info-label">ADRES</span></td><td><input style="border:none; width:100%; font-weight:700" value="${state.meta.adr}" oninput="state.meta.adr=this.value"></td></tr>
            <tr><td style="padding:8px 0"><span class="info-label">DATA ODBIORU</span></td><td><input type="date" style="border:none; font-weight:700" value="${state.meta.date}" oninput="state.meta.date=this.value"></td></tr>
            <tr><td style="padding:8px 0"><span class="info-label">SPORZĄDZIŁ</span></td><td><input style="border:none; width:100%; font-weight:700" value="${state.meta.auth}" oninput="state.meta.auth=this.value"></td></tr>
        </table>
        <div class="main-img-box" onclick="uploadImg('main')">${state.mainImg ? `<img src="${state.mainImg}">` : 'DODAJ ZDJĘCIE OBIEKTU'}</div>
        <div class="footer-info">
            <div class="legal-note">${LEGAL_TEXT}</div>
            <div class="footer-row"><span>STRONA 1 / ${pTotal}</span></div>
        </div>`;
    root.appendChild(cover);

    // KONDYGNACJE I USTERKI
    state.floors.forEach((f, fi) => {
        const fPage = getP();
        fPage.innerHTML += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px">
                <input style="font-size:20px; font-weight:800; border:none; color:var(--main); background:transparent" value="${f.name}" oninput="state.floors[${fi}].name=this.value">
                <div class="no-print" style="display:flex; gap:10px">
                    <button class="btn" style="background:var(--nrep)" onclick="rotatePlan(${fi})">Obróć</button>
                    <button class="btn" style="background:#c0392b" onclick="deleteFloor(${fi})">Usuń</button>
                </div>
            </div>
            <div class="plan-wrapper" onclick="addDot(event, ${fi})">
                ${f.plan ? `<img src="${f.plan}" class="plan-img rot-${f.rotation || 0}">` : 'WGRAJ RZUT'}
                ${f.defects.map((d, di) => `<div class="dot ${d.status==='reported'?'c-rep':(d.status==='not_reported'?'c-nrep':'c-none')}" style="left:${d.x}%; top:${d.y}%" onclick="event.stopPropagation(); openModal(${fi},${di})">${di+1}</div>`).join('')}
            </div>`;
        root.appendChild(fPage);

        for (let i = 0; i < f.defects.length; i += 2) {
            const dPage = getP();
            const table = document.createElement('table'); table.className = 'grid-table';
            let html = '';
            for (let j = 0; j < 2; j++) {
                const idx = i + j;
                if (idx < f.defects.length) {
                    const d = f.defects[idx];
                    const sLabel = d.status === 'reported' ? 'ZGŁOSZONE' : (d.status === 'not_reported' ? 'NIEZGŁOSZONE' : 'DO OMÓWIENIA');
                    const sClass = d.status === 'reported' ? 'c-rep' : (d.status === 'not_reported' ? 'c-nrep' : 'c-none');
                    html += `<tr><td onclick="openModal(${fi}, ${idx})">
                                <span class="status-badge ${sClass}">PUNKT NR ${idx+1} | ${sLabel}</span>
                                <div class="desc-text">${d.desc || 'Brak opisu...'}</div>
                                <div style="color:#e74c3c; font-size:11px; font-weight:700;">${d.norm || ''}</div>
                                <div class="q-photo" onclick="event.stopPropagation(); uploadImg('report', ${fi}, ${idx})">
                                    ${d.img ? `<img src="${d.img}">` : '<small style="color:#ccc">DODAJ ZDJĘCIE</small>'}
                                </div>
                            </td></tr>`;
                }
            }
            table.innerHTML = html; dPage.appendChild(table); root.appendChild(dPage);
        }
    });
}

if(!state.floors.length) addFloor();
render();
