document.addEventListener('DOMContentLoaded', () => {
    // --- 凭证和常量 ---
    const USERNAME = '123';
    const PASSWORD = '321';
    const DEBUG_PASSWORD = '8520';
    const API_URL = 'https://adapi.waimai.meituan.com/api/ad/landingPage';

    // --- 页面元素 ---
    const loginContainer = document.getElementById('loginContainer');
    const appContainer = document.getElementById('appContainer');
    const usernameInput = document.getElementById('usernameInput');
    const passwordInput = document.getElementById('passwordInput');
    const rememberMeCheckbox = document.getElementById('rememberMeCheckbox');
    const loginButton = document.getElementById('loginButton');
    const loginError = document.getElementById('loginError');
    const logoutButton = document.getElementById('logoutButton');
    const pasteTokenButton = document.getElementById('pasteTokenButton');
    const queryButton = document.getElementById('queryButton');
    const nextButton = document.getElementById('nextButton');
    const prevButton = document.getElementById('prevButton');
    const tokenInput = document.getElementById('tokenInput');
    const statusDiv = document.getElementById('status');
    const merchantListDiv = document.getElementById('merchantList');
    const paginationControls = document.getElementById('paginationControls');
    
    const qrModal = document.getElementById('qrModal');
    const qrCodeImg = document.getElementById('qrCodeImg');
    const qrCloseBtn = qrModal.querySelector('.close-btn');
    
    const confirmModal = document.getElementById('confirmModal');
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');

    const customCoordsToggle = document.getElementById('customCoordsToggle');
    const customCoordsContainer = document.getElementById('customCoordsContainer');
    const latitudeInput = document.getElementById('latitudeInput');
    const longitudeInput = document.getElementById('longitudeInput');
    const debugUnlockButton = document.getElementById('debugUnlockButton');
    const rawResponseContainer = document.getElementById('rawResponseContainer');
    const rawResponseOutput = document.getElementById('rawResponseOutput');

    // --- 应用状态 ---
    let currentPageNum = 0, pageCache = [], isFetching = false, userLatitude = null, userLongitude = null, debugModeEnabled = false;

    // --- 登录/登出逻辑 ---
    function handleLogin() {
        if (usernameInput.value === USERNAME && passwordInput.value === PASSWORD) {
            if (rememberMeCheckbox.checked) localStorage.setItem('isLoggedIn_jttt', 'true');
            loginError.style.opacity = 0;
            loginContainer.style.display = 'none';
            appContainer.style.display = 'block';
        } else {
            loginError.textContent = '账号或密码错误！';
            loginError.style.opacity = 1;
        }
    }
    const performLogout = () => { localStorage.removeItem('isLoggedIn_jttt'); location.reload(); };

    if (localStorage.getItem('isLoggedIn_jttt') === 'true') {
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
    }
    
    // --- API & 数据处理 ---
    const getUserLocation = () => new Promise((resolve, reject) => {
        if (!navigator.geolocation) return reject({ message: "您的浏览器不支持地理定位。" });
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
    });

    async function fetchData(pageNum, wmContext, token) {
        updateStatus(`正在请求第 ${pageNum + 1} 页...`, "info");
        const baseParams = new URLSearchParams({
            notitlebar: '1', future: '2', scene_id: '179', entry: 'tiantianmiandan', wmUserIdDeregistration: '0', 
            wmUuidDeregistration: '1', wm_appversion: '12.46.403', wm_ctype: 'mtandroid', userid: '5543192494', 
            uuid: '000000000000005100380EF384E64B6B41161CD779322A174200374470317960',
            personalized: '1', platform: '4', wm_latitude: userLatitude, wm_actual_longitude: userLongitude,
            content_personalized_switch: '0', ad_personalized_switch: '0', wm_visitid: '7fd0a8af-6278-4878-9fd4-17ad423cc5ac',
            wm_dversion: '33_13', push_token: 'dpshddfdded7858bc51ace78bf56d28b8d2aatpu',
            app: '0', wm_longitude: userLongitude, wm_actual_latitude: userLatitude,
            wm_pwh: '1', f: 'android', version: '12.46.403', app_model: '0', wm_dtype: 'M2011K2C',
            wm_uuid: '000000000000005100380EF384E64B6B41161CD779322A174200374470317960',
            partner: '4', utm_term: '1200460403', utm_campaign: 'AgroupBgroupC0D500E0Ghomepage',
            region_id: '1000341300', region_version: '1763347289584', entry_channel: '2',
            page_size: '10', filterInfo: '', sortType: '0', 
            token, wm_logintoken: token, page_num: pageNum, wm_context: wmContext || '',
        });
        try {
            const response = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: baseParams.toString() });
            if (!response.ok) throw new Error(`HTTP 错误! 状态: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('请求失败:', error);
            updateStatus(`请求失败: ${error.message}。`, "error");
            return null;
        }
    }
    
    async function fetchAndCachePage(pageIndex) {
        if (pageCache[pageIndex]) return displayPage(pageIndex);
        if (isFetching) return;
        setButtonsState(true);

        const wmContext = pageIndex > 0 ? pageCache[pageIndex - 1].data.json_data.wm_context : '';
        const responseData = await fetchData(pageIndex, wmContext, tokenInput.value.trim());

        if (responseData?.code === 0) {
            pageCache[pageIndex] = responseData;
            displayPage(pageIndex);
        } else {
            updateStatus(`请求第 ${pageIndex + 1} 页失败，请重试。`, "error");
            merchantListDiv.innerHTML = `<p style="text-align: center; color: var(--danger-color);">请求失败，请检查Token或网络。开启调试模式可查看原始响应。</p>`;
            if(debugModeEnabled && responseData) {
                rawResponseOutput.textContent = JSON.stringify(responseData, null, 2);
                rawResponseContainer.style.display = 'block';
            }
            setButtonsState(false);
        }
    }
    
    // --- UI 更新函数 ---
    const updateStatus = (message, type = 'info') => {
        statusDiv.textContent = `状态：${message}`;
        statusDiv.className = `status-${type}`;
    };
    
    function setButtonsState(loading) {
        isFetching = loading;
        queryButton.disabled = loading;
        if (!loading) {
            prevButton.disabled = currentPageNum <= 0;
            const hasNextPage = pageCache[currentPageNum]?.data?.json_data?.page?.hasNextPage;
            nextButton.disabled = !hasNextPage;
        } else {
            [prevButton, nextButton].forEach(btn => btn.disabled = true);
        }
        renderSmartPagination();
    }
    
    function renderSmartPagination() {
        paginationControls.innerHTML = '';
        const total = pageCache.length, current = currentPageNum + 1;
        if (total <= 1) return;
        const createBtn = p => {
            const btn = document.createElement('button');
            btn.textContent = p;
            if (p === current) btn.classList.add('active');
            btn.onclick = () => displayPage(p - 1);
            paginationControls.appendChild(btn);
        };
        const createEllipsis = () => paginationControls.insertAdjacentHTML('beforeend', '<span>...</span>');
        if (total <= 7) for (let i = 1; i <= total; i++) createBtn(i);
        else {
            createBtn(1);
            if (current > 4) createEllipsis();
            let start = Math.max(2, current - 2), end = Math.min(total - 1, current + 2);
            if (current <= 4) end = 5;
            if (current > total - 4) start = total - 4;
            for (let i = start; i <= end; i++) createBtn(i);
            if (current < total - 3) createEllipsis();
            createBtn(total);
        }
    }

    function displayPage(pageIndex) {
        const responseData = pageCache[pageIndex];
        if (!responseData) return;
        currentPageNum = pageIndex;
        document.getElementById('responseHeader').textContent = `商家列表 - 第 ${pageIndex + 1} 页`;
        merchantListDiv.innerHTML = '';

        if (debugModeEnabled) {
            rawResponseOutput.textContent = JSON.stringify(responseData, null, 2);
            rawResponseContainer.style.display = 'block';
        } else {
            rawResponseContainer.style.display = 'none';
        }

        const moduleList = responseData.data?.module_list;
        if (!moduleList || moduleList.length === 0) {
            merchantListDiv.innerHTML = '<p style="text-align: center; color: var(--text-muted);">当前页没有商家信息。</p>';
            setButtonsState(false); return;
        }
        
        const linkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>`;
        const copyIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
        const qrIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect><line x1="14" y1="14" x2="14" y2="21"></line><line x1="21" y1="14" x2="21" y2="21"></line><line x1="14" y1="14" x2="21" y2="14"></line></svg>`;

        moduleList.forEach(item => {
            try {
                const adData = JSON.parse(JSON.parse(item.string_data).ad_data);
                const { poi_name: name = '未知商家', distance = '未知距离', scheme } = adData;
                if (!scheme) return;
                merchantListDiv.insertAdjacentHTML('beforeend', `
                    <div class="merchant-item">
                        <div class="merchant-main-info"><div class="merchant-info"><h3>${name}</h3><p>距离：${distance}</p></div></div>
                        <div class="action-buttons">
                            <a href="${scheme}" class="btn direct-link-btn" target="_blank">${linkIcon}<span>直达</span></a>
                            <button class="btn copy-link-btn" data-scheme="${scheme}">${copyIcon}<span>复制</span></button>
                            <button class="btn qr-code-btn" data-scheme="${scheme}">${qrIcon}<span>扫码</span></button>
                        </div></div>`);
            } catch (e) { console.error("解析商家数据失败:", e); }
        });
        updateStatus(`已显示第 ${pageIndex + 1} 页的数据。`, "success");
        setButtonsState(false);
    }

    const openModal = (modal) => { modal.style.display = 'flex'; setTimeout(() => modal.classList.add('show'), 10); };
    const closeModal = (modal) => {
        modal.classList.remove('show');
        setTimeout(() => { 
            modal.style.display = 'none'; 
            if(modal === qrModal) qrCodeImg.src = '';
        }, 300);
    };
    
    // --- 事件监听器 ---
    loginButton.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleLogin(); });
    logoutButton.addEventListener('click', () => openModal(confirmModal));
    
    customCoordsToggle.addEventListener('change', () => { customCoordsContainer.classList.toggle('active', customCoordsToggle.checked); });
    
    const handlePaste = (text) => {
        const match = text.match(/token=([^;]+)/);
        tokenInput.value = match?.[1] || text;
    };
    
    tokenInput.addEventListener('paste', (e) => { e.preventDefault(); handlePaste(e.clipboardData.getData('text')); });
    pasteTokenButton.addEventListener('click', async () => {
        try { handlePaste(await navigator.clipboard.readText()); } 
        catch (err) { alert('无法读取剪贴板，请手动粘贴。'); }
    });

    queryButton.addEventListener('click', async () => {
        if (!tokenInput.value.trim()) {
            alert('错误：请输入您的Token后再进行查询！');
            updateStatus("错误：Token不能为空。", "error"); return;
        }
        currentPageNum = 0; pageCache = [];
        merchantListDiv.innerHTML = ''; paginationControls.innerHTML = '';
        queryButton.disabled = true;
        try {
            if (customCoordsToggle.checked) {
                const lat = parseFloat(latitudeInput.value), lon = parseFloat(longitudeInput.value);
                if (isNaN(lat) || isNaN(lon)) throw new Error("自定义经纬度格式不正确。");
                [userLatitude, userLongitude] = [Math.round(lat * 1e6), Math.round(lon * 1e6)];
                updateStatus(`使用自定义位置: ${lat}, ${lon}`, "info");
            } else {
                updateStatus("正在请求地理位置权限...", "info");
                const pos = await getUserLocation();
                [userLatitude, userLongitude] = [Math.round(pos.coords.latitude * 1e6), Math.round(pos.coords.longitude * 1e6)];
                updateStatus(`位置获取成功: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`, "success");
            }
            await fetchAndCachePage(0);
        } catch (error) {
            let msg = error.message || "发生未知错误。";
            if (error.code === 1) msg = "获取地理位置失败，您拒绝了请求。";
            updateStatus(msg, "error");
            alert(msg);
            queryButton.disabled = false;
        }
    });

    nextButton.addEventListener('click', () => fetchAndCachePage(currentPageNum + 1));
    prevButton.addEventListener('click', () => { if (currentPageNum > 0) displayPage(currentPageNum - 1); });
    
    qrCloseBtn.onclick = () => closeModal(qrModal);
    confirmLogoutBtn.onclick = performLogout;
    cancelLogoutBtn.onclick = () => closeModal(confirmModal);
    window.onclick = (event) => { 
        if (event.target == qrModal) closeModal(qrModal);
        if (event.target == confirmModal) closeModal(confirmModal);
    };

    merchantListDiv.addEventListener('click', (e) => {
        const target = e.target.closest('.btn');
        if (!target) return;
        const scheme = target.dataset.scheme;
        if (target.classList.contains('copy-link-btn')) {
            navigator.clipboard.writeText(scheme).then(() => {
                const textSpan = target.querySelector('span');
                textSpan.textContent = '已复制!';
                setTimeout(() => { textSpan.textContent = '复制'; }, 2000);
            });
        } else if (target.classList.contains('qr-code-btn')) {
            openModal(qrModal);
            qrCodeImg.src = `https://api.2dcode.biz/v1/create-qr-code?data=${encodeURIComponent(scheme)}`;
        }
    });

    debugUnlockButton.addEventListener('click', () => {
        if (debugModeEnabled) {
            debugModeEnabled = false;
            debugUnlockButton.innerHTML = '&#128274; 上锁';
            debugUnlockButton.style.backgroundColor = 'var(--secondary-color)';
            rawResponseContainer.style.display = 'none';
        } else {
            const pass = prompt('请输入调试密码:');
            if (pass === DEBUG_PASSWORD) {
                debugModeEnabled = true;
                alert('调试模式已开启！');
                debugUnlockButton.innerHTML = '&#128275; 解锁';
                debugUnlockButton.style.backgroundColor = 'var(--success-color)';
                if(pageCache.length > 0) displayPage(currentPageNum);
            } else if (pass) {
                alert('密码错误！');
            }
        }
    });
});
