let state = {
    meta: { inv:'', cli:'', adr:'', date:'', auth:'', tel:'', mail:'' },
    logo: '',
    mainImg: '',
    floors: []
};

let active = { f: null, d: null };

const LEGAL_TEXT = "Niniejszy dokument nie stanowi opinii biegłego sądowego ani orzeczenia rzeczoznawcy w rozumieniu przepisów prawa. Jest to raport z oględzin technicznych dokumentujący stan faktyczny w dniu kontroli. Usterki zostały naniesione poglądowo na podstawie wizji lokalnej.";

// --- FUNKCJE POMOCNICZE ---

// Funkcja zapisu do pamięci przeglądarki
function saveToLocal() {
    localStorage.setItem('inspekcja_backup', JSON.stringify(state));
}

function uploadImg(type, fi, di) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = e => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = ev => {
            if(type==='logo') state.logo = ev.target.result;
            else if(type==='main') state.mainImg = ev.target.result;
            else if(type==='plan') state.floors[fi].plan = ev.target.result;
            else if(type==='report') {
                state.floors[fi].defects[di].img = ev.target.result;
                const box = document.getElementById('m-photo-box');
                if(box) box.innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:contain">`;
            }
            saveToLocal(); // AUTOZAPIS po wgraniu zdjęcia
            render();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = JSON.parse(ev.target.result);
            state.meta = data.meta || state.meta;
            state.logo = data.logo || '';
            state.mainImg = data.mainImg || '';

            let rawPoints = data.defects || data.points || data.items || [];
            let rawFloors = data.floors || data.levels || [];

            if (rawFloors.length > 0) {
                state.floors = rawFloors.map(f => ({
                    name: f.name || "Kondygnacja",
                    plan: f.plan || f.image || '',
                    defects: (f.defects || []).map(d => ({
                        x: parseFloat(d.x) || 0,
                        y: parseFloat(d.y) || 0,
                        desc: d.desc || d.description || '',
                        norm: d.norm || '',
                        status: d.status || 'to_discuss',
                        img: d.img || d.photo || ''
                    }))
                }));
            } else {
                state.floors = [{
                    name: "RZUT GŁÓWNY",
                    plan: data.plan || data.mainImg || '',
                    defects: rawPoints.map(d => ({
                        x: parseFloat(d.x) || 0,
                        y: parseFloat(d.y) || 0,
                        desc: d.desc || d.description || '',
                        norm: d.norm || '',
                        status: d.status || 'to_discuss',
                        img: d.img || d.photo || ''
                    }))
                }];
            }

            saveToLocal(); // Zapisujemy po imporcie
            render();
            const count = state.floors.reduce((a, b) => a + b.defects.length, 0);
            alert("Wczytano pomyślnie!\nKondygnacji: " + state.floors.length + "\nZnalezionych usterek: " + count);
        } catch (err) {
            alert("Błąd: Plik ma nieprawidłowy format.");
        }
    };
    reader.readAsText(file);
}

function addFloor() {
    state.floors.push({ name: 'NOWA KONDYGNACJA', plan: '', defects: [] });
    saveToLocal();
    render();
}

function addDot(e, fi) {
    if (!state.floors[fi].plan) return uploadImg('plan', fi);
    const rect = e.currentTarget.getBoundingClientRect();
    const di = state.floors[fi].defects.length;
    state.floors[fi].defects.push({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
        desc: '', norm: '', status: 'to_discuss', img: ''
    });
    saveToLocal();
    render();
    openModal(fi, di);
}

// --- MODAL & STATUS ---

