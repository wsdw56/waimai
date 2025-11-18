// --- START OF FILE free.js ---

// --- 辅助函数：将 UNIX 时间戳转换为北京时间 ---
function formatTimestamp(timestamp) {
    if (!timestamp || timestamp < 1) return 'N/A';
    const date = new Date(timestamp * 1000);
    // 获取 UTC 时间 (毫秒)
    const utcTimeMs = date.getTime() + (date.getTimezoneOffset() * 60000);
    // 转换为北京时间 (UTC+8)
    const beijingTime = new Date(utcTimeMs + (8 * 60 * 60 * 1000));

    const Y = beijingTime.getFullYear();
    const M = String(beijingTime.getMonth() + 1).padStart(2, '0');
    const D = String(beijingTime.getDate()).padStart(2, '0');
    const h = String(beijingTime.getHours()).padStart(2, '0');
    const m = String(beijingTime.getMinutes()).padStart(2, '0');
    const s = String(beijingTime.getSeconds()).padStart(2, '0');

    return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

// --- 辅助函数：构建 URLSearchParams body ---
function buildFormData(data) {
    const params = new URLSearchParams();
    for (const key in data) {
        if (data.hasOwnProperty(key)) {
            params.append(key, data[key]);
        }
    }
    return params;
}

// --- 调试辅助：打印原始响应到指定区域 ---
function printDebugResponse(id, data) {
    const debugElement = document.getElementById(id);
    if (debugElement) {
        try {
            const jsonString = JSON.stringify(data, null, 2);
            debugElement.innerHTML = `<pre class="json-pre">${jsonString}</pre>`;
        } catch (e) {
            debugElement.innerHTML = `<pre class="json-pre">无法解析为 JSON:\n${String(data)}</pre>`;
        }
    }
}

// --- API 请求函数 ---

// 步骤 1: 获取 UserID
async function step1_getUserId(token) {
    const url = 'https://adapi.waimai.meituan.com/api/ad/landingPage';
    const longitude = '117879508'; 
    const latitude = '30953749';
    
    const data = {
        'wm_logintoken': token, 'token': token, 'userToken': token,
        'wm_longitude': longitude, 'wm_latitude': latitude, 'wm_actual_longitude': longitude, 'wm_actual_latitude': latitude,
        'wm_uuid': '1343752107886690334', 'wm_ctype': 'mt_mp', 'wm_appversion': '5.85.04',
        'wm_visitid': 'd72e4668-5bcd-4b56-a0ba-8153ba3cbbb7', 't': '1', 'c': '2', 'p': 'eLhY-b9z3K4g',
        'notitlebar': '1', 'future': '2', 'scene_id': '179', 'entry': 'tiantianmiandan', 'mt_app_version': '9.46.111',
        'req_time': Date.now(), 'page_num': '0', 'page_size': '10', 'sortType': '0', 'ad_page_type': '0',
        'wm_dtype': 'microsoft', 'wm_dplatform': 'windows', 'ctype': 'mt_mp'
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13)XWEB/14315',
            // 浏览器会禁止或限制设置 Referer 和 Origin，这里保留 Referer 但知道它可能被忽略
            'Referer': 'https://adfec.meituan.com/', 
        },
        body: buildFormData(data)
    });

    if (!response.ok) throw new Error(`步骤 1 (获取UserID) 网络请求失败，状态码: ${response.status}`);
    const resData = await response.json();
    
    printDebugResponse('debug-step1', resData);
    
    if (resData.code !== 0) throw new Error(`步骤 1 API返回错误: ${resData.msg || '未知错误'}`);

    const moduleList = resData.data?.module_list || [];
    let userId = null;
    
    for (const item of moduleList) {
        try {
            const stringData = JSON.parse(item.string_data || '{}');
            const adData = JSON.parse(stringData.ad_data || '{}');
            const chargeInfo = adData.charge_info || '';
            const match = chargeInfo.match(/userId=(\d+)/);
            if (match && match[1]) {
                userId = match[1];
                break;
            }
        } catch (e) { /* ignore parse errors */ }
    }

    if (!userId) throw new Error('步骤 1 无法从响应中解析出 UserID。');
    return userId;
}

