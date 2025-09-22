// 工具函数封装
const Tool = {
    isIOS: () => /iphone|ipad|ipod/i.test(navigator.userAgent),
    isAndroid: () => /android/i.test(navigator.userAgent),
    
    extractPoiId: (text) => {
        try {
            const url = new URL(text.trim());
            return url.searchParams.get("poi_id_str") || "";
        } catch(e) {
            const match = text.match(/poi[_]?id[_]?str?=([\w\-_]+)/i);
            return match ? match[1] : "";
        }
    },
    
    copyToClipboard: (text) => {
        if (navigator.clipboard) {
            return navigator.clipboard.writeText(text);
        }
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        return successful ? Promise.resolve() : Promise.reject(new Error('复制失败'));
    },
    
    showToast: (content, duration = 2500) => {
        const toast = document.getElementById('globalToast');
        toast.innerHTML = content;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), duration);
    },
    
    setBtnLoading: (btnId, isLoading = true) => {
        const btn = document.getElementById(btnId);
        if (isLoading) {
            btn.innerHTML = '<span class="loading"></span>处理中...';
            btn.disabled = true;
        } else {
            const btnTextMap = {
                pasteBtn: '<i class="fas fa-paste"></i> 粘贴',
                goBtn: '<i class="fas fa-external-link-alt"></i> Go 跳转领券',
                homeBtn: '<i class="fas fa-home"></i> 进入美团外卖主页',
                didiBtn: '滴滴打车领券',
                t3Btn: 'T3打车领券',
                hxzBtn: '花小猪打车领券',
                tcBtn: '同程打车领券',
                flowBtn: '流量卡办理',
                flightBtn: '美团机票优惠券',
                trainBtn: '美团火车票优惠券'
            };
            // ============== START: MODIFIED BLOCK ==============
            if (btnId.includes("allowance") && btnId.includes("_wechat_direct")) {
                btn.innerHTML = '<span></span>微信直接跳转';
            } else if (btnId.includes("allowance") && btnId.includes("_browser_copy")) {
                btn.innerHTML = '<span></span>浏览器点击复制';
            // ============== END: MODIFIED BLOCK ==============
            } else if (btnId.includes("_direct")) {
                if (btnId.includes("dianping") || btnId.includes("jd") || btnId.includes("allowance")) {
                    btn.innerHTML = '<span></span>直接跳转领券';
                } else {
                    btn.innerHTML = '<span></span>直接跳转';
                }
            } else if (btnId.includes("_showcode")) btn.innerHTML = '<span></span>口令';
            else if (btnId.includes("_copyopen")) btn.innerHTML = '<span></span>密令';
            else btn.innerHTML = `${btnTextMap[btnId] || "按钮"}`;
            btn.disabled = false;
        }
    }
};

