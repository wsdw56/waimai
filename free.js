// --- 登录逻辑 ---

const loginContainer = document.getElementById('login-container');
const mainContainer = document.getElementById('main-container');
const loginError = document.getElementById('login-error');

// --- 关键修改：将账号密码直接定义在这里 ---
// 格式：{ user: "用户名", pass: "密码" }
// 您可以在这里添加任意多个账号
const accounts = [
    { user: "123", pass: "321" },
    { user: "111", pass: "222" }
];
// ------------------------------------------

function handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    loginError.textContent = ''; // 先清空之前的错误提示

    if (!username || !password) {
        loginError.textContent = '账号和密码不能为空！';
        return;
    }

    // 从我们定义好的 accounts 列表中查找用户
    const foundUser = accounts.find(acc => acc.user === username);

    if (foundUser) {
        // 找到了账号，再检查密码
        if (foundUser.pass === password) {
            // 密码正确，登录成功
            loginContainer.style.display = 'none';
            mainContainer.style.display = 'block';
        } else {
            // 密码错误
            loginError.textContent = '密码错误！';
        }
    } else {
        // 账号不存在
        loginError.textContent = '账号不存在！';
    }
}


// --- 原有的查询逻辑 (无需改动) ---

const qrModal = document.getElementById('qrModal');
function toggleQRCodeModal() {
    qrModal.style.display = (qrModal.style.display === 'flex') ? 'none' : 'flex';
}
window.onclick = function(event) {
    if (event.target == qrModal) { qrModal.style.display = "none"; }
}

async function sendRequest() {
    const rawInput = document.getElementById('token').value.trim();
    let userToken = '';

    const tokenMatch = rawInput.match(/token=([^;]+)/);
    if (tokenMatch && tokenMatch[1]) {
        userToken = tokenMatch[1];
    } else {
        userToken = rawInput;
    }

    if (!userToken) {
        alert('请填写您的Token！');
        return;
    }

    const longitude = '117879508'; const latitude = '30953749';
    const url = 'https://adapi.waimai.meituan.com/api/ad/landingPage';
    const params = new URLSearchParams();
    ['wm_logintoken', 'token', 'userToken'].forEach(k => params.append(k, userToken));
    Object.entries({
        wm_longitude: longitude, wm_latitude: latitude, wm_actual_longitude: longitude, wm_actual_latitude: latitude,
        wm_uuid: '1343752107886690334', wm_ctype: 'mt_mp', wm_appversion: '5.85.04',
        wm_visitid: 'd72e4668-5bcd-4b56-a0ba-8153ba3cbbb7', t: '1', c: '2', p: 'eLhY-b9z3K4g',
        notitlebar: '1', future: '2', scene_id: '179', entry: 'tiantianmiandan', mt_app_version: '9.46.111',
        req_time: Date.now(), page_num: '0', page_size: '10', sortType: '0', ad_page_type: '0',
        wm_dtype: 'microsoft', wm_dplatform: 'windows', ctype: 'mt_mp'
    }).forEach(([key, value]) => params.append(key, value));

    const responseContainer = document.getElementById('response');
    responseContainer.innerHTML = '<p class="no-result">正在查询中，请稍候...</p>';

    try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: params });
        if (!response.ok) throw new Error(`网络请求失败，状态码: ${response.status}`);
        
        const data = await response.json();
        responseContainer.innerHTML = '';

        if (data.error && data.error.message === "登录失败") {
            responseContainer.innerHTML = `<p class="no-result" style="color: #d9534f; border-color: #d9534f;">无效的Token, 请输入正确的Token。</p>`;
            return;
        }

        let awardList = null;
        if (data?.data?.module_activity_list?.string_data) {
            try {
                const innerData = JSON.parse(data.data.module_activity_list.string_data);
                awardList = innerData.freeOrderRecord;
            } catch (e) { console.error("解析string_data失败:", e); awardList = null; }
        }

        if (awardList && awardList.length > 0) {
            awardList.forEach((item, index) => {
                const price = (item.awardPrice / 100).toFixed(2);
                const date = new Date(item.ctime);
                const dateTimeString = date.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).replace(/\//g, '-');
                const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
                const ctime = `${dateTimeString}.${milliseconds}`;
                let statusText = '';
                switch (item.status) {
                    case 0: statusText = '没免单'; break;
                    case 1: statusText = '免单未打款'; break;
                    case 2: statusText = '免单已打款'; break;
                    default: statusText = `未知状态 (${item.status})`;
                }
                const card = document.createElement('div');
                card.className = 'result-card';
                if (index === 0) { card.classList.add('latest'); }
                card.innerHTML = `
                    <div class="result-item"><span class="label">免单金额:</span><span class="value">${price} 元</span></div>
                    <div class="result-item"><span class="label">商家接单时间:</span><span class="value">${ctime}</span></div>
                    <div class="result-item"><span class="label">免单状态:</span><span class="value">${statusText}</span></div>
                `;
                responseContainer.appendChild(card);
            });
        } else {
            responseContainer.innerHTML = '<p class="no-result">登录成功，您没有被免单过。<br>Lemon祝您下次成功免单！</p>';
        }
    } catch (error) {
        console.error('请求失败:', error);
        responseContainer.innerHTML = `<p class="no-result" style="color: #d9534f; border-color: #d9534f;">查询失败！<br><small style="font-weight: normal; color: #6c757d; margin-top: 8px; display: block;">${error.message}<br>这可能是由于跨域(CORS)策略导致，请按F12在控制台查看详情。</small></p>`;
    }
}