function openModal(fi, di) {
    active = { f: fi, d: di };
    const d = state.floors[fi].defects[di];
    document.getElementById('m-title').innerText = `PUNKT NR ${di + 1}`;
    document.getElementById('m-desc').value = d.desc;
    document.getElementById('m-norm').value = d.norm;
    document.getElementById('m-photo-box').innerHTML = d.img ? `<img src="${d.img}" style="width:100%;height:100%;object-fit:contain">` : '<p>DODAJ ZDJĘCIE</p>';
    document.getElementById('ov').style.display = 'block';
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    if(active.f !== null && active.d !== null) {
        const d = state.floors[active.f].defects[active.d];
        d.desc = document.getElementById('m-desc').value;
        d.norm = document.getElementById('m-norm').value;
    }
    document.getElementById('ov').style.display = 'none';
    document.getElementById('modal').style.display = 'none';
    saveToLocal(); // Zapisujemy zmiany po zamknięciu edycji
    render();
}

function setStatus(s) { 
    if(active.f !== null) state.floors[active.f].defects[active.d].status = s; 
    closeModal(); 
}

function deleteReport() { 
    if(confirm("USUNĄĆ?")) { 
        state.floors[active.f].defects.splice(active.d, 1); 
        saveToLocal();
        closeModal(); 
    } 
}

function exportData() {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(state)], {type: "application/json"}));
    link.download = `RAPORT_${state.meta.inv || 'PROJEKT'}.json`;
    link.click();
}

// --- GŁÓWNY RENDER ---

function render() {
    const app = document.getElementById('app');
    if(!app) return;
    app.innerHTML = '';

    // Dynamiczne liczenie stron
    let totalPages = 1; 
    state.floors.forEach(f => { totalPages += 1 + Math.ceil(f.defects.length / 2); });
    let currentPage = 1;

    const header = () => `<div class="header-info">
        <div>OBIEKT: ${state.meta.inv || '...'} | ADRES: ${state.meta.adr || '...'}</div>
        ${state.logo ? `<img src="${state.logo}" style="height:10mm">` : ''}
    </div>`;

    const footer = (num) => `<div class="footer-info">
        <div class="legal-note">${LEGAL_TEXT}</div>
        <div style="display:flex; justify-content:space-between; font-size:9px; font-weight:700">
            <span>SYSTEM v19.15.0</span>
            <span>STRONA ${num} / ${totalPages}</span>
        </div>
    </div>`;

    // 1. OKŁADKA
    const cover = document.createElement('div');
    cover.className = 'page';
    cover.innerHTML = `
        <div class="logo-box" onclick="uploadImg('logo')">${state.logo ? `<img src="${state.logo}" style="max-height:100%">` : '<b>DODAJ LOGO</b>'}</div>
        <h1 style="text-align:center; font-size:26px; margin:30px 0;">PROTOKÓŁ OGLĘDZIN</h1>
        <div style="display:grid; grid-template-columns: 150px 1fr; gap:10px; font-size:14px">
            <b>INWESTYCJA:</b> <input value="${state.meta.inv}" oninput="state.meta.inv=this.value; saveToLocal()">
            <b>ADRES:</b> <input value="${state.meta.adr}" oninput="state.meta.adr=this.value; saveToLocal()">
            <b>ZAMAWIAJĄCY:</b> <input value="${state.meta.cli}" oninput="state.meta.cli=this.value; saveToLocal()">
            <b>DATA:</b> <input type="date" value="${state.meta.date}" oninput="state.meta.date=this.value; saveToLocal()">
            <b>INSPEKTOR:</b> <input value="${state.meta.auth}" oninput="state.meta.auth=this.value; saveToLocal()">
        </div>
        <div class="main-img-box" onclick="uploadImg('main')">${state.mainImg ? `<img src="${state.mainImg}" style="width:100%; height:100%; object-fit:contain">` : '<b>DODAJ ZDJĘCIE GŁÓWNE</b>'}</div>
        ${footer(currentPage++)}
    `;
    app.appendChild(cover);

    // 2. KONDYGNACJE
    state.floors.forEach((f, fi) => {
        const pPage = document.createElement('div');
        pPage.className = 'page';
        pPage.innerHTML = `
            ${header()}
            <h2 style="margin-top:0">RZUT: ${f.name}</h2>
            <div class="plan-wrapper" onclick="addDot(event, ${fi})">
                ${f.plan ? `<img src="${f.plan}" class="plan-img">` : '<b>KLIKNIJ, ABY WGRAĆ RZUT</b>'}
                ${f.defects.map((d, di) => {
                    let colorClass = 'c-none'; 
                    if(d.status === 'reported') colorClass = 'c-rep';
                    if(d.status === 'not_reported') colorClass = 'c-nrep';
                    
                    return `<div class="dot ${colorClass}" 
                                 style="left:${d.x}%; top:${d.y}%" 
                                 onclick="event.stopPropagation(); openModal(${fi}, ${di})">${di+1}</div>`;
                }).join('')}
            </div>
            ${footer(currentPage++)}
        `;
        app.appendChild(pPage);

        // SZCZEGÓŁY (Karty po 2 na stronę)
        for(let i=0; i < f.defects.length; i+=2) {
            const dPage = document.createElement('div');
            dPage.className = 'page';
            let html = header() + `<h2 style="margin-top:0">SZCZEGÓŁY - ${f.name}</h2><table class="grid-table">`;
            for(let j=0; j<2; j++) {
                const idx = i+j;
                if(idx < f.defects.length) {
                    const d = f.defects[idx];
                    let colorClass = d.status === 'reported' ? 'c-rep' : (d.status === 'not_reported' ? 'c-nrep' : 'c-none');
                    html += `<tr><td>
                        <div style="display:flex; justify-content:space-between; align-items:center">
                            <b>PUNKT NR ${idx+1}</b>
                            <span class="${colorClass}" style="padding:3px 10px; border-radius:4px; color:white; font-size:10px">${d.status.toUpperCase()}</span>
                        </div>
                        <div style="margin:10px 0; font-size:13px"><b>OPIS:</b> ${d.desc || '...'}</div>
                        <div style="color:red; font-size:11px"><b>NORMA:</b> ${d.norm || '---'}</div>
                        <div class="q-photo">${d.img ? `<img src="${d.img}" style="width:100%; height:100%; object-fit:contain">` : '<b>BRAK ZDJĘCIA</b>'}</div>
                    </td></tr>`;
                }
            }
            dPage.innerHTML = html + `</table>${footer(currentPage++)}`;
            app.appendChild(dPage);
        }
    });
}