// 配置中心
const Config = {
    coupons: {
        coupon1: { directUrl: "https://click.meituan.com/t?t=1&c=2&p=eLhY-b9z3K4g", copyOpenText: "1%复制信息#%打开团App http://¥gJZGVkOTcwZDI¥一起领" },
        coupon2: { directUrl: "https://click.meituan.com/t?t=1&c=2&p=PhNn479zCEMo", copyOpenText: "1%复制信息#%打开团App http://¥iiNTdjOWQzMTc¥一起领" },
        dianping1: { directUrl: "https://market.waimai.meituan.com/gd2/wm/4i838U?wm_ctype=dp_iphone&p=eLhY-b9z3K4g&t=1&c=2" },
        // ============== START: MODIFIED BLOCK (Removed allowance1 and allowance2) ==============
        // ============== END: MODIFIED BLOCK ==============
        group1: { directUrl: "https://click.meituan.com/t?t=1&c=2&p=luGf6r9zMj5J" },
        group2: { directUrl: "https://click.meituan.com/t?t=1&c=2&p=AQ2q4L9zt-4m" },
        tb1: { directUrl: "https://market.m.taobao.com/app/starlink/wakeup-transit/pages/download?star_id=8644&slk_force_set_request=true&scene=bf7d31dac823400abe7a6afae443acff", codeText: "淘宝闪购搜:00045", copyOpenText: "￥pENq4HXO8pM￥/ HU7405" },
        tb2: { directUrl: "https://m.duanqu.com/?_ariver_appid=8251537&page=plugin-private%3A%2F%2F2021004134685665%2Fpages%2Fcompose-reduce-guide%2Findex%3Ffrom%3Dminiapp.taobao%26channelInfo%3D%7B%22subSubChannel%22%3A%22miniapp.taobao.et%22%7D%26alsc_exsrc%3DES0006299852%26scene%3Db1305707a8a14bbea7b2e68730e1887c", codeText: "淘宝闪购搜:00049", copyOpenText: "￥LjII4HXp2Vh￥/ HU7405" },
        jd1: { directUrl: "https://u.jd.com/PDpPqN0" },
        jd2: { directUrl: "https://u.jd.com/PrdPOtn" }
    },
    taxiUrls: {
        didi: "https://vv.didi.cn/lOOPP7X?source_id=272227jutuike123456&ref_from=dunion",
        t3: "https://activity01.yunzhanxinxi.com/link/100054068c5bfb794ad81000czQqZ8p3",
        hxz: "https://x.huaxz.cn/M55aQWY?source_id=272227jutuike123456&ref_from=dunion",
        tc: "https://wx.17u.cn/carfe/app/slCoupons?mark=t6102213"
    },
    ticketUrls: {
        flight: "https://cube.meituan.com/cube/block/f886341b54b1eca9fa455fef37603003/356842/index.html?trafficchannel=ZvUdBdHaHhB_119545tkmm119550tkmm1001",
        train: "https://cube.meituan.com/cube/block/f886341b54b1eca9fa455fef37603003/356842/index.html?trafficchannel=ZvUdBdHaHhB_119545tkmm119550tkmm1001"
    },
    flowUrl: "https://hy.yunhaoka.com/#/pages/micro_store/index?agent_id=2ef179c2417751f42210db56129c38e0"
};

