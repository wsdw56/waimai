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

    const queryButton = document.getElementById('queryButton');
    const nextButton = document.getElementById('nextButton');
    const prevButton = document.getElementById('prevButton');
    const tokenInput = document.getElementById('tokenInput');
    const statusDiv = document.getElementById('status');
    const responseHeader = document.getElementById('responseHeader');
    const merchantListDiv = document.getElementById('merchantList');
    const paginationControls = document.getElementById('paginationControls');
    const qrModal = document.getElementById('qrModal');
    const qrCodeImg = document.getElementById('qrCodeImg');
    const closeBtn = document.querySelector('.close-btn');
    
    const customCoordsToggle = document.getElementById('customCoordsToggle');
    const customCoordsContainer = document.getElementById('customCoordsContainer');
    const latitudeInput = document.getElementById('latitudeInput');
    const longitudeInput = document.getElementById('longitudeInput');
    
    const debugUnlockButton = document.getElementById('debugUnlockButton');
    const rawResponseContainer = document.getElementById('rawResponseContainer');
    const rawResponseOutput = document.getElementById('rawResponseOutput');

    // --- 应用状态 ---
    let currentPageNum = 0;
    let pageCache = [];
    let isFetching = false;
    let userLatitude = null;
    let userLongitude = null;
    let debugModeEnabled = false;

    // --- 登录逻辑 ---
    function handleLogin() {
        if (usernameInput.value === USERNAME && passwordInput.value === PASSWORD) {
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('isLoggedIn', 'true');
            }
            loginContainer.style.display = 'none';
            appContainer.style.display = 'block';
        } else {
            loginError.textContent = '账号或密码错误！';
        }
    }

    if (localStorage.getItem('isLoggedIn') === 'true') {
        loginContainer.style.display = 'none';
        appContainer.style.display = 'block';
    }
    
    loginButton.addEventListener('click', handleLogin);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // --- 主应用逻辑 ---
    function getUserLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject({ message: "您的浏览器不支持地理定位。" });
            } else {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true, timeout: 8000, maximumAge: 0
                });
            }
        });
    }

    async function fetchData(pageNum, wmContext, token) {
        updateStatus(`正在请求第 ${pageNum + 1} 页...`, "info");
        const baseParams = new URLSearchParams({
            notitlebar: '1', future: '2', scene_id: '179', entry: 'tiantianmiandan',
            wmUserIdDeregistration: '0', wmUuidDeregistration: '1', wm_appversion: '12.46.403',
            wm_ctype: 'mtandroid', userid: '5543192494', 
            uuid: '000000000000005100380EF384E64B6B41161CD779322A174200374470317960',
            personalized: '1', platform: '4', 
            wm_latitude: userLatitude,
            poilist_mt_cityid: '157',
            wm_actual_longitude: userLongitude,
            content_personalized_switch: '0',
            ad_personalized_switch: '0', wm_visitid: '7fd0a8af-6278-4878-9fd4-17ad423cc5ac',
            wm_dversion: '33_13', push_token: 'dpshddfdded7858bc51ace78bf56d28b8d2aatpu',
            app: '0', poilist_wm_cityid: '211000',
            wm_longitude: userLongitude,
            wm_actual_latitude: userLatitude,
            wm_pwh: '1', f: 'android', version: '12.46.403',
            app_model: '0', wm_dtype: 'M2011K2C',
            wm_uuid: '000000000000005100380EF384E64B6B41161CD779322A174200374470317960',
            partner: '4', utm_term: '1200460403', utm_campaign: 'AgroupBgroupC0D500E0Ghomepage',
            ci: '157', utm_medium: 'android', utm_source: 'xiaomi', utm_content: '',
            region_id: '1000341300', region_version: '1763347289584', entry_channel: '2',
            page_size: '10', filterInfo: '', sortType: '0', clicked_poi_str: '',
            clicked_poi_channel: '', ad_page_type: '0',
            token, wm_logintoken: token, page_num: pageNum, wm_context: wmContext || '',
        });
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: baseParams.toString(),
            });
            if (!response.ok) throw new Error(`HTTP 错误! 状态: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('请求失败:', error);
            updateStatus(`请求失败: ${error.message}。请检查浏览器控制台。`, "error");
            return null;
        }
    }
    
    function updateStatus(message, type = 'info') {
        statusDiv.textContent = `状态：${message}`;
        statusDiv.className = `status-${type}`;
    }
    
    function setButtonsState(loading) {
        isFetching = loading;
        queryButton.disabled = loading;
        if (!loading) {
            prevButton.disabled = currentPageNum <= 0;
            const hasNextPage = pageCache[currentPageNum]?.data?.json_data?.page?.hasNextPage;
            nextButton.disabled = !hasNextPage;
        } else {
            prevButton.disabled = true;
            nextButton.disabled = true;
        }
        renderSmartPagination();
    }
    
    function renderSmartPagination() {
        paginationControls.innerHTML = '';
        const totalPages = pageCache.length;
        if (totalPages <= 1) return;

        const createButton = (page, text = page) => {
            const button = document.createElement('button');
            button.textContent = text;
            if (page === currentPageNum + 1) button.classList.add('active');
            button.onclick = () => displayPage(page - 1);
            return button;
        };

        const createEllipsis = () => {
            const span = document.createElement('span');
            span.textContent = '...';
            return span;
        };

        const maxVisible = 7;
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                paginationControls.appendChild(createButton(i));
            }
        } else {
            const current = currentPageNum + 1;
            paginationControls.appendChild(createButton(1));

            if (current > 4) paginationControls.appendChild(createEllipsis());

            let start = Math.max(2, current - 2);
            let end = Math.min(totalPages - 1, current + 2);

            if (current <= 4) end = 5;
            if (current > totalPages - 4) start = totalPages - 4;

            for (let i = start; i <= end; i++) {
                paginationControls.appendChild(createButton(i));
            }

            if (current < totalPages - 3) paginationControls.appendChild(createEllipsis());

            paginationControls.appendChild(createButton(totalPages));
        }
    }

    function displayPage(pageIndex) {
        const responseData = pageCache[pageIndex];
        if (!responseData) return;

        currentPageNum = pageIndex;
        responseHeader.textContent = `商家列表 - 第 ${currentPageNum + 1} 页`;
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
            setButtonsState(false);
            return;
        }

        moduleList.forEach(item => {
            try {
                const adData = JSON.parse(JSON.parse(item.string_data).ad_data);
                const { poi_name: name = '未知商家', distance = '未知距离', scheme } = adData;
                if (!scheme) return;
                
                const merchantElement = document.createElement('div');
                merchantElement.className = 'merchant-item';
                merchantElement.innerHTML = `
                    <div class="merchant-info">
                        <h3>${name}</h3>
                        <p>距离：${distance}</p>
                    </div>
                    <div class="action-buttons">
                        <a href="${scheme}" class="btn direct-link-btn" target="_blank">点此直达</a>
                        <button class="btn copy-link-btn" data-scheme="${scheme}">复制链接</button>
                        <button class="btn qr-code-btn" data-scheme="${scheme}">生成二维码</button>
                    </div>`;
                merchantListDiv.appendChild(merchantElement);
            } catch (e) { console.error("解析商家数据失败:", e); }
        });
        updateStatus(`已显示第 ${currentPageNum + 1} 页的数据。`, "success");
        setButtonsState(false);
    }
    
    async function fetchAndCachePage(pageIndex) {
        if (pageCache[pageIndex]) { displayPage(pageIndex); return; }
        const tokenValue = tokenInput.value.trim();
        // Token check is now done before calling this function
        if (isFetching) return;
        setButtonsState(true);

        const wmContext = pageIndex > 0 ? pageCache[pageIndex - 1].data.json_data.wm_context : '';
        const responseData = await fetchData(pageIndex, wmContext, tokenValue);

        if (responseData && responseData.code === 0) {
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

    function openModal(qrUrl) { qrCodeImg.src = qrUrl; qrModal.style.display = 'flex'; }
    function closeModal() { qrModal.style.display = 'none'; qrCodeImg.src = ''; }
    
    // --- 事件监听器 ---
    customCoordsToggle.addEventListener('change', () => {
        customCoordsContainer.style.display = customCoordsToggle.checked ? 'grid' : 'none';
    });

    queryButton.addEventListener('click', async () => {
        const token = tokenInput.value.trim();
        if (!token) {
            alert('错误：请输入您的Token后再进行查询！');
            updateStatus("错误：Token不能为空。", "error");
            return;
        }

        currentPageNum = 0;
        pageCache = [];
        merchantListDiv.innerHTML = '';
        paginationControls.innerHTML = '';
        responseHeader.textContent = '商家列表';
        queryButton.disabled = true;

        try {
            if (customCoordsToggle.checked) {
                const lat = parseFloat(latitudeInput.value);
                const lon = parseFloat(longitudeInput.value);
                if (isNaN(lat) || isNaN(lon)) {
                    throw new Error("自定义经纬度格式不正确，请输入有效的数字。");
                }
                userLatitude = Math.round(lat * 1000000);
                userLongitude = Math.round(lon * 1000000);
                updateStatus(`使用自定义位置: ${lat}, ${lon}`, "info");
            } else {
                updateStatus("正在请求地理位置权限...", "info");
                const position = await getUserLocation();
                userLatitude = Math.round(position.coords.latitude * 1000000);
                userLongitude = Math.round(position.coords.longitude * 1000000);
                updateStatus(`位置获取成功: ${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`, "success");
            }
            await fetchAndCachePage(0);
        } catch (error) {
            let msg = error.message || "获取地理位置时发生未知错误。";
            if (error.code === 1) msg = "获取地理位置失败，您拒绝了请求。请允许位置权限后重试。";
            updateStatus(msg, "error");
            alert(msg);
            queryButton.disabled = false;
        }
    });

    nextButton.addEventListener('click', () => fetchAndCachePage(currentPageNum + 1));
    prevButton.addEventListener('click', () => { if (currentPageNum > 0) displayPage(currentPageNum - 1); });
    
    closeBtn.onclick = closeModal;
    window.onclick = (event) => { if (event.target == qrModal) closeModal(); };

    merchantListDiv.addEventListener('click', (e) => {
        const target = e.target.closest('.btn');
        if (!target) return;
        
        const scheme = target.dataset.scheme;
        if (target.classList.contains('copy-link-btn')) {
            navigator.clipboard.writeText(scheme).then(() => {
                target.textContent = '已复制!';
                setTimeout(() => { target.textContent = '复制链接'; }, 2000);
            });
        }
        if (target.classList.contains('qr-code-btn')) {
            const qrApiUrl = `https://api.2dcode.biz/v1/create-qr-code?data=${encodeURIComponent(scheme)}`;
            openModal(qrApiUrl);
        }
    });

    debugUnlockButton.addEventListener('click', () => {
        if (debugModeEnabled) {
            debugModeEnabled = false;
            debugUnlockButton.textContent = '🔒 上锁';
            debugUnlockButton.style.backgroundColor = 'var(--secondary-color)';
            rawResponseContainer.style.display = 'none';
        } else {
            const pass = prompt('请输入调试密码:');
            if (pass === DEBUG_PASSWORD) {
                debugModeEnabled = true;
                alert('调试模式已开启！');
                debugUnlockButton.textContent = '🔓 解锁';
                debugUnlockButton.style.backgroundColor = 'var(--success-color)';
                // If there's already data, show it
                if(pageCache.length > 0) {
                    displayPage(currentPageNum);
                }
            } else if (pass !== null) {
                alert('密码错误！');
            }
        }
    });
});