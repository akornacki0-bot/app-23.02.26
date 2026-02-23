let state = {
    meta: { inv:'', cli:'', adr:'', date:'', auth:'', tel:'', mail:'' },
    logo: '',
    mainImg: '',
    floors: []
};

let active = { f: null, d: null };

const LEGAL_TEXT = "Niniejszy dokument nie stanowi opinii biegłego sądowego ani orzeczenia rzeczoznawcy w rozumieniu przepisów prawa. Jest to raport z oględzin technicznych dokumentujący stan faktyczny w dniu kontroli. Usterki zostały naniesione poglądowo na podstawie wizji lokalnej.";

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
                document.getElementById('m-photo-box').innerHTML = `<img src="${ev.target.result}" style="width:100%;height:100%;object-fit:contain">`;
            }
            render();
        };
        reader.readAsDataURL(file);
    };
    input.click();
}

function addFloor() {
    state.floors.push({ name: 'NOWA KONDYGNACJA', plan: '', defects: [], rotation: 0 });
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
    render();
    openModal(fi, di);
}

function openModal(fi, di) {
    active = { f: fi, d: di };
    const d = state.floors[fi].defects[di];
    document.getElementById('m-title').innerText = `EDYCJA PUNKTU NR ${di + 1} (${state.floors[fi].name})`;
    document.getElementById('m-desc').value = d.desc;
    document.getElementById('m-norm').value = d.norm;
    document.getElementById('m-photo-box').innerHTML = d.img ? `<img src="${d.img}" style="width:100%;height:100%;object-fit:contain">` : '<p>DODAJ ZDJĘCIE</p>';
    document.getElementById('ov').style.display = 'block';
    document.getElementById('modal').style.display = 'block';
}

function closeModal() {
    if(active.f !== null) {
        const d = state.floors[active.f].defects[active.d];
        d.desc = document.getElementById('m-desc').value;
        d.norm = document.getElementById('m-norm').value;
    }
    document.getElementById('ov').style.display = 'none';
    document.getElementById('modal').style.display = 'none';
    render();
}

function setStatus(s) { state.floors[active.f].defects[active.d].status = s; closeModal(); }
function deleteReport() { if(confirm("CZY NA PEWNO USUNĄĆ TEN PUNKT?")) { state.floors[active.f].defects.splice(active.d, 1); closeModal(); } }

function exportData() {
    const dataStr = JSON.stringify(state);
    const blob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `RAPORT_${state.meta.inv || 'EKSPORT'}.json`;
    link.click();
}

function importData(e) {
    const reader = new FileReader();
    reader.onload = ev => { state = JSON.parse(ev.target.result); render(); };
    reader.readAsText(e.target.files[0]);
}