// 业务逻辑
const App = {
    init: () => {
        App.initLinkParser();
        App.initCouponPanels();
        App.initCoupons();
        App.initAllowanceCards(); // ============== ADDED THIS LINE ==============
        App.initTaxi();
        App.initTickets();
        App.initOtherServices();
        App.initQRCodeModal();
    },
    
    initLinkParser: () => {
        const pasteBox = document.getElementById("pasteBox");
        const pasteBtn = document.getElementById("pasteBtn");
        const goBtn = document.getElementById("goBtn");
        const clearBtn = document.getElementById("clearBtn");
        const homeBtn = document.getElementById("homeBtn");
        let extractedPoiId = "";
        
        pasteBox.addEventListener("input", (e) => {
            const text = e.target.value;
            const id = Tool.extractPoiId(text);
            if (id) {
                extractedPoiId = id;
                pasteBox.value = "粘贴成功，请点跳转按钮前往领券";
                pasteBox.style.color = "#0a84ff";
            } else if (text.trim() !== "" && !text.startsWith("粘贴成功")) {
                pasteBox.value = "未识别到店铺ID，请检查链接";
                pasteBox.style.color = "#ff3b30";
            } else {
                pasteBox.style.color = "#333";
            }
        });
        
        pasteBtn.addEventListener("click", async () => {
            pasteBox.focus();
            try {
                const text = await navigator.clipboard.readText();
                pasteBox.value = text;
                pasteBox.dispatchEvent(new Event('input', { bubbles: true }));
            } catch (err) {
                Tool.showToast("请手动粘贴链接");
            }
        });
        
        goBtn.addEventListener("click", () => {
            if (!extractedPoiId) {
                Tool.showToast("请先粘贴包含店铺ID的链接！");
                return;
            }
            Tool.setBtnLoading("goBtn");
            const jumpUrl = `https://offsiteact.meituan.com/web/hoae/collection_waimai_v8/index.html?wxapp_force_login=1&recallBiz=cpsH5Coupon&bizId=0c3bfd35279b4140b3bd8ecbc41301d6&mediumSrc1=0c3bfd35279b4140b3bd8ecbc41301d6&scene=CPS_SELF_SRC&pageSrc1=CPS_SELF_OUT_SRC_H5_LINK&pageSrc2=0c3bfd35279b4140b3bd8ecbc41301d6&pageSrc3=6d0510d3dae24fa9a64fd7b17d51cf21&activityId=6&mediaPvId=dafkdsajffjafdfs&mediaUserId=10086&outActivityId=6&hoaePageV=8&p=1002888487395418112&poi_id_str=${extractedPoiId}`;
            window.location.href = jumpUrl;
            setTimeout(() => Tool.setBtnLoading("goBtn", false), 2000);
        });
        
        clearBtn.addEventListener("click", () => {
            pasteBox.value = "";
            extractedPoiId = "";
            pasteBox.style.color = "#333";
        });
        
        homeBtn.addEventListener("click", () => {
            Tool.setBtnLoading("homeBtn");
            setTimeout(() => {
                window.location.href = "https://h5.waimai.meituan.com/waimai/mindex/home";
                Tool.setBtnLoading("homeBtn", false);
            }, 300);
        });
    },
    
    initCouponPanels: () => {
        const panelHeaders = document.querySelectorAll(".coupon-panel-header");
        panelHeaders.forEach(clickedHeader => {
            clickedHeader.addEventListener("click", () => {
                const clickedContent = document.getElementById(clickedHeader.getAttribute('data-target'));
                const wasExpanded = clickedContent.classList.contains('expanded');

                document.querySelectorAll('.coupon-panel-content.expanded').forEach(content => {
                    content.classList.remove('expanded');
                    const correspondingHeader = document.querySelector(`[data-target="${content.id}"]`);
                    if (correspondingHeader) {
                        correspondingHeader.querySelector('.panel-icon').classList.remove('expanded');
                    }
                });

                if (!wasExpanded) {
                    clickedContent.classList.add('expanded');
                    clickedHeader.querySelector('.panel-icon').classList.add('expanded');
                }
            });
        });
    },
    
    initCoupons: () => {
        Object.keys(Config.coupons).forEach(couponKey => {
            const config = Config.coupons[couponKey];
            const directBtn = document.getElementById(`${couponKey}_direct`);
            
            if (directBtn) {
                directBtn.addEventListener("click", () => {
                    Tool.setBtnLoading(`${couponKey}_direct`);
                    Tool.showToast('<span class="loading"></span>正在跳转...');
                    setTimeout(() => {
                        window.open(config.directUrl, "_blank");
                        Tool.setBtnLoading(`${couponKey}_direct`, false);
                    }, 100);
                });
            }
            
            if (couponKey.startsWith("coupon")) {
                const copyOpenBtn = document.getElementById(`${couponKey}_copyopen`);
                const textEl = document.getElementById(`${couponKey}_text`);
                if (copyOpenBtn && textEl) {
                    copyOpenBtn.addEventListener("click", () => {
                        Tool.setBtnLoading(`${couponKey}_copyopen`);
                        Tool.copyToClipboard(config.copyOpenText)
                            .then(() => Tool.showToast(`复制密令成功，请打开美团APP`))
                            .catch(() => Tool.showToast('复制失败，请手动复制'))
                            .finally(() => {
                                setTimeout(() => {
                                    Tool.setBtnLoading(`${couponKey}_copyopen`, false);
                                    textEl.textContent = config.copyOpenText;
                                }, 800);
                            });
                    });
                }
            }
            
            if (couponKey.startsWith("tb")) {
                const showCodeBtn = document.getElementById(`${couponKey}_showcode`);
                const copyOpenBtn = document.getElementById(`${couponKey}_copyopen`);
                const textEl = document.getElementById(`${couponKey}_text`);
                if (showCodeBtn && copyOpenBtn && textEl) {
                    showCodeBtn.addEventListener("click", () => textEl.textContent = config.codeText);
                    copyOpenBtn.addEventListener("click", () => {
                        Tool.setBtnLoading(`${couponKey}_copyopen`);
                        Tool.copyToClipboard(config.copyOpenText)
                            .then(() => Tool.showToast(`复制密令成功，请打开淘宝APP`))
                            .catch(() => Tool.showToast('复制失败，请手动复制'))
                            .finally(() => {
                                setTimeout(() => {
                                    Tool.setBtnLoading(`${couponKey}_copyopen`, false);
                                    textEl.textContent = config.copyOpenText;
                                }, 800);
                            });
                    });
                }
            }
        });
    },

    // ============== START: ADDED NEW FUNCTION ==============
    initAllowanceCards: () => {
        const allowanceConfig = {
            allowance1: {
                wechatUrl: "https://a.c1nb.cn/Ru8Uw",
                browserCopyText: "#小程序://美团外卖丨外卖美食奶茶咖啡水果/9zETxgS7ZOwXu2q"
            },
            allowance2: {
                wechatUrl: "https://a.c1nb.cn/Rt9GF",
                browserCopyText: "#小程序://美团外卖丨外卖美食奶茶咖啡水果/BHBX7pIDglpeV5J"
            }
        };

        Object.keys(allowanceConfig).forEach(key => {
            const config = allowanceConfig[key];
            const wechatBtn = document.getElementById(`${key}_wechat_direct`);
            const browserBtn = document.getElementById(`${key}_browser_copy`);

            if (wechatBtn) {
                wechatBtn.addEventListener("click", () => {
                    const btnId = wechatBtn.id;
                    Tool.setBtnLoading(btnId);
                    Tool.showToast('<span class="loading"></span>正在跳转...');
                    setTimeout(() => {
                        window.open(config.wechatUrl, "_blank");
                        Tool.setBtnLoading(btnId, false);
                    }, 100);
                });
            }

            if (browserBtn) {
                browserBtn.addEventListener("click", () => {
                    const btnId = browserBtn.id;
                    Tool.setBtnLoading(btnId);
                    Tool.copyToClipboard(config.browserCopyText)
                        .then(() => Tool.showToast('已自动复制链接，请在微信中打开'))
                        .catch(() => Tool.showToast('复制失败，请手动复制'))
                        .finally(() => {
                            setTimeout(() => {
                                Tool.setBtnLoading(btnId, false);
                            }, 800);
                        });
                });
            }
        });
    },
    // ============== END: ADDED NEW FUNCTION ==============
    
    initTaxi: () => {
        document.getElementById("didiBtn").addEventListener("click", () => { Tool.setBtnLoading("didiBtn"); Tool.showToast('<span class="loading"></span>正在跳转...'); setTimeout(() => { window.open(Config.taxiUrls.didi, "_blank"); Tool.setBtnLoading("didiBtn", false); }, 100); });
        document.getElementById("t3Btn").addEventListener("click", () => { Tool.setBtnLoading("t3Btn"); Tool.showToast('<span class="loading"></span>正在跳转...'); setTimeout(() => { window.open(Config.taxiUrls.t3, "_blank"); Tool.setBtnLoading("t3Btn", false); }, 100); });
        document.getElementById("hxzBtn").addEventListener("click", () => { Tool.setBtnLoading("hxzBtn"); Tool.showToast('<span class="loading"></span>正在跳转...'); setTimeout(() => { window.open(Config.taxiUrls.hxz, "_blank"); Tool.setBtnLoading("hxzBtn", false); }, 100); });
        document.getElementById("tcBtn").addEventListener("click", () => { Tool.setBtnLoading("tcBtn"); Tool.showToast('<span class="loading"></span>正在跳转...'); setTimeout(() => { window.open(Config.taxiUrls.tc, "_blank"); Tool.setBtnLoading("tcBtn", false); }, 100); });
    },
    
    initTickets: () => {
        document.getElementById("flightBtn").addEventListener("click", () => { Tool.setBtnLoading("flightBtn"); Tool.showToast('<span class="loading"></span>正在跳转美团机票...'); setTimeout(() => { window.open(Config.ticketUrls.flight, "_blank"); Tool.setBtnLoading("flightBtn", false); }, 100); });
        document.getElementById("trainBtn").addEventListener("click", () => { Tool.setBtnLoading("trainBtn"); Tool.showToast('<span class="loading"></span>正在跳转美团火车票...'); setTimeout(() => { window.open(Config.ticketUrls.train, "_blank"); Tool.setBtnLoading("trainBtn", false); }, 100); });
    },
    
    initOtherServices: () => {
        document.getElementById("flowBtn").addEventListener("click", () => { Tool.setBtnLoading("flowBtn"); Tool.showToast('<span class="loading"></span>正在跳转...'); setTimeout(() => { window.open(Config.flowUrl, "_blank"); Tool.setBtnLoading("flowBtn", false); }, 100); });
    },
    
    initQRCodeModal: () => {
        const qrCodeBtn = document.getElementById("qrCodeBtn");
        const modal = document.getElementById("qrModal");
        const closeBtn = document.querySelector(".close");
        qrCodeBtn.addEventListener("click", () => modal.style.display = "flex");
        closeBtn.addEventListener("click", () => modal.style.display = "none");
        window.addEventListener("click", (event) => { if (event.target === modal) modal.style.display = "none"; });
    }
};

window.addEventListener("DOMContentLoaded", () => App.init());
