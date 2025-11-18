// 等待整个HTML页面加载完成后再执行内部的全部代码
document.addEventListener('DOMContentLoaded', () => {

    // --- 获取所有需要操作的页面元素 ---
    const loginContainer = document.getElementById('login-container');
    const mainContainer = document.getElementById('main-container');
    const loginError = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn'); 

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

    // --- 全新修改的查询函数 ---
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

        // 1. 更新API接口地址
        const url = 'https://adapi.waimai.meituan.com/api/ad/expInfo'; 
        const params = new URLSearchParams();

        // 2. 更新请求参数 (保留核心参数，并添加新接口需要的参数)
        ['wm_logintoken', 'token', 'userToken'].forEach(k => params.append(k, userToken));
        Object.entries({
            // 核心身份和位置参数
            wm_longitude: '117879508', 
            wm_latitude: '30953749',
            wm_actual_longitude: '117879508',
            wm_actual_latitude: '30953749',
            req_time: Date.now(),
            // 从抓包中看到的新接口特定参数
            sceneKey: 'waimai_ad_allowance_new_better_exp',
            expKeys: 'hit_free',
            // 其他一些可能需要的环境参数
            wm_uuid: '1343752107886690334',
            wm_ctype: 'mt_mp',
            wm_appversion: '5.85.04',
            ctype: 'mt_mp'
        }).forEach(([key, value]) => params.append(key, value));

        const responseContainer = document.getElementById('response');
        responseContainer.innerHTML = '<p class="no-result">正在查询中，请稍候...</p>';

        try {
            const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' }, body: params });
            if (!response.ok) throw new Error(`网络请求失败，状态码: ${response.status}`);
            
            const data = await response.json();

            // 3. 全新的响应处理逻辑
            if (data.code === 401 || (data.error && data.error.message === "登录失败")) {
                responseContainer.innerHTML = `<p class="no-result" style="color: #d9534f; border-color: #d9534f;">Token无效或已过期, 请输入正确的Token。</p>`;
                return;
            }

            if (data.code === 0 && data.data) {
                const hitStatus = data.data.hit_free;
                let resultMessage = '';

                switch (hitStatus) {
                    case '1':
                        resultMessage = '恭喜！您的最新订单已<strong style="color: #f0ad4e;">免单（待打款）</strong>！';
                        break;
                    case '2':
                        resultMessage = '恭喜！您的最新订单已<strong style="color: #5cb85c;">免单（已打款）</strong>！';
                        break;
                    default:
                        resultMessage = '很遗憾，您的最新订单<strong style="color: #6c757d;">没有命中免单</strong>。<br>Lemon祝您下次成功！';
                        break;
                }
                responseContainer.innerHTML = `<p class="no-result">${resultMessage}</p>`;

            } else {
                // 其他未知情况
                responseContainer.innerHTML = `<p class="no-result">查询完成，但未获取到有效免单状态。<br><small>${data.msg || '未知错误'}</small></p>`;
            }

        } catch (error) {
            console.error('请求失败:', error);
            responseContainer.innerHTML = `<p class="no-result" style="color: #d9534f; border-color: #d9534f;">查询失败！<br><small style="font-weight: normal; color: #6c757d; margin-top: 8px; display: block;">${error.message}<br>请按F12在控制台查看详情，可能是跨域(CORS)策略导致。</small></p>`;
        }
    }
    
    // --- 将需要在HTML中使用的函数暴露到全局 ---
    window.sendRequest = sendRequest;
    
    window.toggleQRCodeModal = function() {
        const qrModal = document.getElementById('qrModal');
        if (qrModal) {
            qrModal.style.display = (qrModal.style.display === 'flex') ? 'none' : 'flex';
        }
    };
    window.onclick = function(event) {
        const qrModal = document.getElementById('qrModal');
        if (event.target == qrModal) { qrModal.style.display = "none"; }
    };
});