function render() {
    const app = document.getElementById('app');
    app.innerHTML = '';

    // LICZENIE STRON
    let totalPages = 1; // Strona tytułowa
    state.floors.forEach(f => {
        totalPages += 1; // Strona z rzutem
        totalPages += Math.ceil(f.defects.length / 2); // Karty usterek
    });

    let currentPage = 1;

    function createPageHeader() {
        return `<div class="header-info">
            <div>OBIEKT: ${state.meta.inv || '...'} | ADRES: ${state.meta.adr || '...'}</div>
            ${state.logo ? `<img src="${state.logo}" style="height:12mm">` : ''}
        </div>`;
    }

    function createPageFooter(num) {
        return `<div class="footer-info">
            <div class="legal-note">${LEGAL_TEXT}</div>
            <div style="display:flex; justify-content:space-between; font-size:9px; font-weight:700">
                <span>SYSTEM RAPORTOWANIA v19.15.0</span>
                <span>STRONA ${num} / ${totalPages}</span>
            </div>
        </div>`;
    }

    // 1. STRONA TYTUŁOWA
    const cover = document.createElement('div'); cover.className = 'page';
    cover.innerHTML = `
        <div class="logo-box" onclick="uploadImg('logo')">${state.logo ? `<img src="${state.logo}" style="max-height:100%">` : '<b>DODAJ LOGO FIRMY</b>'}</div>
        <h1 style="text-align:center; font-size:28px; margin:40px 0; color:var(--main)">PROTOKÓŁ Z OGLĘDZIN TECHNICZNYCH</h1>
        <div style="display:grid; grid-template-columns: 180px 1fr; gap:15px; font-size:14px">
            <b>INWESTYCJA:</b> <input value="${state.meta.inv}" oninput="state.meta.inv=this.value" placeholder="...">
            <b>ZAMAWIAJĄCY:</b> <input value="${state.meta.cli}" oninput="state.meta.cli=this.value" placeholder="...">
            <b>ADRES OBIEKTU:</b> <input value="${state.meta.adr}" oninput="state.meta.adr=this.value" placeholder="...">
            <b>DATA KONTROLI:</b> <input type="date" value="${state.meta.date}" oninput="state.meta.date=this.value">
            <b>INSPEKTOR:</b> <input value="${state.meta.auth}" oninput="state.meta.auth=this.value" placeholder="...">
            <b>TELEFON:</b> <input value="${state.meta.tel}" oninput="state.meta.tel=this.value" placeholder="...">
        </div>
        <div class="main-img-box" onclick="uploadImg('main')">${state.mainImg ? `<img src="${state.mainImg}" style="width:100%">` : '<b>DODAJ ZDJĘCIE GŁÓWNE ELEWACJI / OBIEKTU</b>'}</div>
        ${createPageFooter(currentPage++)}
    `;
    app.appendChild(cover);

    // 2. KONDYGNACJE
    state.floors.forEach((f, fi) => {
        const pPage = document.createElement('div'); pPage.className = 'page';
        pPage.innerHTML = `
            ${createPageHeader()}
            <h2 style="margin-top:0">RZUT KONDYGNACJI: ${f.name}</h2>
            <div class="plan-wrapper" onclick="addDot(event, ${fi})">
                ${f.plan ? `<img src="${f.plan}" class="plan-img">` : '<b>KLIKNIJ, ABY WGRAĆ RZUT TEJ KONDYGNACJI</b>'}
                ${f.defects.map((d, di) => `
                    <div class="dot ${d.status==='reported'?'c-rep':(d.status==='not_reported'?'c-nrep':'c-none')}" 
                         style="left:${d.x}%; top:${d.y}%" 
                         onclick="event.stopPropagation(); openModal(${fi}, ${di})">${di+1}</div>
                `).join('')}
            </div>
            ${createPageFooter(currentPage++)}
        `;
        app.appendChild(pPage);

        // 3. KARTY USTEREK (2 NA STRONĘ)
        for(let i=0; i < f.defects.length; i+=2) {
            const dPage = document.createElement('div'); dPage.className = 'page';
            let html = createPageHeader() + `<h2 style="margin-top:0">SZCZEGÓŁY PUNKTÓW KONTROLNYCH - ${f.name}</h2><table class="grid-table">`;
            for(let j=0; j<2; j++) {
                const idx = i+j;
                if(idx < f.defects.length) {
                    const d = f.defects[idx];
                    html += `<tr><td>
                        <div style="display:flex; justify-content:space-between">
                            <b>PUNKT NR ${idx+1}</b>
                            <span style="font-size:10px; color:#fff; padding:2px 8px; border-radius:3px" class="${d.status==='reported'?'c-rep':(d.status==='not_reported'?'c-nrep':'c-none')}">${d.status.toUpperCase()}</span>
                        </div>
                        <div style="margin-top:10px; font-size:13px"><b>OPIS:</b> ${d.desc || 'Brak opisu.'}</div>
                        <div style="margin-top:5px; font-size:11px; color:#e74c3c"><b>NORMA:</b> ${d.norm || 'Nie określono.'}</div>
                        <div class="q-photo" onclick="uploadImg('report', ${fi}, ${idx})">
                            ${d.img ? `<img src="${d.img}">` : '<b>DODAJ ZDJĘCIE</b>'}
                        </div>
                    </td></tr>`;
                }
            }
            html += `</table>${createPageFooter(currentPage++)}`;
            dPage.innerHTML = html;
            app.appendChild(dPage);
        }
    });
}

if(state.floors.length === 0) addFloor();
render();