// 步骤 2: 获取所有订单ID
async function step2_getAllOrderIds(token, userId) {
    const url = 'https://ordercenter.meituan.com/ordercenter/user/orders';
    const limit = 20;
    
    const params = new URLSearchParams({
        'userid': userId, 'token': token, 'offset': '0', 'limit': String(limit),
        'platformid': '6', 'statusFilter': '0', 'version': '0', 'yodaReady': 'wx', 
        'csecappid': 'wxde8ac0a21135c07d'
    });
    
    const response = await fetch(`${url}?${params.toString()}`, {
        method: 'GET',
        headers: {
            // 删除浏览器不允许设置的 'Host' 和 'm-appkey'
            'token': token, 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13)XWEB/14315',
            // Referer保留，但知道可能被忽略
            'Referer': 'https://servicewechat.com/wxde8ac0a21135c07d/1492/page-frame.html',
            'Accept': 'application/json, text/plain, */*', // 调整为更通用的 Accept 
            'Accept-Language': 'zh-CN,zh;q=0.9'
        }
    });

    if (!response.ok) throw new Error(`步骤 2 (获取订单列表) 网络请求失败，状态码: ${response.status}`);
    const resData = await response.json();

    printDebugResponse('debug-step2', resData);
    
    if (resData.code !== 0) throw new Error(`步骤 2 API返回错误: ${resData.message || '未知错误'}`);
    
    const orders = resData.data?.orders || resData.data?.digest || [];
    
    if (orders.length === 0) throw new Error('步骤 2 订单列表为空。');
    
    return orders.map(o => ({
        id: String(o.orderid),
        title: o.title,
        ordertime: o.ordertime 
    }));
}

// 步骤 3: 获取单个订单详情
async function step3_getSingleOrderDetail(token, userId, orderId) {
    const url = 'https://wx.waimai.meituan.com/weapp/v2/order/historystatus';
    
    const data = {
        'userToken': token, 
        'wm_logintoken': token, 
        'order_view_id': orderId,
        'user_id': userId, 
        'req_time': Date.now()
    };
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'token': token,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13)XWEB/14315',
            // 删除 Referer, 让浏览器自行处理，以减少 CORS 冲突的概率
        },
        body: buildFormData(data)
    });

    if (!response.ok) {
        const text = await response.text();
        return { success: false, raw: text, msg: `HTTP 错误 ${response.status}` };
    }
    const resData = await response.json();
    
    // 检查API返回的业务状态码
    if (resData.code !== 0) {
        return { success: false, raw: resData, msg: resData.msg || 'API返回业务错误' };
    }

    if (resData.data?.status_list) {
        const timestamps = {"订单已提交": "N/A", "支付成功": "N/A", "商家已接单": "N/A"};
        
        for (const status of resData.data.status_list) {
            const desc = status.status_desc;
            if (timestamps.hasOwnProperty(desc)) {
                timestamps[desc] = formatTimestamp(status.status_time);
            }
        }
        return { success: true, timestamps, raw: resData };
    }

    // 无法获取到状态列表也视为失败
    return { success: false, raw: resData, msg: 'API响应成功但缺少订单状态列表' };
}