// --- ZABEZPIECZENIA ---

window.onbeforeunload = function() {
    if (state.floors.some(f => f.defects.length > 0) || state.meta.inv !== '') {
        return "Masz niezapisane zmiany.";
    }
};

window.onload = function() {
    const backup = localStorage.getItem('inspekcja_backup');
    if (backup) {
        const savedState = JSON.parse(backup);
        if (confirm("Znaleziono zapisany projekt w pamięci. Czy go przywrócić?")) {
            state = savedState;
            render();
        } else {
            // Jeśli nie przywracamy, a startujemy od zera
            if(state.floors.length === 0) addFloor();
        }
    } else {
        if(state.floors.length === 0) addFloor();
    }
};

function clearAllData() {
    if (confirm("CZY NA PEWNO WYCZYŚCIĆ WSZYSTKO? Stracisz wszystkie niezapisane do pliku dane i zdjęcia!")) {
        // Reset stanu do wartości początkowych
        state = {
            meta: { inv:'', cli:'', adr:'', date:'', auth:'', tel:'', mail:'' },
            logo: '',
            mainImg: '',
            floors: []
        };
        
        // Usunięcie kopii z pamięci przeglądarki
        localStorage.removeItem('inspekcja_backup');
        
        // Dodanie pierwszej pustej kondygnacji i odświeżenie widoku
        addFloor();
        render();
        
        alert("Pamięć została wyczyszczona.");
    }
}

render();

