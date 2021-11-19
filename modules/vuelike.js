// 以下开始大概模仿VUE的运作原理
class VueLike {
    // 一个 VUE 的组件里会有的内容
    constructor(_opt = {}) {
        const opt = {
            data() { return {} },
            ..._opt,
        }
        
        this.$el = null;
        // 下面这些属于原型链中的定义
        this.vdomMap = new Map()
        this.reflect = {}
        this.render = opt.render;

        // 设置变量绑定
        for (const [key, val] of Object.entries(opt)) {
            if (key === 'data' || key === 'template') continue;
            this[key] = val;
        }
        // 设置变量绑定
        for (const [key, val] of Object.entries(opt.data())) {
            this.$set(key, val);
        }

        // 初始化Render列表，这个步骤实际上是 Vue-Cli 处理的
        if ('template' in opt) {
            this.initRender(opt.template);
        }
    }

    // 变量映射
    $set(key, val) {
        this[`_${key}`] = val;
        Object.defineProperty(this, key, {
            get() {
                return this[`_${key}`];
            },
            set(v) {
                this[`_${key}`] = v;
                this.refreshHTML(key);
            }
        });
    }

    $mount(parent) {
        const rendering = (list, parent, callback) => {
            for (const vdom of list) {
                if ('$mount' in vdom) {
                    vdom.$mount(this);
                    continue;
                }
                // 创建 DOM
                const dom = document.createElement(vdom.tag);
                // 返回 $el
                typeof callback === 'function' && callback(dom);
                // 检查 HTML 之中是否有 Data 变量存在
                vdom.html && this._refreshHTML(dom, vdom, key => {
                    dom.setAttribute('v-data', vdom.dataKey)
                    // 映射数据源
                    if (!this.vdomMap.has(vdom.dataKey)) this.vdomMap.set(vdom.dataKey, vdom);
                    if (!this.reflect[key]) this.reflect[key] = new Set();
                    this.reflect[key].add(dom);
                });

                for (const [key, val] of Object.entries(vdom.attrs)) {
                    // 绑定元素事件
                    if (/^v-on/.test(key)) {
                        this.bindEvent(key, val, dom)
                    } else if (/^v-/.test(key)) {
                        this.setVueBind(key, val, dom);
                    } else {
                        dom.setAttribute(key, val);
                    }
                }
                const parentElement = parent || document.body.querySelector('#app') || document.body;
                // 渲染节点
                parentElement.appendChild(dom);
                // 渲染后代
                vdom.children.length && rendering(vdom.children, dom);
            }
        }
        rendering([this.render], null, (dom => {
            this.$el = dom;
            this.$parent = parent;
        }));
    }

    refreshHTML(key) {
        for (const dom of this.reflect[key]) {
            this._refreshHTML(dom);
        }
    }

    _refreshHTML(dom, _vdom, cb) {
        const vdom = _vdom || this.vdomMap.get(dom.getAttribute('v-data'));
        if (!vdom) return;

        let html = vdom.html;
        const list = html.match(/{{(.*?)}}/g);
        list && list.forEach(str => {
            const key = str.replace(/{{(.*?)}}/, '$1');
            html = html.replace(str, this[key]);

            typeof cb === 'function' && cb(key);
        });

        dom.innerHTML = html;
    }

    setVueBind(key, val, dom) {
        if (key === 'v-model') {
            dom.value = this[val];
            dom.oninput = () => {
                this[val] = dom.value;
            }
        }
        if (key === 'v-model.lazy') {
            dom.value = this[val];
            dom.onchange = () => {
                this[val] = dom.value;
            }
        }
    }

    initRender(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        const template = div.firstElementChild;

        const createRender = (nodeList, parent) => {
            for (const node of nodeList) {
                const vdom = {
                    tag: node.tagName.toLowerCase(),
                    dataKey: getUUID()(true).slice(-8),
                    html: node.innerHTML,
                    children: [],
                    attrs: {},
                }

                Array.from(node.attributes).forEach((attr) => {
                    const key = attr.name
                        .replace(/^class/g, 'className')
                        .replace(/^@/g, 'v-on:')
                        .replace(/^:/g, 'v-bind:');

                    vdom.attrs[key] = attr.nodeValue;
                })

                if (node.children.length > 0) {
                    vdom.html = '';
                    createRender(node.children, vdom);
                }

                if (parent) {
                    parent.children.push(vdom);
                } else {
                    this.render = vdom;
                }
            }
        }

        createRender([template])
    }

    bindEvent(key, val, dom) {
        console.log(this);
        const vm = this;
        const [, eventName, ...modifiers] = key.split(/:|\./g);
        const [methodName] = val.split(/\(/g);

        const useCapture = modifiers.indexOf('stop') >= 0;
        const preventDefault = modifiers.indexOf('prevent') >= 0;

        dom.addEventListener(eventName, (event) => {
            // 修饰符有阻止默认事件时
            if (preventDefault) event.preventDefault();
            // 执行绑定事件
            vm.methods[methodName].call(vm, event);
        }, useCapture)
    }
}

window.VueLike = VueLike;