// --- 主查询函数 ---
async function sendRequest() {
    const rawInput = document.getElementById('token').value.trim();
    let userToken = rawInput.match(/token=([^;]+)/)?.[1] || rawInput;
    
    if (!userToken) {
        alert('请填写您的Token！');
        return;
    }

    const responseContainer = document.getElementById('response');
    const queryBtn = document.getElementById('query-btn');
    const debugStep3Container = document.getElementById('debug-step3');
    
    responseContainer.innerHTML = '<p class="no-result">正在查询中，请稍候...</p>';
    debugStep3Container.innerHTML = '';
    queryBtn.disabled = true;

    // 清空前两步的调试信息
    printDebugResponse('debug-step1', '等待请求...');
    printDebugResponse('debug-step2', '等待请求...');
    
    try {
        // --- 1. 获取 UserID ---
        const userId = await step1_getUserId(userToken);
        
        // --- 2. 获取订单列表 ---
        let orders = await step2_getAllOrderIds(userToken, userId);
        
        // 按订单时间降序排序（最新的在前）
        orders.sort((a, b) => b.ordertime - a.ordertime);

        // --- 3. 串行查询所有订单的详情 ---
        const allResults = [];
        const rawDetails = [];
        
        for (const order of orders) {
            const detail = await step3_getSingleOrderDetail(userToken, userId, order.id);
            allResults.push({ ...order, detail });
            rawDetails.push(detail.raw);
        }

        // 打印所有订单详情的原始响应
        printDebugResponse('debug-step3', rawDetails); 
        
        // --- 4. 格式化输出 ---
        let htmlContent = '<ul class="order-list">';
        
        allResults.forEach(result => {
            const detail = result.detail;
            const statusClass = detail.success ? 'success' : 'error';
            htmlContent += `<li class="order-card ${statusClass}">
                <div class="order-title">${result.title} (${result.id})</div>`;
            
            if (detail.success) {
                htmlContent += `<div class="status-item"><span class="label">订单提交：</span><span class="time">${detail.timestamps['订单已提交']}</span></div>
                                <div class="status-item"><span class="label">订单支付：</span><span class="time">${detail.timestamps['支付成功']}</span></div>
                                <div class="status-item"><span class="label">商家接单：</span><span class="time">${detail.timestamps['商家已接单']}</span></div>`;
            } else {
                const errorMsg = detail.msg ? detail.msg : `HTTP 错误或未知异常，请检查 F12 控制台。`;
                htmlContent += `<p style="color: var(--error-color); margin: 5px 0 0;">
                    ❌ 详情查询失败：${errorMsg}
                </p>`;
            }
            htmlContent += `</li>`;
        });

        htmlContent += '</ul>';
        responseContainer.innerHTML = htmlContent;

    } catch (error) {
        console.error('致命错误:', error);
        
        let errorMessage = error.message;
        if (errorMessage.includes('Failed to fetch') || errorMessage.toLowerCase().includes('cors')) {
            errorMessage += "\n\n⚠️ 极有可能的原因：请求被浏览器同源策略 (CORS) 阻止。\n请使用原始 Python 脚本运行。";
        }
        
        responseContainer.innerHTML = `<p class="no-result" style="color: var(--error-color); border-color: var(--error-color);">查询流程中断！</p>
            <p style="text-align: center; font-size: 14px; color: var(--text-secondary); margin-top: 10px;">原因: ${errorMessage}<br>请检查 Token 有效性或是否存在跨域问题。</p>`;
    } finally {
        queryBtn.disabled = false;
    }
}


// 等待整个HTML页面加载完成后再执行内部的全部代码
document.addEventListener('DOMContentLoaded', () => {

    // --- 获取所有需要操作的页面元素 ---
    const loginContainer = document.getElementById('login-container');
    const mainContainer = document.getElementById('main-container');
    const loginError = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn'); 
    const queryBtn = document.getElementById('query-btn');

    // --- 账号密码列表 ---
    const accounts = [
        { user: "admin", pass: "password123" },
        { user: "lemon", pass: "654321" },
        { user: "testuser", pass: "test" }
    ];

    // --- 自动登录检查逻辑 ---
    const savedUserJSON = localStorage.getItem('rememberedUser');
    if (savedUserJSON) {
        try {
            const savedUser = JSON.parse(savedUserJSON);
            const isValid = accounts.some(acc => acc.user === savedUser.user && acc.pass === savedUser.pass);
            
            if (isValid) {
                loginContainer.style.display = 'none';
                mainContainer.style.display = 'block';
            } else {
                localStorage.removeItem('rememberedUser');
            }
        } catch (e) {
            localStorage.removeItem('rememberedUser');
        }
    }

    // --- 登录处理函数 ---
    function handleLogin() {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const rememberMe = document.getElementById('remember-me').checked;
        loginError.textContent = ''; 

        if (!username || !password) {
            loginError.textContent = '账号和密码不能为空！';
            return;
        }

        const foundUser = accounts.find(acc => acc.user === username);

        if (foundUser) {
            if (foundUser.pass === password) {
                if (rememberMe) {
                    const userToSave = { user: foundUser.user, pass: foundUser.pass };
                    localStorage.setItem('rememberedUser', JSON.stringify(userToSave));
                } else {
                    localStorage.removeItem('rememberedUser');
                }
                
                loginContainer.style.display = 'none';
                mainContainer.style.display = 'block';
            } else {
                loginError.textContent = '密码错误！';
            }
        } else {
            loginError.textContent = '账号不存在！';
        }
    }
    
    // --- 为登录按钮绑定点击事件 ---
    if (loginBtn) {
        loginBtn.addEventListener('click', handleLogin);
    }
    
    // --- 为查询按钮绑定点击事件 ---
    if (queryBtn) {
        queryBtn.addEventListener('click', sendRequest);
    }

});

// --- END OF FILE free.js ---